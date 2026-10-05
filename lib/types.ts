export type LocationStatus = "planned" | "opening" | "active";
export type UserRole = "owner" | "manager" | "master";

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
  targetZone: string;
  hairMasters: number;
  nailMasters: number;
  officialEmployment: boolean;
  employerInsurancePct: number;
  vacationReservePct: number;
  sickReservePct: number;
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

export type ActualMonth = {
  id: string;
  locationId: string;
  month: string;
  revenue: number;
  procedures: number;
  payroll: number;
  employerCosts: number;
  materials: number;
  acquiring: number;
  rent: number;
  marketing: number;
  other: number;
  tax: number;
  note: string;
};

export type CashEvent = {
  id: string;
  title: string;
  type: "income" | "expense";
  amount: number;
  dueDate: string;
  category: string;
  locationId?: string;
  status: "planned" | "paid";
  recurrence: "once" | "monthly";
  reminderDays: number;
  note: string;
  paidAt?: string;
};

export type PrivateNote = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
};

export type AppUser = {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  locationIds: string[];
  employeeId?: string;
  status: "active" | "invited" | "disabled";
};

export type WorkShift = {
  id: string;
  employeeId: string;
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "planned" | "completed" | "missed" | "dayoff";
};

export type ChecklistFrequency = "shift_open" | "shift_close" | "daily" | "weekly";

export type ChecklistItem = {
  id: string;
  text: string;
  required: boolean;
};

export type ChecklistTemplate = {
  id: string;
  title: string;
  description: string;
  role: "manager" | "master";
  frequency: ChecklistFrequency;
  locationIds: string[];
  active: boolean;
  items: ChecklistItem[];
};

export type ChecklistCompletion = {
  id: string;
  templateId: string;
  userId: string;
  locationId: string;
  date: string;
  completedItemIds: string[];
  completedAt?: string;
  note?: string;
};

export type WorkRequestCategory = "supplies" | "repair" | "equipment" | "household" | "incident" | "other";
export type WorkRequestPriority = "low" | "normal" | "urgent";
export type WorkRequestStatus = "new" | "accepted" | "ordered" | "resolved" | "rejected";

export type WorkRequestItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
};

export type WorkRequest = {
  id: string;
  fromUserId: string;
  locationId: string;
  category: WorkRequestCategory;
  title: string;
  description: string;
  items: WorkRequestItem[];
  priority: WorkRequestPriority;
  status: WorkRequestStatus;
  createdAt: string;
  updatedAt: string;
  managerNote?: string;
};

export type StaffNotificationType = "checklist_complete" | "shift_ready" | "request_new" | "request_status";

export type StaffNotification = {
  id: string;
  userId: string;
  locationId: string;
  type: StaffNotificationType;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
  requestId?: string;
  checklistCompletionId?: string;
};

export type AppState = {
  capitalMin: number;
  capitalMax: number;
  cashBalance: number;
  locations: Location[];
  employees: Employee[];
  funds: FundTx[];
  scenarios: Scenario[];
  openingTasks: OpeningTask[];
  actuals: ActualMonth[];
  cashEvents: CashEvent[];
  dismissedNotifications: string[];
  privateNotes: PrivateNote[];
  users: AppUser[];
  shifts: WorkShift[];
  checklistTemplates: ChecklistTemplate[];
  checklistCompletions: ChecklistCompletion[];
  workRequests: WorkRequest[];
  staffNotifications: StaffNotification[];
};
