import api from "@/lib/api";
import type { DandoriReportResponse } from "@/model/report-model";

class ReportService {
  private base_url = "/report";

  async getDandori(): Promise<DandoriReportResponse> {
    const res = await api.get(`${this.base_url}/dandori`);
    return res.data as DandoriReportResponse;
  }
}

export const reportService = new ReportService();
