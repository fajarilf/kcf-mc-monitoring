"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import { productService } from "@/services/product-service";
import type { ProductData } from "@/model/product-model";

export function ProductListTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editProduct, setEditProduct] = useState<ProductData | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductData | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  const handleDelete = (product: ProductData) => {
    setDeleteTarget(product);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productService.delete(deleteTarget.id);
      toast.success(`Product "${deleteTarget.partName}" deleted`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error("Failed to delete product");
      console.error(err);
    } finally {
      setDeleting(false);
    }
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
    <ProductUpdateModal
      product={null}
      open={createOpen}
      onOpenChange={setCreateOpen}
      onSuccess={() => refetch()}
    />
    <ConfirmDialog
      open={!!deleteTarget}
      onOpenChange={(open) => !open && setDeleteTarget(null)}
      title="Delete product?"
      description={deleteTarget ? `"${deleteTarget.partName}" will be permanently deleted.` : ""}
      loading={deleting}
      onConfirm={handleConfirmDelete}
    />
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          Create Product
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-90.5">Product No</TableHead>
              <TableHead className="w-90.5">Part No</TableHead>
              <TableHead>Part Name</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>RPM Value</TableHead>
              <TableHead className="w-90.5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : !data?.data?.length ? (
              <TableRow>
                <TableCell
                  colSpan={6}
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
                  <TableCell>{product.customer || "-"}</TableCell>
                  <TableCell>{product.rpm ?? "-"}</TableCell>
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
