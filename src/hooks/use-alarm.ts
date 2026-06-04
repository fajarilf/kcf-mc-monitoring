import { AlarmHistoryParams, AlarmHistoryResponse } from "@/model/alarm-model";
import { alarmService } from "@/services/alarm-service";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

export function useAlarmHistoryHook(params?: AlarmHistoryParams) {
    return useQuery<AlarmHistoryResponse, AxiosError<string>>({
        queryKey: ["get-alarm-history", params],
        queryFn: () => alarmService.getHistory(params),
        staleTime: 1000 * 10,
        refetchOnWindowFocus: true,
        placeholderData: keepPreviousData,
    });
}
