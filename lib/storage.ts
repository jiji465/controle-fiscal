import { supabase } from "@/integrations/supabase/client"
import type { Client, Obligation, Tax, Installment, RecurrenceLog, Notification } from "./types"

const STORAGE_KEYS = {
  RECURRENCE_LOG: "fiscal_recurrence_log",
  NOTIFICATIONS: "fiscal_notifications",
}

// --- Helper para obter o ID do usuário logado ---
async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error("Supabase Auth Error:", error);
    throw new Error(`Falha ao obter usuário autenticado: ${error.message}`);
  }
  if (!user) {
    throw new Error("User not authenticated.");
  }
  return user.id
}

// --- Mapeamento de Tipos (CamelCase para SnakeCase para DB) ---

function mapClientToDB(client: Client, user_id: string) {
  return {
    id: client.id,
    user_id,
    name: client.name,
    cnpj: client.cnpj,
    email: client.email,
    phone: client.phone,
    status: client.status,
    tax_regime: client.taxRegime,
    created_at: client.createdAt,
    updated_at: client.updatedAt,
  }
}

function mapObligationToDB(obligation: Obligation, user_id: string) {
  return {
    id: obligation.id,
    user_id,
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
    calculated_due_date: obligation.calculatedDueDate,
    status: obligation.status,
    priority: obligation.priority,
    assigned_to: obligation.assignedTo,
    protocol: obligation.protocol,
    realization_date: obligation.realizationDate,
    completed_at: obligation.completedAt,
    completed_by: obligation.completedBy,
    created_at: obligation.createdAt,
    updated_at: obligation.updatedAt,
    notes: obligation.notes,
    history: obligation.history,
    tags: obligation.tags,
    attachments: obligation.attachments,
    is_archived: obligation.isArchived,
  }
}

function mapTaxToDB(tax: Tax, user_id: string) {
  return {
    id: tax.id,
    user_id,
    name: tax.name,
    description: tax.description,
    federal_tax_code: tax.federalTaxCode,
    state_tax_code: tax.stateTaxCode,
    municipal_tax_code: tax.municipalTaxCode,
    recurrence: tax.recurrence,
    recurrence_interval: tax.recurrenceInterval,
    recurrence_end_date: tax.recurrenceEndDate,
    auto_generate: tax.autoGenerate,
    weekend_rule: tax.weekendRule,
    due_day: tax.dueDay,
    due_month: tax.dueMonth,
    client_id: tax.clientId,
    created_at: tax.createdAt,
    updated_at: tax.updatedAt,
    notes: tax.notes,
    is_archived: tax.isArchived,
    calculated_due_date: tax.calculatedDueDate,
    tags: tax.tags,
    type: tax.type,
  }
}

function mapInstallmentToDB(installment: Installment, user_id: string) {
  return {
    id: installment.id,
    user_id,
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
    calculated_due_date: installment.calculatedDueDate,
    status: installment.status,
    completed_at: installment.completedAt,
    completed_by: installment.completedBy,
    created_at: installment.createdAt,
    updated_at: installment.updatedAt,
    notes: installment.notes,
    generated_for: installment.generatedFor,
    is_archived: installment.isArchived,
    tags: installment.tags,
    type: installment.type,
  }
}

function mapClientFromDB(record: any): Client {
  return {
    id: record.id,
    name: record.name,
    cnpj: record.cnpj,
    email: record.email ?? "",
    phone: record.phone ?? "",
    taxRegime: record.tax_regime ?? "",
    status: record.status,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  }
}

function mapObligationFromDB(record: any): Obligation {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? undefined,
    category: record.category,
    clientId: record.client_id,
    taxId: record.tax_id ?? undefined,
    dueDay: record.due_day,
    dueMonth: record.due_month ?? undefined,
    frequency: record.frequency,
    recurrence: record.recurrence,
    recurrenceInterval: record.recurrence_interval ?? undefined,
    recurrenceEndDate: record.recurrence_end_date ?? undefined,
    autoGenerate: record.auto_generate ?? false,
    weekendRule: record.weekend_rule ?? "none",
    calculatedDueDate: record.calculated_due_date,
    status: (record.status as Obligation['status']) ?? "pending",
    priority: (record.priority as Obligation['priority']) ?? "medium",
    assignedTo: record.assigned_to ?? undefined,
    protocol: record.protocol ?? undefined,
    realizationDate: record.realization_date ?? undefined,
    completedAt: record.completed_at ?? undefined,
    completedBy: record.completed_by ?? undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    notes: record.notes ?? undefined,
    history: record.history ?? [],
    tags: record.tags ?? [],
    attachments: record.attachments ?? [],
    isArchived: record.is_archived ?? false,
    type: (record.type as Obligation['type']) ?? "obligation",
  }
}

