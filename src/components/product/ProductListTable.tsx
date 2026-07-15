"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProductHook } from "@/hooks/use-product";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { Pagination } from "@/components/ui/pagination";
import { ProductUpdateModal } from "./ProductUpdateModal";
import type { ProductData } from "@/model/product-model";

export function ProductListTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editProduct, setEditProduct] = useState<ProductData | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  // Reset to page 1 when search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };
  const { data, isLoading, refetch } = useProductHook({
    search: debouncedSearch,
    page,
    paginate: true,
  });

  const pagination = data?.pagination;

  const handleUpdate = (product: ProductData) => {
    setEditProduct(product);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDelete = (product: ProductData) => {
    // TODO: confirm and delete
  };

  return (
    <>
    <ProductUpdateModal
      key={editProduct?.id}
      product={editProduct}
      open={!!editProduct}
      onOpenChange={(open) => !open && setEditProduct(null)}
      onSuccess={() => refetch()}
    />
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search products..."
        value={search}
        onChange={handleSearchChange}
        className="max-w-sm"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-90.5">Product No</TableHead>
              <TableHead className="w-90.5">Part No</TableHead>
              <TableHead>Part Name</TableHead>
              <TableHead className="w-90.5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : !data?.data?.length ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.productNo}</TableCell>
                  <TableCell>{product.partNo}</TableCell>
                  <TableCell>{product.partName}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdate(product)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
    </>
  );
}
