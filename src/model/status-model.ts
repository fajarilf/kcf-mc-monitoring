import { RequestParam } from "@/lib/request-param";
import { ApiResponses } from "@/types/api-responses";
import { MACHINE_STATUS } from "@/lib/status";

/** A single status segment within a machine's timeline. */
export type TimelineSegment = {
    start: string,
    end: string | null,
    status: MACHINE_STATUS,
};

/** Timeline data for one machine. */
export type MachineTimeline = {
    machineId: number,
    machineName: string,
    timeline: TimelineSegment[],
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
    productId?: string,
    code?: number,
}

export type StatusTimelineResponse = ApiResponses<MachineTimeline[]>;
export type StatusActivityResponse = ApiResponses<MachineActivity[]>;