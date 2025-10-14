import { createClient } from "@/integrations/supabase/client"
import type { Client, Tax, Obligation, Notification, Installment, FiscalEventStatus } from "./types"

const supabase = createClient()

// --- Recurrence Generation Tracker ---
// This can remain in localStorage as it's a client-side preference
const RECURRENCE_LAST_RUN_KEY = "fiscal_recurrence_last_run"
export const getLastGenerationRun = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem(RECURRENCE_LAST_RUN_KEY)
}
export const setLastGenerationRun = (date: string): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(RECURRENCE_LAST_RUN_KEY, date)
}

// --- Client Storage ---
export const getClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase.from("clients").select("*")
  if (error) {
    console.error("Error fetching clients:", error)
    return []
  }
  return data.map(d => ({ ...d, taxRegime: d.tax_regime, createdAt: d.created_at }))
}

export const saveClient = async (client: Omit<Client, 'createdAt' | 'id'> & { id?: string }): Promise<Client | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const clientData = {
    id: client.id,
    user_id: user.id,
    name: client.name,
    cnpj: client.cnpj,
    email: client.email,
    phone: client.phone,
    status: client.status,
    tax_regime: client.taxRegime,
  }

  const { data, error } = await supabase.from("clients").upsert(clientData).select().single()
  if (error) {
    console.error("Error saving client:", error)
    return null
  }
  return { ...data, taxRegime: data.tax_regime, createdAt: data.created_at }
}

export const deleteClient = async (id: string): Promise<void> => {
  const { error } = await supabase.from("clients").delete().eq("id", id)
  if (error) console.error("Error deleting client:", error)
}

// --- Tax Storage ---
export const getTaxes = async (): Promise<Tax[]> => {
  const { data, error } = await supabase.from("taxes").select("*")
  if (error) {
    console.error("Error fetching taxes:", error)
    return []
  }
  return data.map(d => ({ ...d, federalTaxCode: d.federal_tax_code, clientId: d.client_id, dueDay: d.due_day, dueMonth: d.due_month, recurrenceInterval: d.recurrence_interval, recurrenceEndDate: d.recurrence_end_date, autoGenerate: d.auto_generate, weekendRule: d.weekend_rule, createdAt: d.created_at }))
}

export const saveTax = async (tax: Partial<Tax>): Promise<Tax | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const taxData = {
    id: tax.id,
    user_id: user.id,
    name: tax.name,
    description: tax.description,
    federal_tax_code: tax.federalTaxCode,
    client_id: tax.clientId,
    due_day: tax.dueDay,
    due_month: tax.dueMonth,
    recurrence: tax.recurrence,
    recurrence_interval: tax.recurrenceInterval,
    recurrence_end_date: tax.recurrenceEndDate,
    auto_generate: tax.autoGenerate,
    weekend_rule: tax.weekendRule,
    notes: tax.notes,
    tags: tax.tags,
  }

  const { data, error } = await supabase.from("taxes").upsert(taxData).select().single()
  if (error) {
    console.error("Error saving tax:", error)
    return null
  }
  return { ...data, federalTaxCode: data.federal_tax_code, clientId: data.client_id, dueDay: data.due_day, dueMonth: data.due_month, recurrenceInterval: data.recurrence_interval, recurrenceEndDate: data.recurrence_end_date, autoGenerate: data.auto_generate, weekendRule: data.weekend_rule, createdAt: data.created_at }
}

export const deleteTax = async (id: string): Promise<void> => {
  const { error } = await supabase.from("taxes").delete().eq("id", id)
  if (error) console.error("Error deleting tax:", error)
}

// --- Obligation Storage ---
export const getObligations = async (): Promise<Obligation[]> => {
  const { data, error } = await supabase.from("obligations").select("*")
  if (error) {
    console.error("Error fetching obligations:", error)
    return []
  }
  return data.map(d => ({ ...d, clientId: d.client_id, taxId: d.tax_id, dueDay: d.due_day, dueMonth: d.due_month, recurrenceInterval: d.recurrence_interval, recurrenceEndDate: d.recurrence_end_date, autoGenerate: d.auto_generate, weekendRule: d.weekend_rule, assignedTo: d.assigned_to, realizationDate: d.realization_date, createdAt: d.created_at, completedAt: d.completed_at, completedBy: d.completed_by, parentObligationId: d.parent_obligation_id, generatedFor: d.generated_for }))
}

