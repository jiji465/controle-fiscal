import type { Client, Obligation, Tax, Installment, RecurrenceLog, Notification } from "./types"

const STORAGE_KEYS = {
  CLIENTS: "fiscal_clients",
  OBLIGATIONS: "fiscal_obligations",
  TAXES: "fiscal_taxes",
  INSTALLMENTS: "fiscal_installments",
  RECURRENCE_LOG: "fiscal_recurrence_log",
  NOTIFICATIONS: "fiscal_notifications",
}

// --- Clientes ---

export function getClients(): Client[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.CLIENTS)
  return data ? JSON.parse(data) : []
}

export function saveClient(client: Client) {
  const clients = getClients()
  const index = clients.findIndex((c) => c.id === client.id)
  const now = new Date().toISOString()

  if (index > -1) {
    clients[index] = { ...client, updatedAt: now }
  } else {
    clients.push({ ...client, id: crypto.randomUUID(), createdAt: now, updatedAt: now, status: client.status || "active" })
  }
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients))
}

export function deleteClient(id: string) {
  const clients = getClients().filter((c) => c.id !== id)
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients))
}

// --- Obrigações ---

export function getObligations(): Obligation[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.OBLIGATIONS)
  const obligations: Obligation[] = data ? JSON.parse(data) : []
  // Filtra obrigações arquivadas para não aparecerem nas listas ativas
  return obligations.filter(o => !o.isArchived)
}

export function saveAllObligations(obligations: Obligation[]) {
  localStorage.setItem(STORAGE_KEYS.OBLIGATIONS, JSON.stringify(obligations))
}

export function saveObligation(obligation: Obligation) {
  const obligations = getObligations()
  const index = obligations.findIndex((o) => o.id === obligation.id)
  const now = new Date().toISOString()

  if (index > -1) {
    obligations[index] = { ...obligation, updatedAt: now }
  } else {
    obligations.push({
      ...obligation,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      status: obligation.status || "pending",
      history: obligation.history || [],
    })
  }
  localStorage.setItem(STORAGE_KEYS.OBLIGATIONS, JSON.stringify(obligations))
}

export function deleteObligation(id: string) {
  const obligations = getObligations().filter((o) => o.id !== id)
  localStorage.setItem(STORAGE_KEYS.OBLIGATIONS, JSON.stringify(obligations))
}

// --- Impostos (Templates) ---

export function getTaxes(): Tax[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.TAXES)
  const taxes: Tax[] = data ? JSON.parse(data) : []
  // Filtra impostos arquivados
  return taxes.filter(t => !t.isArchived)
}

export function saveAllTaxes(taxes: Tax[]) {
  localStorage.setItem(STORAGE_KEYS.TAXES, JSON.stringify(taxes))
}

export function saveTax(tax: Tax) {
  const taxes = getTaxes()
  const index = taxes.findIndex((t) => t.id === tax.id)
  const now = new Date().toISOString()

  if (index > -1) {
    taxes[index] = { ...tax, updatedAt: now }
  } else {
    taxes.push({
      ...tax,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      recurrence: tax.recurrence || "none",
    })
  }
  localStorage.setItem(STORAGE_KEYS.TAXES, JSON.stringify(taxes))
}

export function deleteTax(id: string) {
  const taxes = getTaxes().filter((t) => t.id !== id)
  localStorage.setItem(STORAGE_KEYS.TAXES, JSON.stringify(taxes))
}

// --- Parcelamentos ---

export function getInstallments(): Installment[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.INSTALLMENTS)
  const installments: Installment[] = data ? JSON.parse(data) : []
  // Filtra parcelamentos arquivados
  return installments.filter(i => !i.isArchived)
}

export function saveAllInstallments(installments: Installment[]) {
  localStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(installments))
}

export function saveInstallment(installment: Installment) {
  const installments = getInstallments()
  const index = installments.findIndex((i) => i.id === installment.id)
  const now = new Date().toISOString()

  if (index > -1) {
    installments[index] = { ...installment, updatedAt: now }
  } else {
    installments.push({
      ...installment,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      status: installment.status || "pending",
    })
  }
  localStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(installments))
}

export function deleteInstallment(id: string) {
  const installments = getInstallments().filter((i) => i.id !== id)
  localStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(installments))
}

// --- Status de Imposto (TaxDueDate) ---

export function saveTaxStatus(taxDueDateId: string, newStatus: "completed" | "in_progress") {
  // A função saveTaxStatus foi removida ou adaptada para não fazer nada,
  // pois a lógica de TaxList foi alterada para não usar saveTaxStatus.
}

// --- Recorrência Log ---

export function getRecurrenceLog(): RecurrenceLog {
  if (typeof window === "undefined") return { lastRunMonthYear: null, timestamp: null, generatedCount: 0 }
  const data = localStorage.getItem(STORAGE_KEYS.RECURRENCE_LOG)
  return data ? JSON.parse(data) : { lastRunMonthYear: null, timestamp: null, generatedCount: 0 }
}

export function saveRecurrenceLog(log: RecurrenceLog) {
  localStorage.setItem(STORAGE_KEYS.RECURRENCE_LOG, JSON.stringify(log))
}

// --- Notificações ---

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