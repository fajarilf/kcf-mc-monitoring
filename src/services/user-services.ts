import api from "@/lib/api"
import { UserListResponse, UserParams, UserResponse } from "@/model/user-model";

class UserService {
    private base_url = "/users";

    async get(params?: UserParams): Promise<UserListResponse> {
        const res = await api.get(this.base_url, { params });
        return res.data;
    }

    async getById(id: number): Promise<UserResponse> {
        const res = await api.get(`${this.base_url}/${id}`);
        return res.data;
    }
}

export const userService = new UserService();