export type MonthlyValues = {
  jan: number | null;
  feb: number | null;
  mar: number | null;
  apr: number | null;
  may: number | null;
  jun: number | null;
  jul: number | null;
  aug: number | null;
  sep: number | null;
  oct: number | null;
  nov: number | null;
  dec: number | null;
};

export type DandoriOperator = {
  id: number;
  name: string;
  months: MonthlyValues;
  average: number | null;
};

export type DandoriReportData = {
  operators: DandoriOperator[];
  average: MonthlyValues & { overall: number | null };
};

export type DandoriReportResponse = {
  status: boolean;
  message: string;
  data: DandoriReportData;
};
