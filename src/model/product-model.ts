import { RequestParam } from "@/lib/request-param";
import { ApiResponses } from "@/types/api-responses"

export type ProductData = {
    id: number,
    productNo: string,
    partName: string,
    partNo: string,
    createdAt?: Date
}

export type ProductParam = RequestParam;
export type ProductResponse = ApiResponses<ProductData[]>;