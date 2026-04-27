import { useEffect, useState } from "react";

export function useDatetime() {
    const [dateTime, setDateTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setDateTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, [])

    return dateTime;
}