import type { Client, Tax, Obligation, Notification, Installment, FiscalEventStatus } from "./types"
import { createClient, createTax, createObligation, createInstallment } from "./factory"

const STORAGE_KEYS = {
  CLIENTS: "fiscal_clients",
  TAXES: "fiscal_taxes",
  OBLIGATIONS: "fiscal_obligations",
  NOTIFICATIONS: "fiscal_notifications",
  INSTALLMENTS: "fiscal_installments",
  TAX_STATUSES: "fiscal_tax_statuses",
  RECURRENCE_LAST_RUN: "fiscal_recurrence_last_run",
}

// Recurrence Generation Tracker
export const getLastGenerationRun = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_KEYS.RECURRENCE_LAST_RUN)
}

export const setLastGenerationRun = (date: string): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.RECURRENCE_LAST_RUN, date)
}


// Client Storage
export const getClients = (): Client[] => {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.CLIENTS)
  if (data) return JSON.parse(data);

  // No data, create sample clients
  const sampleClients = [
    createClient({ id: 'client-1', name: 'Empresa Alpha Ltda', cnpj: '00.111.222/0001-33', status: 'active', taxRegime: 'Simples Nacional' }),
    createClient({ id: 'client-2', name: 'Comércio Beta S.A.', cnpj: '33.444.555/0001-66', status: 'active', taxRegime: 'Lucro Presumido' }),
    createClient({ id: 'client-3', name: 'Serviços Gama', cnpj: '66.777.888/0001-99', status: 'inactive', taxRegime: 'Lucro Real' }),
  ];
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(sampleClients));
  return sampleClients;
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
  if (data) return JSON.parse(data);

  const sampleTaxes = [
    createTax({ id: 'tax-1', name: 'ICMS', description: 'Imposto sobre Circulação de Mercadorias e Serviços', dueDay: 20, recurrence: 'monthly' }),
    createTax({ id: 'tax-2', name: 'PIS/COFINS', description: 'Contribuições para o PIS e COFINS', dueDay: 25, recurrence: 'monthly' }),
    createTax({ id: 'tax-3', name: 'IRPJ/CSLL', description: 'Imposto de Renda e Contribuição Social', dueDay: 30, recurrence: 'quarterly' }),
  ];
  localStorage.setItem(STORAGE_KEYS.TAXES, JSON.stringify(sampleTaxes));
  return sampleTaxes;
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
  if (data) return JSON.parse(data);

  const sampleObligations = [
    createObligation({ id: 'obl-1', name: 'EFD Contribuições', clientId: 'client-1', taxId: 'tax-2', dueDay: 15, status: 'pending', priority: 'high', autoGenerate: true }),
    createObligation({ id: 'obl-2', name: 'DCTFWeb', clientId: 'client-2', dueDay: 15, status: 'in_progress', priority: 'urgent', autoGenerate: true }),
    createObligation({ id: 'obl-3', name: 'SPED Fiscal', clientId: 'client-1', taxId: 'tax-1', dueDay: 20, status: 'completed', completedAt: new Date().toISOString() }),
  ];
  localStorage.setItem(STORAGE_KEYS.OBLIGATIONS, JSON.stringify(sampleObligations));
  return sampleObligations;
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

// Tax Status Storage
export const getTaxStatuses = (): Record<string, FiscalEventStatus> => {
  if (typeof window === "undefined") return {}
  const data = localStorage.getItem(STORAGE_KEYS.TAX_STATUSES)
  return data ? JSON.parse(data) : {}
}

export const saveTaxStatus = (taxDueDateId: string, status: FiscalEventStatus): void => {
  const statuses = getTaxStatuses()
  statuses[taxDueDateId] = status
  localStorage.setItem(STORAGE_KEYS.TAX_STATUSES, JSON.stringify(statuses))
}

// Installment Storage
export const getInstallments = (): Installment[] => {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.INSTALLMENTS)
  if (data) return JSON.parse(data);

  const sampleInstallments = [
    createInstallment({ id: 'inst-1', name: 'Parcelamento REFIS', clientId: 'client-2', installmentNumber: 3, totalInstallments: 12, dueDay: 28, status: 'pending', autoGenerate: true }),
    createInstallment({ id: 'inst-2', name: 'Parcelamento IPTU', clientId: 'client-1', installmentNumber: 1, totalInstallments: 10, dueDay: 10, status: 'completed', completedAt: new Date().toISOString() }),
  ];
  localStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(sampleInstallments));
  return sampleInstallments;
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