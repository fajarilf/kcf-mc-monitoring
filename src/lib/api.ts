import axios, { AxiosError } from 'axios'
import { toast } from 'sonner'

/** Error body returned by the API: { status, message, data }. */
type ApiErrorBody = { message?: string };

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorBody>) => {
        console.error(
            `[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${error.response?.status}`,
            error.response?.data,
        );

        const message =
            error.response?.status === 500
                ? "Server error"
                : error.response?.data?.message || error.message;

        toast.error(message);

        return Promise.reject(error)
    }
)

export default api;