import { MACHINE_STATUS } from "@/lib/status";
import { ApiResponses } from "../types/api-responses";

export type MachineResponse = ApiResponses<MachineData>;
export type MachineListResponse = ApiResponses<MachineData[]>;

export interface MachineData {
    id: number,
    name: string,
    status: MACHINE_STATUS,
    elapsedSeconds: number,
    created_at: Date,
}