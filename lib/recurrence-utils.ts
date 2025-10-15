import type { Obligation, RecurrenceType, Tax, Installment } from "./types"
import { adjustForWeekend } from "./date-utils"

/**
 * Type guard to check if an entity is an Obligation
 */
function isObligation(entity: Obligation | Installment): entity is Obligation {
  return 'priority' in entity;
}

/**
 * Calcula a próxima data de vencimento para um mês específico
 */
function calculateDueDateForMonth(entity: Obligation | Installment, targetDate: Date): Date {
  const targetYear = targetDate.getFullYear()
  const targetMonth = targetDate.getMonth()

  let dueMonth = targetMonth
  if (entity.recurrence === "annual" && entity.dueMonth) {
    dueMonth = entity.dueMonth - 1
  }
  
  const newDueDate = new Date(targetYear, dueMonth, entity.dueDay)

  return adjustForWeekend(newDueDate, entity.weekendRule)
}

/**
 * Gera a próxima ocorrência de uma obrigação ou parcelamento para um mês específico, se necessário.
 */
export function generateOccurrenceForMonth(
  template: Obligation | Installment,
  targetDate: Date,
  existingItems: (Obligation | Installment)[],
): Obligation | Installment | null {
  // 1. Check if generation should happen
  if (!template.autoGenerate) return null
  const endDate = template.recurrenceEndDate ? new Date(template.recurrenceEndDate) : null
  if (endDate && targetDate > endDate) return null

  // 2. Define the period key (e.g., "2024-07")
  const periodKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`

  // 3. Check if an occurrence for this period already exists
  const alreadyExists = existingItems.some(
    (item) => {
      if (isObligation(item) && isObligation(template)) {
        return item.parentObligationId === template.id && item.generatedFor === periodKey;
      }
      if (!isObligation(item) && !isObligation(template)) {
        return item.parentInstallmentId === template.id && item.generatedFor === periodKey;
      }
      return false;
    }
  )
  if (alreadyExists) return null

  // 4. Create the new occurrence
  const newDueDate = calculateDueDateForMonth(template, targetDate)
  
  const newId = crypto.randomUUID();
  
  if (isObligation(template)) { // It's an Obligation
    const newObligation: Obligation = {
      ...template,
      id: newId,
      status: "pending",
      completedAt: undefined,
      completedBy: undefined,
      realizationDate: undefined,
      parentObligationId: template.id,
      generatedFor: periodKey,
      createdAt: new Date().toISOString(),
      history: [
        {
          id: crypto.randomUUID(),
          action: "created",
          description: `Obrigação gerada automaticamente para ${periodKey}`,
          timestamp: new Date().toISOString(),
        },
      ],
    }
    return newObligation;
  } else { // It's an Installment
    const installmentItems = existingItems.filter(i => !isObligation(i)) as Installment[];
    const newInstallment: Installment = {
        ...template,
        id: newId,
        status: "pending",
        completedAt: undefined,
        completedBy: undefined,
        parentInstallmentId: template.id,
        generatedFor: periodKey,
        createdAt: new Date().toISOString(),
        installmentNumber: template.installmentNumber + (installmentItems.filter(i => i.parentInstallmentId === template.id).length),
    }
    return newInstallment;
  }
}


/**
 * Obtém descrição legível da recorrência
 */
export function getRecurrenceDescription(entity: Obligation | Tax | Installment): string {
  const descriptions: Record<RecurrenceType, string> = {
    monthly: "Mensal",
    bimonthly: "Bimestral",
    quarterly: "Trimestral",
    semiannual: "Semestral",
    annual: "Anual",
    custom: entity.recurrenceInterval
      ? `A cada ${entity.recurrenceInterval} ${entity.recurrenceInterval === 1 ? "mês" : "meses"}`
      : "Personalizado",
  }

  return descriptions[entity.recurrence]
}