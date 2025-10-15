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

// --- Clientes ---

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase.from("clients").select("*").order("name", { ascending: true })
  if (error) {
    console.error("Supabase Error (getClients):", error);
    throw new Error(`Falha ao carregar clientes: ${error.message}`);
  }
  return data as Client[]
}

export async function saveClient(client: Client) {
  const user_id = await getUserId()
  const clientData = { ...client, user_id }

  if (client.id && client.createdAt) {
    // Update
    const { error } = await supabase.from("clients").update(clientData).eq("id", client.id)
    if (error) {
      console.error("Supabase Error (saveClient update):", error);
      throw new Error(`Falha ao atualizar cliente: ${error.message}`);
    }
  } else {
    // Insert
    const { error } = await supabase.from("clients").insert(clientData)
    if (error) {
      console.error("Supabase Error (saveClient insert):", error);
      throw new Error(`Falha ao inserir cliente: ${error.message}`);
    }
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
  const { data, error } = await supabase.from("obligations").select("*").eq("isArchived", false).order("calculatedDueDate", { ascending: true })
  if (error) {
    console.error("Supabase Error (getObligations):", error);
    throw new Error(`Falha ao carregar obrigações: ${error.message}`);
  }
  return data as Obligation[]
}

export async function saveAllObligations(obligations: Obligation[]) {
  // Esta função é usada para salvar em massa (e.g., após geração de recorrência).
  // No Supabase, faremos upsert (insert/update)
  const user_id = await getUserId()
  const obligationsWithUserId = obligations.map(o => ({ ...o, user_id }))

  // Usamos `upsert` para lidar com inserts e updates em massa
  const { error } = await supabase.from("obligations").upsert(obligationsWithUserId, { onConflict: 'id' })
  if (error) {
    console.error("Supabase Error (saveAllObligations):", error);
    throw new Error(`Falha ao salvar todas as obrigações: ${error.message}`);
  }
}

export async function saveObligation(obligation: Obligation) {
  const user_id = await getUserId()
  const obligationData = { ...obligation, user_id }

  if (obligation.id && obligation.createdAt) {
    // Update
    const { error } = await supabase.from("obligations").update(obligationData).eq("id", obligation.id)
    if (error) {
      console.error("Supabase Error (saveObligation update):", error);
      throw new Error(`Falha ao atualizar obrigação: ${error.message}`);
    }
  } else {
    // Insert
    const { error } = await supabase.from("obligations").insert(obligationData)
    if (error) {
      console.error("Supabase Error (saveObligation insert):", error);
      throw new Error(`Falha ao inserir obrigação: ${error.message}`);
    }
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
  const { data, error } = await supabase.from("taxes").select("*").eq("isArchived", false).order("name", { ascending: true })
  if (error) {
    console.error("Supabase Error (getTaxes):", error);
    throw new Error(`Falha ao carregar impostos: ${error.message}`);
  }
  return data as Tax[]
}

export async function saveAllTaxes(taxes: Tax[]) {
  const user_id = await getUserId()
  const taxesWithUserId = taxes.map(t => ({ ...t, user_id }))

  const { error } = await supabase.from("taxes").upsert(taxesWithUserId, { onConflict: 'id' })
  if (error) {
    console.error("Supabase Error (saveAllTaxes):", error);
    throw new Error(`Falha ao salvar todos os impostos: ${error.message}`);
  }
}

export async function saveTax(tax: Tax) {
  const user_id = await getUserId()
  const taxData = { ...tax, user_id }

  if (tax.id && tax.createdAt) {
    // Update
    const { error } = await supabase.from("taxes").update(taxData).eq("id", tax.id)
    if (error) {
      console.error("Supabase Error (saveTax update):", error);
      throw new Error(`Falha ao atualizar imposto: ${error.message}`);
    }
  } else {
    // Insert
    const { error } = await supabase.from("taxes").insert(taxData)
    if (error) {
      console.error("Supabase Error (saveTax insert):", error);
      throw new Error(`Falha ao inserir imposto: ${error.message}`);
    }
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
  const { data, error } = await supabase.from("installments").select("*").eq("isArchived", false).order("calculatedDueDate", { ascending: true })
  if (error) {
    console.error("Supabase Error (getInstallments):", error);
    throw new Error(`Falha ao carregar parcelamentos: ${error.message}`);
  }
  return data as Installment[]
}

export async function saveAllInstallments(installments: Installment[]) {
  const user_id = await getUserId()
  const installmentsWithUserId = installments.map(i => ({ ...i, user_id }))

  const { error } = await supabase.from("installments").upsert(installmentsWithUserId, { onConflict: 'id' })
  if (error) {
    console.error("Supabase Error (saveAllInstallments):", error);
    throw new Error(`Falha ao salvar todos os parcelamentos: ${error.message}`);
  }
}

export async function saveInstallment(installment: Installment) {
  const user_id = await getUserId()
  const installmentData = { ...installment, user_id }

  if (installment.id && installment.createdAt) {
    // Update
    const { error } = await supabase.from("installments").update(installmentData).eq("id", installment.id)
    if (error) {
      console.error("Supabase Error (saveInstallment update):", error);
      throw new Error(`Falha ao atualizar parcelamento: ${error.message}`);
    }
  } else {
    // Insert
    const { error } = await supabase.from("installments").insert(installmentData)
    if (error) {
      console.error("Supabase Error (saveInstallment insert):", error);
      throw new Error(`Falha ao inserir parcelamento: ${error.message}`);
    }
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