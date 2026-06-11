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

/**
 * Lightweight backend reachability probe. Polls the machine list on a fixed
 * interval (even in the background) so a connection indicator can reflect the
 * live API status. Kept separate from the data hooks so its aggressive refetch
 * cadence does not affect pages that render machine data.
 */
export function useApiHealthHook(intervalMs = 1000 * 15) {
    return useQuery<MachineListResponse, AxiosError<string>>({
        queryKey: ["api-health"],
        queryFn: () => machineService.get(),
        refetchInterval: intervalMs,
        refetchIntervalInBackground: true,
        retry: false,
        gcTime: 0,
    });
}