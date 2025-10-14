import type { WeekendRule, Tax } from "./types"

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay()
  return day === 0 || day === 6
}

export const adjustForWeekend = (date: Date, rule: WeekendRule): Date => {
  if (!isWeekend(date)) return date

  const adjusted = new Date(date)

  if (rule === "anticipate") {
    // Move to previous business day
    while (isWeekend(adjusted)) {
      adjusted.setDate(adjusted.getDate() - 1)
    }
  } else if (rule === "postpone") {
    // Move to next business day
    while (isWeekend(adjusted)) {
      adjusted.setDate(adjusted.getDate() + 1)
    }
  }
  // 'keep' doesn't change the date

  return adjusted
}

export const calculateDueDate = (
  dueDay: number,
  dueMonth: number | undefined,
  frequency: string,
  weekendRule: WeekendRule,
  referenceDate: Date = new Date(),
): Date => {
  let dueDate: Date

  if (frequency === "annual" && dueMonth) {
    // Annual obligation with specific month
    dueDate = new Date(referenceDate.getFullYear(), dueMonth - 1, dueDay)
    if (dueDate < referenceDate) {
      dueDate.setFullYear(dueDate.getFullYear() + 1)
    }
  } else if (frequency === "quarterly" && dueMonth) {
    // Quarterly obligation
    dueDate = new Date(referenceDate.getFullYear(), dueMonth - 1, dueDay)
    while (dueDate < referenceDate) {
      dueDate.setMonth(dueDate.getMonth() + 3)
    }
  } else {
    // Monthly or custom
    dueDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), dueDay)
    if (dueDate < referenceDate) {
      dueDate.setMonth(dueDate.getMonth() + 1)
    }
  }

  return adjustForWeekend(dueDate, weekendRule)
}

export const calculateTaxDueDate = (
  tax: Tax,
  referenceDate: Date = new Date(),
): Date => {
  if (tax.dueDay === undefined) {
    // If no dueDay, return the referenceDate. Taxes without a dueDay won't be displayed on the calendar.
    return referenceDate;
  }

  let dueDate: Date;
  // For Tax templates, we calculate the next upcoming due date based on its recurrence and dueDay.
  // This is a simplified calculation for display purposes in the calendar.
  dueDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), tax.dueDay);

  // Adjust based on recurrence type to find the next relevant date
  switch (tax.recurrence) {
    case "monthly":
    case "custom": // Assuming custom is also monthly-based for simplicity here
      if (dueDate < referenceDate && dueDate.getDate() !== referenceDate.getDate()) {
        dueDate.setMonth(dueDate.getMonth() + (tax.recurrenceInterval || 1));
      }
      break;
    case "bimonthly":
      // Find the next bimonthly occurrence
      while (dueDate < referenceDate || (dueDate.getMonth() % 2 !== referenceDate.getMonth() % 2)) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      break;
    case "quarterly":
      // Find the next quarterly occurrence
      while (dueDate < referenceDate || (dueDate.getMonth() % 3 !== referenceDate.getMonth() % 3)) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      break;
    case "semiannual":
      // Find the next semiannual occurrence
      while (dueDate < referenceDate || (dueDate.getMonth() % 6 !== referenceDate.getMonth() % 6)) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      break;
    case "annual":
      // Find the next annual occurrence
      if (dueDate < referenceDate) {
        dueDate.setFullYear(dueDate.getFullYear() + 1);
      }
      break;
  }

  return adjustForWeekend(dueDate, tax.weekendRule);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("pt-BR")
}

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export const isOverdue = (dueDate: string): boolean => {
  return new Date(dueDate) < new Date()
}

export const isUpcomingThisWeek = (dueDate: string): boolean => {
  const due = new Date(dueDate)
  const today = new Date()
  const weekFromNow = new Date()
  weekFromNow.setDate(today.getDate() + 7)
  return due >= today && due <= weekFromNow
}