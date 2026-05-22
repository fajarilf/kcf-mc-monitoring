import {
    StatusTimelineParams,
    StatusTimelineResponse,
} from "@/model/status-timeline-model";
import { statusTimelineService } from "@/services/status-timeline-services";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

export function useStatusTimelineHook(params?: StatusTimelineParams) {
    return useQuery<StatusTimelineResponse, AxiosError<string>>({
        queryKey: ["get-status-timeline", params],
        queryFn: () => statusTimelineService.get(params),
        staleTime: 1000 * 10,
        refetchOnWindowFocus: true,
        placeholderData: keepPreviousData,
    });
}
