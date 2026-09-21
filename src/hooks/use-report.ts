import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { reportService } from "@/services/report-service";
import type { DandoriReportResponse, ProductionRecordsResponse } from "@/model/report-model";

export function useDandoriReportHook() {
  return useQuery<DandoriReportResponse, AxiosError<string>>({
    queryKey: ["get-dandori-report"],
    queryFn: () => reportService.getDandori(),
    staleTime: 1000 * 10,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

export function useProductionRecordsHook(params?: { page?: number; limit?: number; paginate?: boolean }) {
  return useQuery<ProductionRecordsResponse, AxiosError<string>>({
    queryKey: ["get-production-records", params],
    queryFn: () => reportService.getProductionRecords(params),
    staleTime: 1000 * 10,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}
