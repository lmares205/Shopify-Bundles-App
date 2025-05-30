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

            <Button onClick={selectProduct} id="select-product">
                Select product
            </Button>

        </Page>
    );
}