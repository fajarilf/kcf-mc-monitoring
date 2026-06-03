import api from "@/lib/api";
import { MachineListResponse, MachineResponse } from "@/model/machine-model";

class MachineService {
    private base_url = "/machines";

    async get(): Promise<MachineListResponse> {
        const res = await api.get(this.base_url);
        return res.data as MachineListResponse;
    }

    async getById(id: number): Promise<MachineResponse> { 
        const res = await api.get(`${this.base_url}/${id}`);
        return res.data as MachineResponse;
    }
}

export const machineService = new MachineService();