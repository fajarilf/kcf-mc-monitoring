import api from "@/lib/api";
import { ProductParam, ProductResponse } from "@/model/product-model";

class ProductService {

    private base_url = "/products"

    async get(params?: ProductParam): Promise<ProductResponse> {
        const res = await api.get(this.base_url, { params });
        return res.data as ProductResponse;
    }

}

export const productService = new ProductService();