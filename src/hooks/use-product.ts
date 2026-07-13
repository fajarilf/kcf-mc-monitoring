import { ProductParam, ProductResponse } from "@/model/product-model";
import { productService } from "@/services/product-service";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

export function useProductHook(params?: ProductParam, options?: { enabled?: boolean }) {
    return useQuery<ProductResponse, AxiosError<string>>({
        queryKey: ["use-product-hook", params],
        queryFn: () => productService.get(params),
        staleTime: 1000 * 10,
        refetchOnWindowFocus: true,
        placeholderData: keepPreviousData,
        enabled: options?.enabled,
    });
}