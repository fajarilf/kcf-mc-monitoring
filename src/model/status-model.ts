import { RequestParam } from "@/lib/request-param";
import { ApiResponses } from "@/types/api-responses";
import { MACHINE_STATUS } from "@/lib/status";

/** A single status segment within a production group's timeline. */
export type ProductionSegment = {
    start: string,
    end: string | null,
    status: MACHINE_STATUS,
};

/** A production group containing segments for one operator/product combination. */
export type ProductionGroup = {
    user: string,
    productName: string | null,
    partNo: string | null,
    quantity: number,
    timeline: ProductionSegment[],
};

/** Timeline data for one machine. */
export type MachineTimeline = {
    machineId: number,
    machineName: string,
    production: ProductionGroup[],
};

type StatusParams = {
    machineId?: number,
    startDate?: string,
    endDate?: string,
    userId?: number
}

type StatusActivityDetail = {
    operator: string,
    product: string,
    code: MACHINE_STATUS,
    totalTime: number,
}

export type MachineActivity = {
    date: Date,
    details: StatusActivityDetail[],
}

/** Optional filters for the status timeline request*/
export interface StatusTimelineParams extends RequestParam, StatusParams {}

export interface StatusActivityParams extends RequestParam, StatusParams {
    productId?: number,
    code?: number,
}

export type StatusTimelineResponse = ApiResponses<MachineTimeline[]>;
export type StatusTimelineByIdResponse = ApiResponses<MachineTimeline>;
export type StatusActivityResponse = ApiResponses<MachineActivity[]>;