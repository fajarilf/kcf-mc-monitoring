import api from "@/lib/api";
import { ProductParam, ProductResponse, ProductUpdatePayload } from "@/model/product-model";

class ProductService {

    private base_url = "/products"

    async get(params?: ProductParam): Promise<ProductResponse> {
        const res = await api.get(this.base_url, { params });
        return res.data as ProductResponse;
    }

    async update(id: number, data: ProductUpdatePayload): Promise<ProductResponse> {
        const res = await api.put(`${this.base_url}/${id}`, data);
        return res.data as ProductResponse;
    }

}

export const productService = new ProductService();