import { RequestParam } from "@/lib/request-param";
import { ApiResponses } from "@/types/api-responses"

export type ProductData = {
    id: number,
    productNo: string,
    partName: string,
    partNo: string,
    createdAt?: Date,
    customer?: string,
    rpmValue?: number | string,
}

export type ProductUpdatePayload = {
    productNo: string,
    partName: string,
    partNo: string,
}

export type ProductCreatePayload = {
    productNo: string,
    partName: string,
    partNo: string,
}

export type ProductParam = RequestParam;
export type ProductResponse = ApiResponses<ProductData[]>;