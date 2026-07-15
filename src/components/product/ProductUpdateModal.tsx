"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { productService } from "@/services/product-service";
import type { ProductData } from "@/model/product-model";

type Props = {
  product: ProductData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function ProductUpdateModal({ product, open, onOpenChange, onSuccess }: Props) {
  const [productNo, setProductNo] = useState(product?.productNo ?? "");
  const [partNo, setPartNo] = useState(product?.partNo ?? "");
  const [partName, setPartName] = useState(product?.partName ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!product) return;

    setSubmitting(true);
    try {
      await productService.update(product.id, { productNo, partNo, partName });
      toast.success(`Product "${partName}" updated`);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error("Failed to update product");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Product</DialogTitle>
          <DialogDescription>
            Edit product details and save changes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="productNo">Product No</Label>
            <Input
              id="productNo"
              value={productNo}
              onChange={(e) => setProductNo(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="partNo">Part No</Label>
            <Input
              id="partNo"
              value={partNo}
              onChange={(e) => setPartNo(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="partName">Part Name</Label>
            <Input
              id="partName"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
