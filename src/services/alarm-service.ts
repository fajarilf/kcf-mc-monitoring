import api from "@/lib/api";
import { AlarmHistoryParams, AlarmHistoryResponse } from "@/model/alarm-model";

class AlarmService {
    private base_url = "/alarm-histories";

    async getHistory(params?: AlarmHistoryParams): Promise<AlarmHistoryResponse> {
        const res = await api.get(this.base_url, { params });
        return res.data as AlarmHistoryResponse;
    }
}

export const alarmService = new AlarmService();
