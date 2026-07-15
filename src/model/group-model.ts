import { ApiResponses } from "@/types/api-responses";

export type GroupData = {
    id: number,
    name: string,
};

export type GroupResponse = ApiResponses<GroupData>;
export type GroupListResponse = ApiResponses<GroupData[]>;
