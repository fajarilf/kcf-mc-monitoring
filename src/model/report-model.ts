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

export type ProductionRecord = {
  date: string;
  machine: { id: number; code: string };
  item: { id: number; no: string; name: string };
  speed: { minute: number; hour: number };
  operator: { id: number; name: string }[];
  times: { dandori: number; running: number };
  productQuantity: number;
  operatingRate: number;
};

export type ProductionRecordsResponse = {
  status: boolean;
  message: string;
  data: ProductionRecord[];
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
    hasPreviousPage?: boolean;
    hasNextPage?: boolean;
  };
};
