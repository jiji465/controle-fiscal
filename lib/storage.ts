import type { Client, Tax, Obligation, Notification, Installment } from "./types"

const STORAGE_KEYS = {
  CLIENTS: "fiscal_clients",
  TAXES: "fiscal_taxes",
  OBLIGATIONS: "fiscal_obligations",
  NOTIFICATIONS: "fiscal_notifications",
  INSTALLMENTS: "fiscal_installments", // New key for installments
}

// Client Storage
export const getClients = (): Client[] => {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.CLIENTS)
  return data ? JSON.parse(data) : []
}

export const saveClient = (client: Client): void => {
  const clients = getClients()
  const index = clients.findIndex((c) => c.id === client.id)
  if (index >= 0) {
    clients[index] = client
  } else {
    clients.push(client)
  }
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients))
}

export const deleteClient = (id: string): void => {
  const clients = getClients().filter((c) => c.id !== id)
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients))
}

// Tax Storage
export const getTaxes = (): Tax[] => {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.TAXES)
  return data ? JSON.parse(data) : []
}

export const saveTax = (tax: Tax): void => {
  const taxes = getTaxes()
  const index = taxes.findIndex((t) => t.id === tax.id)
  if (index >= 0) {
    taxes[index] = tax
  } else {
    taxes.push(tax)
  }
  localStorage.setItem(STORAGE_KEYS.TAXES, JSON.stringify(taxes))
}

export const deleteTax = (id: string): void => {
  const taxes = getTaxes().filter((t) => t.id !== id)
  localStorage.setItem(STORAGE_KEYS.TAXES, JSON.stringify(taxes))
}

// Obligation Storage
export const getObligations = (): Obligation[] => {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.OBLIGATIONS)
  return data ? JSON.parse(data) : []
}

export const saveObligation = (obligation: Obligation): void => {
  const obligations = getObligations()
  const index = obligations.findIndex((o) => o.id === obligation.id)
  if (index >= 0) {
    obligations[index] = obligation
  } else {
    obligations.push(obligation)
  }
  localStorage.setItem(STORAGE_KEYS.OBLIGATIONS, JSON.stringify(obligations))
}

export const deleteObligation = (id: string): void => {
  const obligations = getObligations().filter((o) => o.id !== id)
  localStorage.setItem(STORAGE_KEYS.OBLIGATIONS, JSON.stringify(obligations))
}

// Installment Storage
export const getInstallments = (): Installment[] => {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.INSTALLMENTS)
  return data ? JSON.parse(data) : []
}

export const saveInstallment = (installment: Installment): void => {
  const installments = getInstallments()
  const index = installments.findIndex((i) => i.id === installment.id)
  if (index >= 0) {
    installments[index] = installment
  } else {
    installments.push(installment)
  }
  localStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(installments))
}

export const deleteInstallment = (id: string): void => {
  const installments = getInstallments().filter((i) => i.id !== id)
  localStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(installments))
}

// Notification Storage
export const getNotifications = (): Notification[] => {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)
  return data ? JSON.parse(data) : []
}

export const saveNotification = (notification: Notification): void => {
  const notifications = getNotifications()
  const index = notifications.findIndex((n) => n.id === notification.id)
  if (index >= 0) {
    notifications[index] = notification
  } else {
    notifications.push(notification)
  }
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications))
}

export const addNotification = (message: string, type: Notification["type"] = "info", link?: string): void => {
  const newNotification: Notification = {
    id: crypto.randomUUID(),
    message,
    type,
    link,
    read: false,
    timestamp: new Date().toISOString(),
  };
  const notifications = getNotifications();
  notifications.unshift(newNotification); // Add to the beginning
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
};

export const markNotificationAsRead = (id: string): void => {
  const notifications = getNotifications();
  const index = notifications.findIndex((n) => n.id === id);
  if (index >= 0) {
    notifications[index].read = true;
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }
};

export const clearNotifications = (): void => {
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
};