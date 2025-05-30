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
    Grid
  } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { Product } from "@shopify/app-bridge-types";

export default function FixedBundlePage() {
    const [products, setProducts] = useState<Product[]>([]);
    
    // https://shopify.dev/docs/api/app-bridge-library/apis/resource-picker
    async function selectProduct() {
        const selectedProducts = await shopify.resourcePicker({
            type: "product",
            multiple: true
        }) as Product[] | undefined;

        if (selectedProducts) {
            setProducts(products.concat(selectedProducts));
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
                                <Box borderColor="border" borderWidth="025" borderRadius="200" padding="200" key={product.id}>
                                    <Text as="h3" variant="headingMd">{product.title}</Text>
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