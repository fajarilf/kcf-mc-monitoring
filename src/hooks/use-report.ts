import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { reportService } from "@/services/report-service";
import type { DandoriReportResponse } from "@/model/report-model";

export function useDandoriReportHook() {
  return useQuery<DandoriReportResponse, AxiosError<string>>({
    queryKey: ["get-dandori-report"],
    queryFn: () => reportService.getDandori(),
    staleTime: 1000 * 10,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}
