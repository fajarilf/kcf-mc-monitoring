import api from "@/lib/api"
import { UserCreatePayload, UserListResponse, UserParams, UserResponse, UserUpdatePayload } from "@/model/user-model";

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

    async update(id: number, data: UserUpdatePayload): Promise<UserResponse> {
        const res = await api.put(`${this.base_url}/${id}`, data);
        return res.data;
    }

    async create(data: UserCreatePayload): Promise<UserResponse> {
        const res = await api.post(this.base_url, data);
        return res.data;
    }

    async delete(id: number): Promise<void> {
        const res = await api.delete(`${this.base_url}/${id}`);
        return res.data;
    }
}

export const userService = new UserService();