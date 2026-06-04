import { ActivityPeriod } from "./mock-data";

class Helper {

    generateDateRange(period: ActivityPeriod): Date[] {
        if (period === "lastMonth")
            return Array.from({ length: 30 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            return d;
            });

        if (period === "lastWeek")
            return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d;
            });
            
        if (period === "lastThreeDays")
            return Array.from({ length: 3 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (2 - i));
            return d;
            });

        return [];
    }

}

export const helper = new Helper();