function mapTaxFromDB(record: any): Tax {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? "",
    federalTaxCode: record.federal_tax_code ?? undefined,
    stateTaxCode: record.state_tax_code ?? undefined,
    municipalTaxCode: record.municipal_tax_code ?? undefined,
    recurrence: record.recurrence,
    recurrenceInterval: record.recurrence_interval ?? undefined,
    recurrenceEndDate: record.recurrence_end_date ?? undefined,
    autoGenerate: record.auto_generate ?? false,
    weekendRule: record.weekend_rule ?? "none",
    dueDay: record.due_day,
    dueMonth: record.due_month ?? undefined,
    clientId: record.client_id,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    notes: record.notes ?? undefined,
    isArchived: record.is_archived ?? false,
    calculatedDueDate: record.calculated_due_date,
    tags: record.tags ?? [],
    type: (record.type as Tax['type']) ?? "tax",
  }
}

function mapInstallmentFromDB(record: any): Installment {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? undefined,
    clientId: record.client_id,
    installmentNumber: record.installment_number,
    totalInstallments: record.total_installments,
    dueDay: record.due_day,
    dueMonth: record.due_month ?? undefined,
    recurrence: record.recurrence,
    recurrenceInterval: record.recurrence_interval ?? undefined,
    recurrenceEndDate: record.recurrence_end_date ?? undefined,
    autoGenerate: record.auto_generate ?? false,
    weekendRule: record.weekend_rule ?? "none",
    calculatedDueDate: record.calculated_due_date,
    status: (record.status as Installment['status']) ?? "pending",
    completedAt: record.completed_at ?? undefined,
    completedBy: record.completed_by ?? undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    notes: record.notes ?? undefined,
    generatedFor: record.generated_for ?? undefined,
    isArchived: record.is_archived ?? false,
    tags: record.tags ?? [],
    type: (record.type as Installment['type']) ?? "installment",
  }
}

// --- Clientes ---

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase.from("clients").select("*").order("name", { ascending: true })
  if (error) {
    console.error("Supabase Error (getClients):", error);
    throw new Error(`Falha ao carregar clientes: ${error.message}`);
  }
  return (data ?? []).map(mapClientFromDB)
}

export async function saveClient(client: Client) {
  const user_id = await getUserId()
  const now = new Date().toISOString()
  const clientToSave: Client = {
    ...client,
    createdAt: client.createdAt || now,
    updatedAt: now,
  }
  const clientData = mapClientToDB(clientToSave, user_id)

  const { error } = await supabase
    .from("clients")
    .upsert(clientData, { onConflict: 'id' })

  if (error) {
    console.error("Supabase Error (saveClient):", error);
    throw new Error(`Falha ao salvar cliente: ${error.message}`);
  }
}

export async function deleteClient(id: string) {
  const { error } = await supabase.from("clients").delete().eq("id", id)
  if (error) {
    console.error("Supabase Error (deleteClient):", error);
    throw new Error(`Falha ao deletar cliente: ${error.message}`);
  }
}

// --- Obrigações ---

export async function getObligations(): Promise<Obligation[]> {
  const { data, error } = await supabase
    .from("obligations")
    .select("*")
    .eq("is_archived", false)
    .order("calculated_due_date", { ascending: true })
  if (error) {
    console.error("Supabase Error (getObligations):", error);
    throw new Error(`Falha ao carregar obrigações: ${error.message}`);
  }
  return (data ?? []).map(mapObligationFromDB)
}

export async function saveAllObligations(obligations: Obligation[]) {
  const user_id = await getUserId()
  const now = new Date().toISOString()
  const obligationsWithDBKeys = obligations.map(o =>
    mapObligationToDB(
      {
        ...o,
        createdAt: o.createdAt || now,
        updatedAt: now,
      },
      user_id,
    ),
  )

  const { error } = await supabase.from("obligations").upsert(obligationsWithDBKeys, { onConflict: 'id' })
  if (error) {
    console.error("Supabase Error (saveAllObligations):", error);
    throw new Error(`Falha ao salvar todas as obrigações: ${error.message}`);
  }
}

export async function saveObligation(obligation: Obligation) {
  const user_id = await getUserId()
  const now = new Date().toISOString()
  const obligationToSave: Obligation = {
    ...obligation,
    createdAt: obligation.createdAt || now,
    updatedAt: now,
  }
  const obligationData = mapObligationToDB(obligationToSave, user_id)

  const { error } = await supabase
    .from("obligations")
    .upsert(obligationData, { onConflict: 'id' })

  if (error) {
    console.error("Supabase Error (saveObligation):", error);
    throw new Error(`Falha ao salvar obrigação: ${error.message}`);
  }
}

export async function deleteObligation(id: string) {
  const { error } = await supabase.from("obligations").delete().eq("id", id)
  if (error) {
    console.error("Supabase Error (deleteObligation):", error);
    throw new Error(`Falha ao deletar obrigação: ${error.message}`);
  }
}

// --- Impostos (Templates) ---

export async function getTaxes(): Promise<Tax[]> {
  const { data, error } = await supabase
    .from("taxes")
    .select("*")
    .eq("is_archived", false)
    .order("name", { ascending: true })
  if (error) {
    console.error("Supabase Error (getTaxes):", error);
    throw new Error(`Falha ao carregar impostos: ${error.message}`);
  }
  return (data ?? []).map(mapTaxFromDB)
}

