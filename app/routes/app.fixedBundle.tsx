import { useState } from "react";
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
    Tag
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

            setProductIds(ids);
        }
    }

    return (
        <Page>
            <TitleBar title="Fixed Bundle" />

            <Layout>
                <Layout.Section>
                    <Card>

                        <Button onClick={selectProduct} id="select-product">
                            Select product
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
            </Layout>

        </Page>
    );
}