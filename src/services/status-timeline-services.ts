import api from "@/lib/api";
import {
    StatusTimelineParams,
    StatusTimelineResponse,
} from "@/model/status-timeline-model";

class StatusTimelineService {
    private base_url = "/statuses/timeline";

    async get(params?: StatusTimelineParams): Promise<StatusTimelineResponse> {
        const res = await api.get(this.base_url, { params });
        return res.data as StatusTimelineResponse;
    }
}

export const statusTimelineService = new StatusTimelineService();
