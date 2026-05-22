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

/** Optional filters for the status timeline request — adjust to match the API. */
export interface StatusTimelineParams extends RequestParam {
    machineId: number,
    starDate: Date,
    endDate: Date,
    userId: number
}

export type StatusTimelineResponse = ApiResponses<MachineTimeline[]>;
