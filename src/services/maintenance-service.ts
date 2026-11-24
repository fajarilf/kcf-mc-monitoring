import api from "@/lib/api";
import { MaintenanceHistoryParams, MaintenanceHistoryResponse } from "@/model/maintenance-model";

class MaintenanceService {
    private base_url = "/maintenance";

    async getHistory(params?: MaintenanceHistoryParams): Promise<MaintenanceHistoryResponse> {
        const res = await api.get(this.base_url, { params });
        return res.data as MaintenanceHistoryResponse;
    }
}

export const maintenanceService = new MaintenanceService();
