import { RequestParam } from "@/lib/request-param";
import { MACHINE_STATUS } from "@/lib/status";
import { ApiResponses } from "@/types/api-responses";

export type MaintenanceHistory = {
    id: number,
    machineId: number,
    machineName: string,
    code: MACHINE_STATUS,
    userId: number | null,
    userName: string | null,
    productId: number | null,
    productPartName: string | null,
    productPartNo: string | null,
    createdAt: string,
    updatedAt: string | null,
    duration: number,
    qty: number,
    maintenanceDetails: {
        id: number,
        maintenanceOperatorId: number | null,
        maintenanceOperatorName: string | null,
        reason: string | null,
        createdAt: string,
        updatedAt: string | null,
    }[],
};

export interface MaintenanceHistoryParams extends RequestParam {
    machineId?: number,
    code?: MACHINE_STATUS,
    startDate?: string,
    endDate?: string,
}

export type MaintenanceHistoryResponse = ApiResponses<MaintenanceHistory[]>;
