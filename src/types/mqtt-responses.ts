import { MachineStatus } from "@/lib/mock-data"

export interface MqttResponses {
    Machine: {
        NAME: string,
        OPERATORNAME: string,
        WORKNAME: string,
        PRODUCTCOUNTER: number,
        STATUS: MachineStatus,
        TIMECOUNTER: number,
    }
    timestamp: Date
}