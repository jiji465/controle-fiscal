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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Determine the base date (Year and Month)
  let dueDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), tax.dueDay);
  dueDate.setHours(0, 0, 0, 0);

  // If the tax has a specific dueMonth (e.g., annual recurrence), use it.
  if (tax.dueMonth !== undefined && tax.recurrence === "annual") {
    dueDate.setMonth(tax.dueMonth - 1);
  }

  // 2. Advance the date if it's in the past relative to today, considering recurrence rules.
  // We only advance if the date is strictly in the past.
  if (dueDate < today) {
    let interval = tax.recurrenceInterval || 1;
    
    switch (tax.recurrence) {
      case "monthly":
      case "custom":
        // Advance by interval until it's today or future
        while (dueDate < today) {
          dueDate.setMonth(dueDate.getMonth() + interval);
        }
        break;
      case "bimonthly":
        interval = 2;
        while (dueDate < today || (dueDate.getMonth() % interval !== today.getMonth() % interval)) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }
        break;
      case "quarterly":
        interval = 3;
        while (dueDate < today || (dueDate.getMonth() % interval !== today.getMonth() % interval)) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }
        break;
      case "semiannual":
        interval = 6;
        while (dueDate < today || (dueDate.getMonth() % interval !== today.getMonth() % interval)) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }
        break;
      case "annual":
        // Advance year until it's today or future
        while (dueDate < today) {
          dueDate.setFullYear(dueDate.getFullYear() + 1);
        }
        break;
    }
  }

  // 3. Apply weekend rule
  return adjustForWeekend(dueDate, tax.weekendRule);
};

export const calculateInstallmentDueDate = (
  installment: Installment,
  referenceDate: Date = new Date(),
): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Determine the base date (Year and Month)
  let dueDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), installment.dueDay);
  dueDate.setHours(0, 0, 0, 0);

  // If the installment has a specific dueMonth (e.g., annual recurrence), use it.
  if (installment.dueMonth !== undefined && installment.recurrence === "annual") {
    dueDate.setMonth(installment.dueMonth - 1); // Months are 0-indexed
  }

  // 2. Advance the date if it's in the past relative to today, considering recurrence rules.
  if (dueDate < today) {
    let interval = installment.recurrenceInterval || 1;

    switch (installment.recurrence) {
      case "monthly":
      case "custom":
        // Advance by interval until it's today or future
        while (dueDate < today) {
          dueDate.setMonth(dueDate.getMonth() + interval);
        }
        break;
      case "bimonthly":
        interval = 2;
        while (dueDate < today || (dueDate.getMonth() % interval !== today.getMonth() % interval)) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }
        break;
      case "quarterly":
        interval = 3;
        while (dueDate < today || (dueDate.getMonth() % interval !== today.getMonth() % interval)) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }
        break;
      case "semiannual":
        interval = 6;
        while (dueDate < today || (dueDate.getMonth() % interval !== today.getMonth() % interval)) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }
        break;
      case "annual":
        // Advance year until it's today or future
        while (dueDate < today) {
          dueDate.setFullYear(dueDate.getFullYear() + 1);
        }
        break;
    }
  }

  // 3. Apply weekend rule
  return adjustForWeekend(dueDate, installment.weekendRule);
};


export const formatDate = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("pt-BR")
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