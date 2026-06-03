import api from "@/lib/api";
import { MachineListResponse } from "@/model/machine-model";

class MachineService {
    private base_url = "/machines";

    async get(): Promise<MachineListResponse> {
        const res = await api.get(this.base_url);
        return res.data as MachineListResponse;
    }
}

export const machineService = new MachineService();