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
  const isEdit = !!product;
  const [productNo, setProductNo] = useState(product?.productNo ?? "");
  const [partNo, setPartNo] = useState(product?.partNo ?? "");
  const [partName, setPartName] = useState(product?.partName ?? "");
  const [customer, setCustomer] = useState(product?.customer ?? "");
  const [rpm, setRpm] = useState(product?.rpm ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      if (isEdit && product) {
        await productService.update(product.id, { productNo, partNo, partName, customer, rpm });
        toast.success(`Product "${partName}" updated`);
      } else {
        await productService.create({ productNo, partNo, partName, customer, rpm });
        toast.success(`Product "${partName}" created`);
      }
      
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(isEdit ? "Failed to update product" : "Failed to create product");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Update Product" : "Create Product"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Edit product details and save changes." : "Add a new product to the system."}
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
          <div className="grid gap-2">
            <Label htmlFor="customer">Customer</Label>
            <Input
              id="customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rpm">RPM Value</Label>
            <Input
              id="rpm"
              value={rpm}
              onChange={(e) => setRpm(e.target.value)}
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
              {submitting 
                ? (isEdit ? "Saving…" : "Creating…") 
                : (isEdit ? "Save Changes" : "Create Product")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
