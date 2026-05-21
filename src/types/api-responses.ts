export interface ApiResponses<T>  {
    status: boolean,
    message: string,
    data: T
    pagination?: Pagination
}

export interface Pagination {
    page: number,
    limit: number,
    totalPages: number,
    total: number,
}