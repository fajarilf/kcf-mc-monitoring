import { RequestParam } from "@/lib/request-param";
import { ApiResponses } from "@/types/api-responses";

/** Lifecycle state of an alarm. */
export type AlarmStatus = "triggered" | "recovered";

/** A single alarm-history record returned by /alarm-histories. */
export type AlarmHistory = {
    id: number,
    machineId: number,
    machineName: string,
    status: AlarmStatus,
    triggerTime: string,
    recoverTime: string | null,
    message: string,
    timestamp: string,
    createdAt: string,
    updatedAt: string,
};

/** Optional filters for the alarm-history request. */
export interface AlarmHistoryParams extends RequestParam {
    machineId?: number,
    status?: AlarmStatus,
    startDate?: string,
    endDate?: string,
}

export type AlarmHistoryResponse = ApiResponses<AlarmHistory[]>;
