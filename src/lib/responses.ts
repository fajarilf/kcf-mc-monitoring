export type Responses<T> = {
    status: boolean,
    message: string,
    data: T
}

export type StatusDataResponse = Responses<StatusData[]>;

export type StatusData = {
    machine_id: number,
    machine_name: string,
    timeline: TimelimeData[]
}

export type TimelimeData = {
    start: Date
    end?: Date
    status: number
}

export type ActivityResponse = Responses<ActivityData[]>;

export type ActivityData = {
    date: Date,
    details: ActivityDetail[]
}

export type ActivityDetail = {
    operator: string,
    product: string,
    total_time: number
}