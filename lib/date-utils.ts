import type { WeekendRule, Tax, Installment, RecurrenceType } from "./types"
import { format } from "date-fns"

/**
 * Verifica se uma data está atrasada (vencida).
 * @param dateString Data no formato 'YYYY-MM-DD'.
 * @returns true se a data for anterior a hoje.
 */
export const isOverdue = (dateString: string): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = new Date(dateString)
  dueDate.setHours(0, 0, 0, 0)
  return dueDate < today
}

/**
 * Formata uma string de data para o formato brasileiro.
 * @param dateString Data no formato 'YYYY-MM-DD'.
 * @returns Data no formato 'DD/MM/YYYY'.
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return ""
  try {
    return format(new Date(dateString), "dd/MM/yyyy")
  } catch (e) {
    return dateString
  }
}

/**
 * Ajusta a data se cair em um fim de semana, com base na regra.
 */
const adjustForWeekend = (date: Date, rule?: WeekendRule): Date => {
  if (!rule || rule === "none") return date

  let adjustedDate = new Date(date)
  const dayOfWeek = adjustedDate.getDay() // 0 = Sunday, 6 = Saturday

  if (dayOfWeek === 0) {
    // Sunday
    if (rule === "advance") {
      adjustedDate.setDate(adjustedDate.getDate() - 2) // Friday
    } else if (rule === "postpone") {
      adjustedDate.setDate(adjustedDate.getDate() + 1) // Monday
    }
  } else if (dayOfWeek === 6) {
    // Saturday
    if (rule === "advance") {
      adjustedDate.setDate(adjustedDate.getDate() - 1) // Friday
    } else if (rule === "postpone") {
      adjustedDate.setDate(adjustedDate.getDate() + 2) // Monday
    }
  }

  return adjustedDate
}

/**
 * Calcula a data de vencimento de um imposto (template) para o mês atual.
 */
export const calculateTaxDueDate = (tax: Tax, referenceDate: Date = new Date()): Date => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. Determine the base date (Year and Month)
  let dueDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), tax.dueDay);
  dueDate.setHours(0, 0, 0, 0);

  // If the tax has a specific dueMonth (e.g., annual recurrence), use it.
  if (tax.dueMonth !== undefined && tax.recurrence === "annual") {
    dueDate.setMonth(tax.dueMonth - 1);
  }

  // 2. Advance the date if it's in the past (for recurrence)
  if (dueDate < today) {
    let interval = tax.recurrenceInterval || 1;
    let recurrenceType: RecurrenceType = tax.recurrence;

    while (dueDate < today) {
      switch (recurrenceType) {
        case "monthly":
        case "custom":
          // Advance by interval until it's today or future
          dueDate.setMonth(dueDate.getMonth() + interval);
          break;
        case "bimonthly":
          interval = 2;
          dueDate.setMonth(dueDate.getMonth() + interval);
          break;
        case "quarterly":
          interval = 3;
          dueDate.setMonth(dueDate.getMonth() + interval);
          break;
        case "semiannual":
          interval = 6;
          dueDate.setMonth(dueDate.getMonth() + interval);
          break;
        case "annual":
          dueDate.setFullYear(dueDate.getFullYear() + interval);
          break;
        case "none":
          // If it's 'none' and in the past, stop.
          return dueDate;
      }
    }
  }

  // 3. Apply weekend rule
  return adjustForWeekend(dueDate, tax.weekendRule);
};

/**
 * Calcula a data de vencimento de um parcelamento para o mês atual.
 */
export const calculateInstallmentDueDate = (installment: Installment, referenceDate: Date = new Date()): Date => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. Determine the base date (Year and Month)
  let dueDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), installment.dueDay);
  dueDate.setHours(0, 0, 0, 0);

  // 2. Advance the date if it's in the past (for recurrence)
  if (dueDate < today) {
    let interval = installment.recurrenceInterval || 1;
    let recurrenceType: RecurrenceType = installment.recurrence;

    while (dueDate < today) {
      switch (recurrenceType) {
        case "monthly":
        case "custom":
          // Advance by interval until it's today or future
          dueDate.setMonth(dueDate.getMonth() + interval);
          break;
        case "bimonthly":
          interval = 2;
          dueDate.setMonth(dueDate.getMonth() + interval);
          break;
        case "quarterly":
          interval = 3;
          dueDate.setMonth(dueDate.getMonth() + interval);
          break;
        case "semiannual":
          interval = 6;
          dueDate.setMonth(dueDate.getMonth() + interval);
          break;
        case "annual":
          dueDate.setFullYear(dueDate.getFullYear() + interval);
          break;
        case "none":
          // If it's 'none' and in the past, stop.
          return dueDate;
      }
    }
  }

  // 3. Apply weekend rule
  return adjustForWeekend(dueDate, installment.weekendRule);
};