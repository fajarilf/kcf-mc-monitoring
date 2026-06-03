import api from "@/lib/api";
import {
    StatusActivityParams,
    StatusActivityResponse,
    StatusTimelineParams,
    StatusTimelineResponse,
} from "@/model/status-model";

class StatusTimelineService {
    private base_url = "/statuses";

    async getTimeline(params?: StatusTimelineParams): Promise<StatusTimelineResponse> {
        const res = await api.get(`${this.base_url}/timeline`, { params });
        return res.data as StatusTimelineResponse;
    }

    async getActivity(params?: StatusActivityParams): Promise<StatusActivityResponse> {
        const res = await api.get(`${this.base_url}/activity`, { params });
        return res.data as StatusActivityResponse;
    }
}

export const statusTimelineService = new StatusTimelineService();
