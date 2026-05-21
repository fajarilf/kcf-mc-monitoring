import { RequestParam } from "@/lib/request-param";
import { ApiResponses } from "@/types/api-responses"

export type UserResponse = ApiResponses<UserData>;

export type UserListResponse = ApiResponses<UserData[]>;

export type UserParams = RequestParam;

export type UserData = {
    id: number,
    name: string,
    email?: string,
    username?: string, 
    role: string,
    groupName?: string,
    machineName?: string
}