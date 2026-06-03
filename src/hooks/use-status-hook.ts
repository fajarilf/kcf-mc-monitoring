import {
    StatusActivityParams,
    StatusActivityResponse,
    StatusTimelineParams,
    StatusTimelineResponse,
} from "@/model/status-model";
import { statusTimelineService } from "@/services/statuses-services";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

export function useStatusTimelineHook(params?: StatusTimelineParams) {
    return useQuery<StatusTimelineResponse, AxiosError<string>>({
        queryKey: ["get-status-timeline", params],
        queryFn: () => statusTimelineService.getTimeline(params),
        staleTime: 1000 * 10,
        refetchOnWindowFocus: true,
        placeholderData: keepPreviousData,
    });
}

export function useStatusActivityHook(params?: StatusActivityParams) {
    return useQuery<StatusActivityResponse, AxiosError<string>>({
        queryKey: ["get-status-activity", params],
        queryFn: () => statusTimelineService.getActivity(params),
        staleTime: 1000 * 10,
        refetchOnWindowFocus: true,
        placeholderData: keepPreviousData,
    })
}