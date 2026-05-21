import { UserListResponse, UserParams, UserResponse } from "@/model/user-model";
import { userService } from "@/services/user-services";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

export function useUsersHook(params: UserParams) {
    return useQuery<UserListResponse, AxiosError<string>>({
        queryKey: ['get-users', params],
        queryFn: () => userService.get(params),
        staleTime: 1000 * 10,
        refetchOnWindowFocus: true,
        placeholderData: keepPreviousData,
    });
}

export function useUserByIdHook(id: number) {
    return useQuery<UserResponse, AxiosError<string>>({
        queryKey: ['get-users-by-id', id],
        queryFn: () => userService.getById(id),
        staleTime: 1000 * 10,
        refetchOnWindowFocus: true
    });
}