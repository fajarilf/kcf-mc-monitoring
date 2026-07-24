"use client";

import { useState } from "react";
import { Download, Pencil, Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useProductHook } from "@/hooks/use-product";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { Pagination } from "@/components/ui/pagination";
import { ProductUpdateModal } from "./ProductUpdateModal";
import { productService } from "@/services/product-service";
import { exportListToExcel } from "@/lib/excel/export-list";
import type { ProductData } from "@/model/product-model";

const PAGE_SIZE = 10;
const COLUMN_COUNT = 6;

export function ProductListTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editProduct, setEditProduct] = useState<ProductData | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
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

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await productService.get({ paginate: false });
      const allProducts: ProductData[] = res.data ?? [];
      await exportListToExcel(
        "Products",
        [
          { header: "Product No", key: "productNo", width: 20 },
          { header: "Part No", key: "partNo", width: 20 },
          { header: "Part Name", key: "partName", width: 25 },
          { header: "Customer", key: "customer", width: 20 },
          { header: "RPM", key: "rpm", width: 10 },
        ],
        allProducts.map((p) => ({
          productNo: p.productNo,
          partNo: p.partNo,
          partName: p.partName,
          customer: p.customer ?? "-",
          rpm: p.rpm ?? "-",
        })),
        "products.xlsx",
      );
      toast.success("Products exported");
    } catch (err) {
      toast.error("Failed to export products");
      console.error(err);
    } finally {
      setExporting(false);
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
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
        >
          <Download className="mr-2 size-4" />
          {exporting ? "Exporting…" : "Export to Excel"}
        </Button>
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Product No</TableHead>
                <TableHead>Part No</TableHead>
                <TableHead>Part Name</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>RPM Value</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    {Array.from({ length: COLUMN_COUNT }).map((_, col) => (
                      <TableCell key={col} className={col === 0 ? "pl-6" : col === COLUMN_COUNT - 1 ? "pr-6" : ""}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data?.data?.length ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={COLUMN_COUNT} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="size-8 opacity-30" />
                      <p className="text-sm font-medium">No products found</p>
                      <p className="text-xs">
                        Try adjusting your search or create a new product.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="pl-6">{product.productNo}</TableCell>
                    <TableCell>{product.partNo}</TableCell>
                    <TableCell>{product.partName}</TableCell>
                    <TableCell>{product.customer || "-"}</TableCell>
                    <TableCell>{product.rpm ?? "-"}</TableCell>
                    <TableCell className="pr-6 text-right">
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
          <Pagination
            page={pagination?.page ?? 1}
            totalPages={pagination?.totalPages ?? 1}
            onPageChange={setPage}
            total={pagination?.total}
            pageSize={PAGE_SIZE}
          />
        </CardContent>
      </Card>
    </div>
    </>
  );
}