export async function saveAllTaxes(taxes: Tax[]) {
  const user_id = await getUserId()
  const now = new Date().toISOString()
  const taxesWithDBKeys = taxes.map(t =>
    mapTaxToDB(
      {
        ...t,
        createdAt: t.createdAt || now,
        updatedAt: now,
      },
      user_id,
    ),
  )

  const { error } = await supabase.from("taxes").upsert(taxesWithDBKeys, { onConflict: 'id' })
  if (error) {
    console.error("Supabase Error (saveAllTaxes):", error);
    throw new Error(`Falha ao salvar todos os impostos: ${error.message}`);
  }
}

export async function saveTax(tax: Tax) {
  const user_id = await getUserId()
  const now = new Date().toISOString()
  const taxToSave: Tax = {
    ...tax,
    createdAt: tax.createdAt || now,
    updatedAt: now,
  }
  const taxData = mapTaxToDB(taxToSave, user_id)

  const { error } = await supabase
    .from("taxes")
    .upsert(taxData, { onConflict: 'id' })

  if (error) {
    console.error("Supabase Error (saveTax):", error);
    throw new Error(`Falha ao salvar imposto: ${error.message}`);
  }
}

export async function deleteTax(id: string) {
  const { error } = await supabase.from("taxes").delete().eq("id", id)
  if (error) {
    console.error("Supabase Error (deleteTax):", error);
    throw new Error(`Falha ao deletar imposto: ${error.message}`);
  }
}

// --- Parcelamentos ---

export async function getInstallments(): Promise<Installment[]> {
  const { data, error } = await supabase
    .from("installments")
    .select("*")
    .eq("is_archived", false)
    .order("calculated_due_date", { ascending: true })
  if (error) {
    console.error("Supabase Error (getInstallments):", error);
    throw new Error(`Falha ao carregar parcelamentos: ${error.message}`);
  }
  return (data ?? []).map(mapInstallmentFromDB)
}

export async function saveAllInstallments(installments: Installment[]) {
  const user_id = await getUserId()
  const now = new Date().toISOString()
  const installmentsWithDBKeys = installments.map(i =>
    mapInstallmentToDB(
      {
        ...i,
        createdAt: i.createdAt || now,
        updatedAt: now,
      },
      user_id,
    ),
  )

  const { error } = await supabase.from("installments").upsert(installmentsWithDBKeys, { onConflict: 'id' })
  if (error) {
    console.error("Supabase Error (saveAllInstallments):", error);
    throw new Error(`Falha ao salvar todos os parcelamentos: ${error.message}`);
  }
}

export async function saveInstallment(installment: Installment) {
  const user_id = await getUserId()
  const now = new Date().toISOString()
  const installmentToSave: Installment = {
    ...installment,
    createdAt: installment.createdAt || now,
    updatedAt: now,
  }
  const installmentData = mapInstallmentToDB(installmentToSave, user_id)

  const { error } = await supabase
    .from("installments")
    .upsert(installmentData, { onConflict: 'id' })

  if (error) {
    console.error("Supabase Error (saveInstallment):", error);
    throw new Error(`Falha ao salvar parcelamento: ${error.message}`);
  }
}

export async function deleteInstallment(id: string) {
  const { error } = await supabase.from("installments").delete().eq("id", id)
  if (error) {
    console.error("Supabase Error (deleteInstallment):", error);
    throw new Error(`Falha ao deletar parcelamento: ${error.message}`);
  }
}

// --- Recorrência Log (Mantido no LocalStorage por simplicidade de execução única por cliente) ---

export function getRecurrenceLog(): RecurrenceLog {
  if (typeof window === "undefined") return { lastRunMonthYear: null, timestamp: null, generatedCount: 0 }
  const data = localStorage.getItem(STORAGE_KEYS.RECURRENCE_LOG)
  return data ? JSON.parse(data) : { lastRunMonthYear: null, timestamp: null, generatedCount: 0 }
}

export function saveRecurrenceLog(log: RecurrenceLog) {
  localStorage.setItem(STORAGE_KEYS.RECURRENCE_LOG, JSON.stringify(log))
}

// --- Notificações (Mantido no LocalStorage) ---

export function getNotifications(): Notification[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)
  return data ? JSON.parse(data) : []
}

export function saveNotification(notification: Notification) {
  const notifications = getNotifications()
  const index = notifications.findIndex((n) => n.id === notification.id)
  const now = new Date().toISOString()

  if (index > -1) {
    notifications[index] = { ...notification, updatedAt: now }
  } else {
    notifications.push({
      ...notification,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      read: notification.read || false,
    })
  }
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications))
}

export function markNotificationAsRead(id: string) {
  const notifications = getNotifications()
  const index = notifications.findIndex((n) => n.id === id)
  if (index > -1) {
    notifications[index].read = true
    notifications[index].updatedAt = new Date().toISOString()
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications))
  }
}