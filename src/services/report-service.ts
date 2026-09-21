import api from "@/lib/api";
import type { DandoriReportResponse, ProductionRecordsResponse } from "@/model/report-model";

class ReportService {
  private base_url = "/reports";

  async getDandori(): Promise<DandoriReportResponse> {
    const res = await api.get(`${this.base_url}/dandori`);
    return res.data as DandoriReportResponse;
  }

  async getProductionRecords(): Promise<ProductionRecordsResponse> {
    const res = await api.get(`${this.base_url}/production-records`);
    return res.data as ProductionRecordsResponse;
  }
}

export const reportService = new ReportService();
