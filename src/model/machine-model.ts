import { MACHINE_STATUS } from "@/lib/status";
import { ApiResponses } from "../types/api-responses";

export type MachineResponse = ApiResponses<MachineData>;
export type MachineListResponse = ApiResponses<MachineData[]>;

export interface MachineData {
    id: number,
    name: string,
    created_at: Date,
}

export type MachineInformation = {
  operator: string,
  product: string,
  counter_product: number,
  timer_elapsed: number,
  status: MACHINE_STATUS,
}