export const saveObligation = async (obligation: Partial<Obligation>): Promise<Obligation | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const obligationData = {
    id: obligation.id,
    user_id: user.id,
    name: obligation.name,
    description: obligation.description,
    category: obligation.category,
    client_id: obligation.clientId,
    tax_id: obligation.taxId,
    due_day: obligation.dueDay,
    due_month: obligation.dueMonth,
    frequency: obligation.frequency,
    recurrence: obligation.recurrence,
    recurrence_interval: obligation.recurrenceInterval,
    recurrence_end_date: obligation.recurrenceEndDate,
    auto_generate: obligation.autoGenerate,
    weekend_rule: obligation.weekendRule,
    status: obligation.status,
    priority: obligation.priority,
    assigned_to: obligation.assignedTo,
    protocol: obligation.protocol,
    realization_date: obligation.realizationDate,
    notes: obligation.notes,
    completed_at: obligation.completedAt,
    completed_by: obligation.completedBy,
    attachments: obligation.attachments,
    history: obligation.history,
    parent_obligation_id: obligation.parentObligationId,
    generated_for: obligation.generatedFor,
    tags: obligation.tags,
  }

  const { data, error } = await supabase.from("obligations").upsert(obligationData).select().single()
  if (error) {
    console.error("Error saving obligation:", error)
    return null
  }
  return { ...data, clientId: data.client_id, taxId: data.tax_id, dueDay: data.due_day, dueMonth: data.due_month, recurrenceInterval: data.recurrence_interval, recurrenceEndDate: data.recurrence_end_date, autoGenerate: data.auto_generate, weekendRule: data.weekend_rule, assignedTo: data.assigned_to, realizationDate: data.realization_date, createdAt: data.created_at, completedAt: data.completed_at, completedBy: data.completed_by, parentObligationId: data.parent_obligation_id, generatedFor: data.generated_for }
}

export const deleteObligation = async (id: string): Promise<void> => {
  const { error } = await supabase.from("obligations").delete().eq("id", id)
  if (error) console.error("Error deleting obligation:", error)
}

// --- Installment Storage ---
export const getInstallments = async (): Promise<Installment[]> => {
  const { data, error } = await supabase.from("installments").select("*")
  if (error) {
    console.error("Error fetching installments:", error)
    return []
  }
  return data.map(d => ({ ...d, clientId: d.client_id, installmentNumber: d.installment_number, totalInstallments: d.total_installments, dueDay: d.due_day, dueMonth: d.due_month, recurrenceInterval: d.recurrence_interval, recurrenceEndDate: d.recurrence_end_date, autoGenerate: d.auto_generate, weekendRule: d.weekend_rule, createdAt: d.created_at, completedAt: d.completed_at, completedBy: d.completed_by, parentInstallmentId: d.parent_installment_id, generatedFor: d.generated_for }))
}

export const saveInstallment = async (installment: Partial<Installment>): Promise<Installment | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const installmentData = {
    id: installment.id,
    user_id: user.id,
    name: installment.name,
    description: installment.description,
    client_id: installment.clientId,
    installment_number: installment.installmentNumber,
    total_installments: installment.totalInstallments,
    due_day: installment.dueDay,
    due_month: installment.dueMonth,
    recurrence: installment.recurrence,
    recurrence_interval: installment.recurrenceInterval,
    recurrence_end_date: installment.recurrenceEndDate,
    auto_generate: installment.autoGenerate,
    weekend_rule: installment.weekendRule,
    status: installment.status,
    notes: installment.notes,
    tags: installment.tags,
    completed_at: installment.completedAt,
    completed_by: installment.completedBy,
    parent_installment_id: installment.parentInstallmentId,
    generated_for: installment.generatedFor,
  }

  const { data, error } = await supabase.from("installments").upsert(installmentData).select().single()
  if (error) {
    console.error("Error saving installment:", error)
    return null
  }
  return { ...data, clientId: data.client_id, installmentNumber: data.installment_number, totalInstallments: data.total_installments, dueDay: data.due_day, dueMonth: data.due_month, recurrenceInterval: data.recurrence_interval, recurrenceEndDate: data.recurrence_end_date, autoGenerate: data.auto_generate, weekendRule: data.weekend_rule, createdAt: data.created_at, completedAt: data.completed_at, completedBy: data.completed_by, parentInstallmentId: data.parent_installment_id, generatedFor: data.generated_for }
}

export const deleteInstallment = async (id: string): Promise<void> => {
  const { error } = await supabase.from("installments").delete().eq("id", id)
  if (error) console.error("Error deleting installment:", error)
}

// --- Tax Status Storage ---
export const getTaxStatuses = async (): Promise<Record<string, FiscalEventStatus>> => {
  const { data, error } = await supabase.from("tax_statuses").select("id, status")
  if (error) {
    console.error("Error fetching tax statuses:", error)
    return {}
  }
  return data.reduce((acc, item) => {
    acc[item.id] = item.status
    return acc
  }, {})
}

export const saveTaxStatus = async (taxDueDateId: string, status: FiscalEventStatus): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase.from("tax_statuses").upsert({
    id: taxDueDateId,
    user_id: user.id,
    status: status,
    updated_at: new Date().toISOString(),
  })
  if (error) console.error("Error saving tax status:", error)
}

// --- Notification Storage (can remain in localStorage for simplicity) ---
const NOTIFICATIONS_KEY = "fiscal_notifications"
export const getNotifications = (): Notification[] => {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(NOTIFICATIONS_KEY)
  return data ? JSON.parse(data) : []
}

export const addNotification = (message: string, type: Notification["type"] = "info", link?: string): void => {
  const newNotification: Notification = {
    id: crypto.randomUUID(),
    message,
    type,
    link,
    read: false,
    timestamp: new Date().toISOString(),
  }
  const notifications = getNotifications()
  notifications.unshift(newNotification)
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications.slice(0, 50))) // Limit to 50
}

export const markNotificationAsRead = (id: string): void => {
  const notifications = getNotifications()
  const index = notifications.findIndex((n) => n.id === id)
  if (index >= 0) {
    notifications[index].read = true
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
  }
}