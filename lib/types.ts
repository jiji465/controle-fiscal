export type Client = {
  id: string
  name: string
  cnpj: string
  email: string
  phone: string
  status: "active" | "inactive"
  taxRegime?: "Simples Nacional" | "Lucro Presumido" | "Lucro Real" | "Outro"
  createdAt: string
}

export type Tax = {
  id: string
  name: string
  description: string
  federalTaxCode?: string
  clientId?: string;
  dueDay?: number
  recurrence: RecurrenceType
  recurrenceInterval?: number
  recurrenceEndDate?: string
  autoGenerate: boolean
  weekendRule: WeekendRule
  notes?: string
  tags?: string[]
  createdAt: string
}

export type WeekendRule = "postpone" | "anticipate" | "keep"

export type RecurrenceType = "monthly" | "bimonthly" | "quarterly" | "semiannual" | "annual" | "custom"

export type Priority = "low" | "medium" | "high" | "urgent"

export type CertificateType = "federal" | "state" | "municipal" | "fgts" | "labor"

export type Certificate = {
  id: string
  clientId: string
  type: CertificateType
  name: string
  issueDate?: string
  expiryDate: string
  status: "valid" | "expired" | "pending"
  documentNumber?: string
  notes?: string
  createdAt: string
}

export type ObligationCategory = "sped" | "tax_guide" | "certificate" | "declaration" | "other"

// --- New Unified Fiscal Event Types ---
export type FiscalEventType = "obligation" | "tax" | "installment";
export type FiscalEventStatus = "pending" | "in_progress" | "completed" | "overdue" | "paid";

export interface FiscalEventBase {
  id: string;
  name: string;
  calculatedDueDate: string; // All events must have a calculated due date
  client: Client; // All events must be linked to a client
  status: FiscalEventStatus; // All events have a status
  type: FiscalEventType; // Discriminator for union types
  createdAt: string;
  description?: string;
  amount?: number;
  notes?: string;
  tags?: string[];
  // Specific fields for different types, made optional in base
  completedAt?: string; // For obligations
  completedBy?: string; // For obligations
  paidAt?: string; // For installments
  paidBy?: string; // For installments
}

export type Obligation = {
  id: string
  name: string
  description?: string
  category: ObligationCategory
  clientId: string
  taxId?: string
  dueDay: number
  dueMonth?: number
  frequency: "monthly" | "quarterly" | "annual" | "custom"
  recurrence: RecurrenceType
  recurrenceInterval?: number
  recurrenceEndDate?: string
  autoGenerate: boolean
  weekendRule: WeekendRule
  status: "pending" | "in_progress" | "completed" | "overdue"
  priority: Priority
  assignedTo?: string
  protocol?: string
  realizationDate?: string
  amount?: number
  notes?: string
  createdAt: string
  completedAt?: string
  completedBy?: string
  attachments?: string[]
  history?: ObligationHistory[]
  parentObligationId?: string
  generatedFor?: string
  tags?: string[]
}

export type ObligationWithDetails = Obligation & {
  client: Client;
  tax?: Tax;
} & FiscalEventBase; // Extend FiscalEventBase

export type TaxDueDate = Tax & {
  client: Client;
} & FiscalEventBase; // Extend FiscalEventBase

export type Installment = {
  id: string;
  name: string; // Name of the installment (e.g., "Parcela 1 de IPTU")
  description?: string;
  clientId: string;
  originalAmount: number; // Total original amount of the installment plan
  installmentNumber: number; // e.g., 1
  totalInstallments: number; // e.g., 12
  amount: number; // Amount for this specific installment payment
  dueDay: number;
  dueMonth?: number; // For annual or specific month installments
  recurrence: RecurrenceType; // How often installments occur (e.g., monthly)
  recurrenceInterval?: number;
  recurrenceEndDate?: string; // When the installment plan ends
  autoGenerate: boolean; // Whether to auto-generate future installments
  weekendRule: WeekendRule;
  status: "pending" | "paid" | "overdue"; // Specific status for installments
  notes?: string;
  tags?: string[];
  createdAt: string;
  paidAt?: string;
  paidBy?: string;
  parentInstallmentId?: string; // If it's part of a larger installment plan
  generatedFor?: string; // e.g., "2023-01"
};

export type InstallmentWithDetails = Installment & {
  client: Client;
} & FiscalEventBase; // Extend FiscalEventBase

// Update CalendarEvent to be the union of these detailed types
export type CalendarEvent = ObligationWithDetails | TaxDueDate | InstallmentWithDetails;

export type ObligationHistory = {
  id: string
  action: "created" | "updated" | "completed" | "status_changed" | "comment_added"
  description: string
  timestamp: string
  user?: string
}

export type DashboardStats = {
  totalClients: number
  activeClients: number
  totalObligations: number
  pendingObligations: number
  completedThisMonth: number
  overdueObligations: number
  upcomingThisWeek: number
  totalInstallments: number; // New stat
  pendingInstallments: number; // New stat
  overdueInstallments: number; // New stat
}

export const defaultDashboardStats: DashboardStats = {
  totalClients: 0,
  activeClients: 0,
  totalObligations: 0,
  pendingObligations: 0,
  completedThisMonth: 0,
  overdueObligations: 0,
  upcomingThisWeek: 0,
  totalInstallments: 0,
  pendingInstallments: 0,
  overdueInstallments: 0,
};

export type SavedFilter = {
  id: string
  name: string
  filters: {
    status?: string[]
    priority?: string[]
    clientId?: string
    search?: string
    dateRange?: { start: string; end: string }
  }
  createdAt: string
}

export type ExportFormat = "excel" | "pdf" | "csv"

export type ExportOptions = {
  format: ExportFormat
  includeCompleted: boolean
  dateRange?: { start: string; end: string }
  clientIds?: string[]
}

export type ProductivityMetrics = {
  totalCompleted: number
  averageCompletionTime: number // em dias
  onTimeRate: number // percentual
  byResponsible: { name: string; completed: number; onTime: number }[]
  byMonth: { month: string; completed: number; overdue: number }[]
  byPriority: { priority: Priority; count: number }[]
}

export type Notification = {
  id: string;
  type: "info" | "warning" | "error" | "success";
  message: string;
  link?: string;
  read: boolean;
  timestamp: string;
};