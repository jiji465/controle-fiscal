import type { Client, Obligation, Tax, Installment, ClientStatus, ObligationCategory, FiscalEventStatus, RecurrenceType } from "./types"
import { v4 as uuidv4 } from "uuid"

export const createClient = (overrides: Partial<Client> = {}): Client => ({
  id: crypto.randomUUID(),
  name: "Novo Cliente",
  cnpj: "",
  email: "",
  phone: "",
  taxRegime: "Simples Nacional",
  status: "active" as ClientStatus,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createTax = (overrides: Partial<Tax> = {}): Tax => ({
  id: crypto.randomUUID(),
  name: "Novo Imposto",
  description: "Descrição do imposto",
  federalTaxCode: "",
  stateTaxCode: "",
  municipalTaxCode: "",
  recurrence: "monthly" as RecurrenceType,
  recurrenceInterval: 1, // Adicionado
  recurrenceEndDate: undefined, // Adicionado
  autoGenerate: true, // Adicionado
  weekendRule: "none", // Adicionado
  dueDay: 10, // Adicionado
  dueMonth: undefined, // Adicionado
  clientId: overrides.clientId || "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  calculatedDueDate: new Date().toISOString().split("T")[0],
  tags: [], // Adicionado
  type: "tax", // Adicionado
  ...overrides,
})

export const createObligation = (overrides: Partial<Obligation> = {}): Obligation => ({
  id: crypto.randomUUID(),
  name: "Nova Obrigação",
  description: "Descrição da obrigação acessória",
  category: "federal" as ObligationCategory,
  clientId: overrides.clientId || "",
  taxId: undefined,
  dueDay: 15,
  dueMonth: undefined,
  frequency: "monthly",
  recurrence: "monthly" as RecurrenceType,
  recurrenceInterval: 1, // Adicionado
  recurrenceEndDate: undefined, // Adicionado
  autoGenerate: true, // Adicionado
  weekendRule: "none", // Adicionado
  calculatedDueDate: new Date().toISOString().split("T")[0],
  status: "pending" as FiscalEventStatus,
  priority: "medium",
  assignedTo: undefined,
  protocol: undefined,
  realizationDate: undefined,
  completedAt: undefined,
  completedBy: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  notes: undefined,
  history: [],
  tags: [], // Adicionado
  attachments: [], // Adicionado
  isArchived: false,
  type: "obligation", // Adicionado
  ...overrides,
})

export const createInstallment = (overrides: Partial<Installment> = {}): Installment => ({
  id: crypto.randomUUID(),
  name: "Novo Parcelamento",
  description: "Descrição do parcelamento",
  clientId: overrides.clientId || "",
  installmentNumber: 1,
  totalInstallments: 60,
  dueDay: 20,
  dueMonth: undefined,
  recurrence: "monthly" as RecurrenceType,
  recurrenceInterval: 1, // Adicionado
  recurrenceEndDate: undefined, // Adicionado
  autoGenerate: true, // Adicionado
  weekendRule: "none", // Adicionado
  calculatedDueDate: new Date().toISOString().split("T")[0],
  status: "pending" as FiscalEventStatus,
  completedAt: undefined,
  completedBy: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  notes: undefined,
  generatedFor: undefined,
  isArchived: false,
  tags: [], // Adicionado
  type: "installment", // Adicionado
  ...overrides,
})