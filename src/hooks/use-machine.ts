import { MachineListResponse, MachineResponse } from "@/model/machine-model";
import { machineService } from "@/services/machine-service";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

export function useMachineHook() {
    return useQuery<MachineListResponse, AxiosError<string>>({
        queryKey: ["get-machines"],
        queryFn: () => machineService.get(),
        staleTime: 1000 * 10,
        refetchOnWindowFocus: true,
        placeholderData: keepPreviousData,
    });
}

export function useMachineByIdHook(id: number) {
    return useQuery<MachineResponse, AxiosError<string>>({
        queryKey: ["get-machine-by-id", id],
        queryFn: () => machineService.getById(id),
        staleTime: 1000  * 10,
        refetchOnWindowFocus: true,
        placeholderData: keepPreviousData,
    });
}