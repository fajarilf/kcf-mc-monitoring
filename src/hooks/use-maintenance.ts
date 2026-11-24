import { MaintenanceHistoryParams, MaintenanceHistoryResponse } from "@/model/maintenance-model";
import { maintenanceService } from "@/services/maintenance-service";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

export function useMaintenanceHistoryHook(params?: MaintenanceHistoryParams) {
    return useQuery<MaintenanceHistoryResponse, AxiosError<string>>({
        queryKey: ["get-maintenance-history", params],
        queryFn: () => maintenanceService.getHistory(params),
        staleTime: 1000 * 10,
        refetchOnWindowFocus: true,
        placeholderData: keepPreviousData,
    });
}
