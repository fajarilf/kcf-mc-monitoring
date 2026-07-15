import axios, { AxiosError } from 'axios'
import { toast } from 'sonner'

type ApiErrorBody = { message?: string };

const STATUS_TEXT: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    408: "Request Timeout",
    409: "Conflict",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
};

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
        if (axios.isCancel(error)) return Promise.reject(error);
        
        const status = error.response?.status;
        const isTimeout = error.code === "ECONNABORTED" || error.code === "ETIMEOUT";

        const title = status
            ? `${status} ${STATUS_TEXT[status] ?? error.response?.statusText ?? "Error"}`
            : isTimeout 
                ? "Request Timeout"
                : "Network Error";

        const description =
            status === 500
                ? "Something went wrong on the server."
                : error.response?.data?.message || error.message;

        toast.error(title, { description });

        return Promise.reject(error)
    }
)

export default api;