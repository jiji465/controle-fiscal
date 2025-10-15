import type { Obligation, Installment, Tax, FiscalEvent } from "./types"
import { v4 as uuidv4 } from "uuid"

/**
 * Calcula a próxima data de vencimento com base na recorrência.
 * @param event O objeto FiscalEvent (Obligation, Installment ou Tax).
 * @param referenceDate A data a partir da qual calcular (geralmente a data atual).
 * @returns A próxima data de vencimento no formato 'YYYY-MM-DD'.
 */
export function calculateNextDueDate(event: FiscalEvent, referenceDate: Date = new Date()): string {
  const lastDueDate = new Date(event.calculatedDueDate)
  let nextDate = new Date(lastDueDate)

  // Usa recurrenceInterval se for customizado
  const interval = event.recurrenceInterval || 1;

  if (event.recurrence === "monthly" || event.recurrence === "custom") {
    // Se a data de referência for posterior à última data de vencimento,
    // avançamos para o próximo mês.
    if (referenceDate > lastDueDate) {
      nextDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + interval, lastDueDate.getDate())
    } else {
      nextDate = new Date(lastDueDate.getFullYear(), lastDueDate.getMonth() + interval, lastDueDate.getDate())
    }
  } else if (event.recurrence === "bimonthly") {
    nextDate = new Date(lastDueDate.getFullYear(), lastDueDate.getMonth() + 2, lastDueDate.getDate())
  } else if (event.recurrence === "quarterly") {
    nextDate = new Date(lastDueDate.getFullYear(), lastDueDate.getMonth() + 3, lastDueDate.getDate())
  } else if (event.recurrence === "semiannual") {
    nextDate = new Date(lastDueDate.getFullYear(), lastDueDate.getMonth() + 6, lastDueDate.getDate())
  } else if (event.recurrence === "annual") {
    nextDate = new Date(lastDueDate.getFullYear() + 1, lastDueDate.getMonth(), lastDueDate.getDate())
  }

  // Ajuste para o último dia do mês, se necessário (ex: 31 de jan -> 28/29 de fev)
  const day = lastDueDate.getDate()
  if (day > 28 && nextDate.getMonth() !== lastDueDate.getMonth() + interval) {
    nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), 0) // Último dia do mês
  }

  return nextDate.toISOString().split("T")[0]
}

/**
 * Gera uma nova ocorrência de um evento recorrente para o mês atual.
 * @param event O evento base (Obligation, Installment ou Tax).
 * @param newDueDate A data de vencimento da nova ocorrência.
 * @returns A nova ocorrência do evento.
 */
export function generateNextRecurrence(event: FiscalEvent, newDueDate: string): FiscalEvent {
  const newId = uuidv4()
  const now = new Date().toISOString()

  const baseEvent = {
    ...event,
    id: newId,
    calculatedDueDate: newDueDate,
    createdAt: now,
    updatedAt: now,
    status: "pending" as const, // Sempre começa como pendente
    completedAt: undefined,
    completedBy: undefined,
    realizationDate: undefined,
    history: [
      {
        id: uuidv4(),
        action: "created" as const,
        description: "Ocorrência gerada automaticamente por recorrência",
        timestamp: now,
      },
    ],
  }

  if (event.type === "obligation") {
    return {
      ...baseEvent,
      type: "obligation" as const,
      // Mantém a referência ao imposto, se houver
      taxId: (event as Obligation).taxId,
    } as Obligation
  }

  if (event.type === "installment") {
    const installment = event as Installment
    return {
      ...baseEvent,
      type: "installment" as const,
      // Incrementa o número da parcela
      installmentNumber: installment.installmentNumber + 1,
      // Mantém o total de parcelas
      totalInstallments: installment.totalInstallments,
    } as Installment
  }

  if (event.type === "tax") {
    return {
      ...baseEvent,
      type: "tax" as const,
      // Mantém as propriedades específicas de Tax
      federalTaxCode: (event as Tax).federalTaxCode,
      stateTaxCode: (event as Tax).stateTaxCode,
      municipalTaxCode: (event as Tax).municipalTaxCode,
    } as Tax
  }

  return baseEvent as FiscalEvent // Fallback, should not happen
}

/**
 * Retorna a descrição da recorrência em Português.
 */
export function getRecurrenceDescription(event: FiscalEvent): string {
  switch (event.recurrence) {
    case "monthly":
      return "Mensal"
    case "bimonthly":
      return "Bimestral"
    case "quarterly":
      return "Trimestral"
    case "semiannual":
      return "Semestral"
    case "annual":
      return "Anual"
    case "custom":
      return `Personalizada (${event.recurrenceInterval} meses)`
    case "none":
    default:
      return "Única"
  }
}