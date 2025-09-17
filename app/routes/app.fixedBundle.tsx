import { useState, useCallback, useEffect } from "react";
import {
    Box,
    Card,
    Layout,
    Link,
    List,
    Page,
    Text,
    BlockStack,
    Button,
    EmptyState,
    Grid,
    Tag,
    TextField
  } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { Product } from "@shopify/app-bridge-types";
import { useActionData, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { json, ActionFunctionArgs } from "@remix-run/node";

function extractOptionSelections(product: Product): {componentOptionId: string, name: string, values: string[]}[] {
    const selections: {componentOptionId: string, name: string, values: string[]}[] = [];
        product.options.forEach((option) => {
            selections.push({
                componentOptionId: option.id,
                name: option.name,
                values: option.values
            });
        });
    return selections;
}

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const bundleName = formData.get("bundleName");
    const productsJson = formData.get("products");
    const products = productsJson ? JSON.parse(productsJson as string) : [];
    const { admin } = await authenticate.admin(request);

    if (!bundleName || !Array.isArray(products) || products.length < 2) {
        return json({ error: "Invalid bundle data." }, { status: 400 });
    }

    const data = {
        title: bundleName,
        components: products.map(product => ({
            quantity: 1,
            productId: product.id,
            optionSelections: extractOptionSelections(product)
        }))
    };

    const createBundleGraphQL = `
        mutation productBundleCreate($input: ProductBundleCreateInput!) {
            productBundleCreate(input: $input) {
                productBundleOperation {
                    id
                    product {
                        handle
                    }
                    status
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    try {
        const response = await admin.graphql(createBundleGraphQL, { variables: { input: data } });
        const responseJson = await response.json();

        if (responseJson.data?.productBundleCreate?.userErrors?.length) {
            return json({ error: responseJson.data.productBundleCreate.userErrors }, { status: 400 });
        }

        return json({
            success: true,
            bundle: responseJson.data.productBundleCreate.productBundleOperation
        });
    } catch (err) {
        return json({ error: err.message || "Unknown error" }, { status: 500 });
    }
}

export default function FixedBundlePage() {
    interface SelectedProductIds {
        id: string;
        variants: {id: string}[];
    }

    const [products, setProducts] = useState<Product[]>([]);
    const [productIds, setProductIds] = useState<SelectedProductIds[]>([]);
    const [bundleName, setBundleName] = useState<string>("");
    const [variantsCount, setVariantsCount] = useState<number>(0);
    const [enableCreateButton, setEnableCreateButton] = useState<boolean>(false);
    const errors = useActionData()?.errors || {};
    const fetcher = useFetcher();
    
    // https://shopify.dev/docs/api/app-bridge-library/apis/resource-picker
    async function selectProduct() {
        const selectedProducts = await shopify.resourcePicker({
            type: "product",
            multiple: true,
            selectionIds: productIds,
        }) as Product[] | undefined;

        if (selectedProducts) {
            setProducts(selectedProducts);

            const ids : SelectedProductIds[] = [];
            selectedProducts.forEach(product => {
                let productObj : SelectedProductIds = {'id': product.id, 'variants': []};
                if (product.variants && !product.hasOnlyDefaultVariant) {
                    product.variants.forEach(variant => {
                        productObj.variants.push({'id': variant.id!});
                    });
                }
                ids.push(productObj);
            });

            if (selectedProducts.length > 0) {
                let computedVariants = 1;
                selectedProducts.forEach(product => {
                    if (product.variants && !product.hasOnlyDefaultVariant) {
                        let options = product.options;
                        options.forEach(option => {
                            computedVariants *= option.values.length;
                        });
                    }
                });
                setVariantsCount(computedVariants);
            } else {
                setVariantsCount(0);
            }

            setProductIds(ids);
        }
    }

    const handleBundleNameChange = useCallback((value: string) => {
        setBundleName(value);
    }, []);

    // validation:
    // bundle can have up to 30 components
    // no nested bundles
    // has a bundle title
    // max number of variants 2000
    function validateBundle() {
        console.log(products);
        if (products.length > 30 || products.length < 2 || bundleName === '' || variantsCount > 2000 || variantsCount < 1) {
            setEnableCreateButton(false);
            return;
        }

        setEnableCreateButton(true);
    }

    useEffect(() => {
        validateBundle();
    }, [products, bundleName, variantsCount]);

    return (
        <Page>
            <TitleBar title="Fixed Bundle" />

            <Layout>
                <Layout.Section>
                    <Card>

                        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', gap: '15px', marginBottom: '20px'}}>
                            <Text as="h3" variant="headingMd">Bundle Name</Text>
                            <TextField label="Bundle Name" value={bundleName} onChange={handleBundleNameChange} autoComplete="off" labelHidden />
                        </div>

                        <Button onClick={selectProduct} id="select-product">
                            Select products
                        </Button>

                        {products.length > 0 ? (
                            <div className="products" style={{display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px'}}>
                                {products.map(product => (
                                    <Box borderColor="border" borderWidth="025" borderRadius="200" padding="500" key={product.id}>
                                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'start', gap: '20px', marginBottom: '20px'}}>
                                            {product.images && product.images.length > 0 ? (
                                                <img src={product.images[0].originalSrc} alt={product.title} width={150} style={{objectFit: 'contain', borderRadius: '10px'}} />
                                            ) : (
                                                <img src="" alt={product.title} width={150} style={{objectFit: 'contain', borderRadius: '10px'}} />
                                            )}
                                            <Text as="h3" variant="headingMd">{product.title}</Text>
                                        </div>

                                        <div className="selected-variants" style={{display: 'flex', gap: '10px'}}>
                                            {product.variants && !product.hasOnlyDefaultVariant ? (
                                                product.variants.map(variant => (
                                                    <Tag key={variant.id}>{variant.title}</Tag>
                                                ))
                                            ) : null}
                                        </div>
                                    </Box>
                                ))}
                            </div>
                        ) : (
                            <EmptyState image="" heading="No products selected">
                                <Text as="p" variant="bodyMd">Select products to add them to the bundle</Text>
                            </EmptyState>
                        )}

                    </Card>

                </Layout.Section>

                <Layout.Section variant="oneThird">
                    <Card>
                        <Text as="h3" variant="headingMd">Bundle Validation</Text>
                        <BlockStack gap="200">
                        <fetcher.Form method="post">
                          <input type="hidden" name="bundleName" value={bundleName} />
                          <input type="hidden" name="products" value={JSON.stringify(products)} />
                          <Button
                            submit
                            disabled={!enableCreateButton}
                          >
                            Create Bundle
                          </Button>
                        </fetcher.Form>
                        </BlockStack>
                        {fetcher.data?.success && (
                          <Text as="h3" variant="headingMd">Bundle created successfully!</Text>
                        )}
                        {fetcher.data?.error && (
                          <Text as="h3" variant="headingMd">Error: {JSON.stringify(fetcher.data.error)}</Text>
                        )}
                    </Card>
                </Layout.Section>
            </Layout>

        </Page>
    );
}