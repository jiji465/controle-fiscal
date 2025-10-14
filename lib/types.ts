export type Client = {
  id: string
  name: string
  cnpj: string
  email: string
  phone: string
  status: "active" | "inactive"
  taxRegime?: "Simples Nacional" | "Lucro Presumido" | "Lucro Real" | "Outro" // Added taxRegime
  createdAt: string
}

export type Tax = {
  id: string
  name: string
  description: string
  federalTaxCode?: string
  clientId?: string; // Added optional clientId to link tax to a specific client
  dueDay?: number // Dia do vencimento do imposto (1-31)
  recurrence: RecurrenceType // Moved from Obligation, now part of Tax template
  recurrenceInterval?: number // Moved from Obligation
  recurrenceEndDate?: string // Moved from Obligation
  autoGenerate: boolean // Moved from Obligation
  weekendRule: WeekendRule // Moved from Obligation
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

export type Obligation = {
  id: string
  name: string
  description?: string
  category: ObligationCategory
  clientId: string
  taxId?: string
  dueDay: number
  dueMonth?: number
  frequency: "monthly" | "quarterly" | "annual" | "custom" // This is now derived from Tax recurrence, but kept for flexibility if an obligation is not linked to a Tax
  recurrence: RecurrenceType // This is now derived from Tax recurrence, but kept for flexibility if an obligation is not linked to a Tax
  recurrenceInterval?: number // This is now derived from Tax recurrence, but kept for flexibility if an obligation is not linked to a Tax
  recurrenceEndDate?: string // This is now derived from Tax recurrence, but kept for flexibility if an obligation is not linked to a Tax
  autoGenerate: boolean // This is now derived from Tax recurrence, but kept for flexibility if an obligation is not linked to a Tax
  weekendRule: WeekendRule // This is now derived from Tax recurrence, but kept for flexibility if an obligation is not linked to a Tax
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

export type ObligationHistory = {
  id: string
  action: "created" | "updated" | "completed" | "status_changed" | "comment_added"
  description: string
  timestamp: string
  user?: string
}

export type ObligationWithDetails = Obligation & {
  client: Client
  tax?: Tax
  calculatedDueDate: string
}

export type TaxWithDetails = Tax & {
  calculatedDueDate: string;
};

export type CalendarEvent = ObligationWithDetails | TaxWithDetails;

export type DashboardStats = {
  totalClients: number
  activeClients: number
  totalObligations: number
  pendingObligations: number
  completedThisMonth: number
  overdueObligations: number
  upcomingThisWeek: number
}

export const defaultDashboardStats: DashboardStats = {
  totalClients: 0,
  activeClients: 0,
  totalObligations: 0,
  pendingObligations: 0,
  completedThisMonth: 0,
  overdueObligations: 0,
  upcomingThisWeek: 0,
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