import { MACHINE_STATUS } from "@/lib/status"

export interface MqttResponses {
    Machine: {
        NAME: string,
        OPERATORNAME: string,
        WORKNAME: string,
        PRODUCTCOUNTER: number,
        STATUS: MACHINE_STATUS,
        TIMECOUNTER: number,
        MAINTENANCE_OP: string,
        REASON: string,
    }
    timestamp: Date
}