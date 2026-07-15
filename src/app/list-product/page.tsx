"use client";

import { ProductListTable } from "@/components/product/ProductListTable";

export default function ListProductPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold">Product List</h2>
        <p className="text-sm text-muted-foreground">
          Manage products. Search, update, or delete entries.
        </p>
      </div>
      <ProductListTable />
    </div>
  );
}
