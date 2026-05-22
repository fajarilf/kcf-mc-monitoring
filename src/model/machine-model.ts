import { ApiResponses } from "../types/api-responses";

export type MachineResponse = ApiResponses<MachineData>;

export interface MachineData {
    machine_id: number,
    machine_name: string,
    created_at: Date,
    updated_at: Date
}