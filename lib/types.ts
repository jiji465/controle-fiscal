export type RecurrenceType = "monthly" | "quarterly" | "semiannual" | "annual" | "none"

export type FiscalEventStatus = "pending" | "in_progress" | "completed" | "overdue"

export type ClientStatus = "active" | "inactive"

export type Client = {
  id: string
  name: string
  cnpj: string
  email: string
  phone: string
  taxRegime: string
  status: ClientStatus
  createdAt: string // Adicionado
  updatedAt: string // Adicionado
}

export type Tax = {
  id: string
  name: string
  description: string
  federalTaxCode?: string
  stateTaxCode?: string // Adicionado
  municipalTaxCode?: string // Adicionado
  recurrence: RecurrenceType
  clientId: string
  createdAt: string
  updatedAt: string
  notes?: string
  isArchived?: boolean // Adicionado
  calculatedDueDate: string // Adicionado para templates de imposto
}

export type TaxDueDate = {
  id: string // Unique ID for this occurrence (e.g., taxId-dueDate)
  name: string
  description?: string
  calculatedDueDate: string
  clientId: string
  client: Client
  type: "tax"
  status: FiscalEventStatus
  recurrence: RecurrenceType
  createdAt: string
  updatedAt: string
  federalTaxCode?: string
  stateTaxCode?: string
  municipalTaxCode?: string
  notes?: string
}

export type ObligationCategory = "federal" | "state" | "municipal" | "other"

export type ObligationHistoryEntry = {
  id: string
  action: "created" | "status_changed" | "completed" | "edited"
  description: string
  timestamp: string
}

export type Obligation = {
  id: string
  name: string
  description?: string
  category: ObligationCategory
  clientId: string
  taxId?: string
  dueDay: number
  dueMonth?: number // For annual/semiannual/quarterly
  frequency: "monthly" | "quarterly" | "annual" | "custom"
  recurrence: RecurrenceType
  calculatedDueDate: string // Adicionado
  status: FiscalEventStatus
  priority: "low" | "medium" | "high" | "urgent"
  assignedTo?: string
  protocol?: string
  realizationDate?: string // Date when the obligation was actually done
  completedAt?: string
  completedBy?: string
  createdAt: string
  updatedAt: string
  notes?: string
  history?: ObligationHistoryEntry[]
  tags?: string[]
  isArchived?: boolean // Adicionado
}

export type ObligationWithDetails = Obligation & {
  client: Client
  tax?: Tax
  type: "obligation"
}

export type Installment = {
  id: string
  name: string
  description?: string
  clientId: string
  installmentNumber: number
  totalInstallments: number
  dueDay: number
  dueMonth?: number
  recurrence: RecurrenceType
  calculatedDueDate: string // Adicionado
  status: FiscalEventStatus
  completedAt?: string
  completedBy?: string
  createdAt: string
  updatedAt: string
  notes?: string
  generatedFor?: string // Reference to the original installment series
  isArchived?: boolean // Adicionado
}

export type InstallmentWithDetails = Installment & {
  client: Client
  type: "installment"
}

// Union type for all fiscal events
export type FiscalEvent = Obligation | Installment | TaxDueDate | Tax // Incluindo Tax para recorrência

export type DashboardStats = {
  totalClients: number
  totalObligations: number // Includes obligations and installments
  completed: number
  overdue: number
  completionRate: number
}

export const defaultDashboardStats: DashboardStats = {
  totalClients: 0,
  totalObligations: 0,
  completed: 0,
  overdue: 0,
  completionRate: 0,
}

export type ProductivityMetrics = {
  totalCompleted: number
  averageCompletionTime: number // in days
  onTimeRate: number // percentage
  byResponsible: { name: string; completed: number; onTime: number }[]
  byPriority: { priority: string; count: number }[]
  byMonth: { month: string; completed: number; overdue: number }[]
}

export type CalendarEvent = ObligationWithDetails | InstallmentWithDetails | TaxDueDate

export type Notification = {
  id: string
  message: string
  timestamp: string
  read: boolean
  createdAt: string // Adicionado
  updatedAt: string // Adicionado
}

export type RecurrenceLog = { // Adicionado
  lastRunMonthYear: string | null
  timestamp: string | null
  generatedCount: number
}