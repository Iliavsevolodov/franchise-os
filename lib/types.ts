export type LocationStatus = "planned" | "opening" | "active";

export type ServiceLine = {
  id: string;
  name: string;
  price: number;
  sharePct: number;
  masterPct: number;
};

export type Location = {
  id: string;
  name: string;
  city: string;
  format: string;
  status: LocationStatus;
  revenue: number;
  targetRevenue: number;
  launchCost: number;
  installmentBalance: number;
  installmentMonthly: number;
  rent: number;
  accounting: number;
  internet: number;
  cleaning: number;
  software: number;
  marketing: number;
  depreciationFund: number;
  cultureFund: number;
  materialsPct: number;
  acquiringPct: number;
  staffPct: number;
  taxPct: number;
  plannedLaunch: string;
  actualLaunch?: string;
  manicure: boolean;
  services: ServiceLine[];
};

export type Employee = {
  id: string;
  locationId: string;
  name: string;
  role: string;
  service: string;
  status: "active" | "candidate" | "reserve";
  percent: number;
  fixed: number;
  revenue: number;
  procedures: number;
  shifts: number;
  official: boolean;
  insurancePct: number;
  vacationPct: number;
  sickPct: number;
};

export type FundTx = {
  id: string;
  fund: "depreciation" | "culture" | "reserve";
  locationId?: string;
  date: string;
  category: string;
  amount: number;
  note: string;
};

export type Scenario = {
  id: string;
  name: string;
  revenues: Record<string, number>;
  staffPct: number;
  materialsPct: number;
  acquiringPct: number;
};

export type OpeningTask = {
  id: string;
  locationId: string;
  title: string;
  status: "todo" | "doing" | "done";
  week: number;
};

export type AppState = {
  capitalMin: number;
  capitalMax: number;
  locations: Location[];
  employees: Employee[];
  funds: FundTx[];
  scenarios: Scenario[];
  openingTasks: OpeningTask[];
};
