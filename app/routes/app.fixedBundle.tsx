import { useState, useCallback } from "react";
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

export default function FixedBundlePage() {
    interface SelectedProductIds {
        id: string;
        variants: {id: string}[];
    }

    const [products, setProducts] = useState<Product[]>([]);
    const [productIds, setProductIds] = useState<SelectedProductIds[]>([]);
    const [bundleName, setBundleName] = useState<string>("");
    const [variantsCount, setVariantsCount] = useState<number>(0);
    
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
                if (product.variants) {
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

    async function createBundle() {

    }

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
                            products.map(product => (
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
                                        {product.variants && product.variants.length > 1 ? (
                                            product.variants.map(variant => (
                                                <Tag key={variant.id}>{variant.title}</Tag>
                                            ))
                                        ) : null}
                                    </div>
                                </Box>
                            ))
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
                            <Button variant="primary" onClick={createBundle}>Create Bundle</Button>
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>

        </Page>
    );
}