import type { WeekendRule, Tax, Installment } from "./types"

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
  frequency: string, // This is now less relevant for Tax/Installment, but kept for Obligation
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
    return referenceDate; // Or throw an error, depending on desired behavior for invalid tax templates
  }

  let dueDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), tax.dueDay);

  // Ensure the due date is in the future or current month/day
  if (dueDate < referenceDate && dueDate.getDate() !== referenceDate.getDate()) {
    dueDate.setMonth(dueDate.getMonth() + (tax.recurrenceInterval || 1));
  }

  // Adjust based on recurrence type to find the next relevant date
  switch (tax.recurrence) {
    case "monthly":
    case "custom":
      // Already handled by initial check and recurrenceInterval
      break;
    case "bimonthly":
      while (dueDate < referenceDate || (dueDate.getMonth() % 2 !== referenceDate.getMonth() % 2)) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      break;
    case "quarterly":
      while (dueDate < referenceDate || (dueDate.getMonth() % 3 !== referenceDate.getMonth() % 3)) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      break;
    case "semiannual":
      while (dueDate < referenceDate || (dueDate.getMonth() % 6 !== referenceDate.getMonth() % 6)) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      break;
    case "annual":
      if (dueDate < referenceDate) {
        dueDate.setFullYear(dueDate.getFullYear() + 1);
      }
      break;
  }

  return adjustForWeekend(dueDate, tax.weekendRule);
};

export const calculateInstallmentDueDate = (
  installment: Installment,
  referenceDate: Date = new Date(),
): Date => {
  let dueDate: Date;

  // Start with the current year/month and the installment's dueDay
  dueDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), installment.dueDay);

  // If a specific dueMonth is defined (e.g., for annual installments)
  if (installment.dueMonth !== undefined) {
    dueDate.setMonth(installment.dueMonth - 1); // Months are 0-indexed
    if (dueDate < referenceDate && dueDate.getDate() !== referenceDate.getDate()) {
      dueDate.setFullYear(dueDate.getFullYear() + 1);
    }
  } else {
    // For monthly or other recurring types without a specific month
    if (dueDate < referenceDate && dueDate.getDate() !== referenceDate.getDate()) {
      dueDate.setMonth(dueDate.getMonth() + (installment.recurrenceInterval || 1));
    }
  }

  // Adjust based on recurrence type to find the next relevant date
  switch (installment.recurrence) {
    case "monthly":
    case "custom":
      // Already handled by initial check and recurrenceInterval
      break;
    case "bimonthly":
      while (dueDate < referenceDate || (dueDate.getMonth() % 2 !== referenceDate.getMonth() % 2)) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      break;
    case "quarterly":
      while (dueDate < referenceDate || (dueDate.getMonth() % 3 !== referenceDate.getMonth() % 3)) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      break;
    case "semiannual":
      while (dueDate < referenceDate || (dueDate.getMonth() % 6 !== referenceDate.getMonth() % 6)) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      break;
    case "annual":
      if (dueDate < referenceDate) {
        dueDate.setFullYear(dueDate.getFullYear() + 1);
      }
      break;
  }

  return adjustForWeekend(dueDate, installment.weekendRule);
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
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to start of day
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0); // Normalize due date to start of day
  return due < today;
}

export const isUpcomingThisWeek = (dueDate: string): boolean => {
  const due = new Date(dueDate)
  const today = new Date()
  const weekFromNow = new Date()
  weekFromNow.setDate(today.getDate() + 7)
  return due >= today && due <= weekFromNow
}