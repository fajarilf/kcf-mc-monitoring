import { GroupListResponse, GroupResponse } from "@/model/group-model";
import { groupService } from "@/services/group-service";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

export function useGroupHook() {
    return useQuery<GroupListResponse, AxiosError<string>>({
        queryKey: ["get-groups"],
        queryFn: () => groupService.get(),
        staleTime: 1000 * 10,
        refetchOnWindowFocus: true,
        placeholderData: keepPreviousData,
    });
}

export function useGroupByIdHook(id: number) {
    return useQuery<GroupResponse, AxiosError<string>>({
        queryKey: ["get-group-by-id", id],
        queryFn: () => groupService.getById(id),
        staleTime: 1000 * 10,
        refetchOnWindowFocus: true,
        placeholderData: keepPreviousData,
    });
}
