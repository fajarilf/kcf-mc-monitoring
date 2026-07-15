import api from "@/lib/api";
import { GroupListResponse, GroupResponse } from "@/model/group-model";

class GroupService {
    private base_url = "/groups";

    async get(): Promise<GroupListResponse> {
        const res = await api.get(this.base_url);
        return res.data as GroupListResponse;
    }

    async getById(id: number): Promise<GroupResponse> {
        const res = await api.get(`${this.base_url}/${id}`);
        return res.data as GroupResponse;
    }
}

export const groupService = new GroupService();
