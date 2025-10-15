import {
  getClients,
  getObligations,
  getTaxes,
  getInstallments,
  saveObligation,
  saveInstallment,
  saveTax,
  saveRecurrenceLog,
  getRecurrenceLog,
  saveAllObligations,
  saveAllInstallments,
  saveAllTaxes,
} from "./storage"
import type {
  Client,
  Obligation,
  Tax,
  DashboardStats,
  ObligationWithDetails,
  TaxDueDate,
  Installment,
  InstallmentWithDetails,
  FiscalEvent,
}
from "./types"
import { isOverdue } from "./date-utils"
import { calculateNextDueDate, generateNextRecurrence } from "./recurrence-utils"

// --- Funções de Geração de Dados (Mantidas) ---

export async function getObligationsWithDetails(): Promise<ObligationWithDetails[]> {
  const obligations = await getObligations()
  const clients = await getClients()
  const taxes = await getTaxes()

  const clientMap = new Map(clients.map((c) => [c.id, c]))
  const taxMap = new Map(taxes.map((t) => [t.id, t]))

  return obligations
    .map((obl) => {
      const client = clientMap.get(obl.clientId)
      const tax = obl.taxId ? taxMap.get(obl.taxId) : undefined

      if (!client) return null

      return {
        ...obl,
        client,
        tax,
        type: "obligation",
        status: isOverdue(obl.calculatedDueDate) && obl.status !== "completed" ? "overdue" : obl.status,
      } as ObligationWithDetails
    })
    .filter((obl): obl is ObligationWithDetails => obl !== null)
    .sort((a, b) => new Date(a.calculatedDueDate).getTime() - new Date(b.calculatedDueDate).getTime())
}

export async function getInstallmentsWithDetails(): Promise<InstallmentWithDetails[]> {
  const installments = await getInstallments()
  const clients = await getClients()

  const clientMap = new Map(clients.map((c) => [c.id, c]))

  return installments
    .map((inst) => {
      const client = clientMap.get(inst.clientId)

      if (!client) return null

      return {
        ...inst,
        client,
        type: "installment",
        status: isOverdue(inst.calculatedDueDate) && inst.status !== "completed" ? "overdue" : inst.status,
      } as InstallmentWithDetails
    })
    .filter((inst): inst is InstallmentWithDetails => inst !== null)
    .sort((a, b) => new Date(a.calculatedDueDate).getTime() - new Date(b.calculatedDueDate).getTime())
}

export async function getTaxesDueDates(monthsAhead: number = 3): Promise<TaxDueDate[]> {
  const taxes = await getTaxes()
  const clients = await getClients()

  const clientMap = new Map(clients.map((c) => [c.id, c]))
  const today = new Date()
  const endDate = new Date(today.getFullYear(), today.getMonth() + monthsAhead, 0)

  const allDueDates: TaxDueDate[] = []

  taxes.forEach((tax) => {
    const client = clientMap.get(tax.clientId)
    if (!client) return

    let currentDate = new Date(tax.calculatedDueDate)

    // Generate occurrences until the end date
    while (currentDate <= endDate) {
      const dueDateStr = currentDate.toISOString().split("T")[0]
      const status = isOverdue(dueDateStr) ? "overdue" : "pending"

      allDueDates.push({
        id: `${tax.id}-${dueDateStr}`, // Unique ID for this occurrence
        name: tax.name,
        description: tax.description,
        calculatedDueDate: dueDateStr,
        clientId: tax.clientId,
        client: client,
        type: "tax",
        status: status,
        recurrence: tax.recurrence,
        createdAt: tax.createdAt,
        updatedAt: tax.updatedAt,
        federalTaxCode: tax.federalTaxCode,
        stateTaxCode: tax.stateTaxCode,
        municipalTaxCode: tax.municipalTaxCode,
        notes: tax.notes,
        tags: tax.tags,
      })

      // Calculate the next date based on recurrence
      if (tax.recurrence === "none") break

      const nextDateStr = calculateNextDueDate(tax, currentDate)
      currentDate = new Date(nextDateStr)
      if (currentDate.toISOString().split("T")[0] === dueDateStr) {
        // Prevent infinite loop if recurrence calculation fails
        break
      }
    }
  })

  return allDueDates.sort((a, b) => new Date(a.calculatedDueDate).getTime() - new Date(b.calculatedDueDate).getTime())
}

export async function calculateDashboardStats(): Promise<DashboardStats> {
  const obligations = await getObligations()
  const installments = await getInstallments()
  const clients = await getClients()

  const totalObligations = obligations.length
  const totalInstallments = installments.length
  const totalClients = clients.length
  const activeClients = clients.filter(c => c.status === 'active').length

  const allEvents = [...obligations, ...installments]
  const totalEvents = allEvents.length

  const completedObligations = obligations.filter((o) => o.status === "completed").length
  const completedInstallments = installments.filter((i) => i.status === "completed").length
  const completedTotal = completedObligations + completedInstallments

  const overdueObligations = obligations.filter(
    (o) => o.status !== "completed" && isOverdue(o.calculatedDueDate),
  ).length
  const overdueInstallments = installments.filter(
    (i) => i.status !== "completed" && isOverdue(i.calculatedDueDate),
  ).length
  const overdueTotal = overdueObligations + overdueInstallments

  const pendingEvents = totalEvents - completedTotal

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const completedThisMonth = allEvents.filter(e => e.completedAt && new Date(e.completedAt) >= startOfMonth).length

  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingThisWeek = allEvents.filter(e => {
    const dueDate = new Date(e.calculatedDueDate)
    return e.status !== 'completed' && dueDate >= today && dueDate <= nextWeek
  }).length

  const completionRate =
    totalEvents > 0
      ? Math.round((completedTotal / totalEvents) * 100)
      : 0

  return {
    totalClients,
    activeClients,
    totalEvents,
    pendingEvents,
    completedThisMonth,
    overdueEvents: overdueTotal,
    upcomingThisWeek,
    totalObligations: totalEvents,
    completed: completedTotal,
    overdue: overdueTotal,
    completionRate,
  }
}

// --- Lógica de Recorrência e Arquivamento (Nova) ---

/**
 * Verifica se a geração de recorrência para o mês atual já foi executada.
 * Se não, gera novas ocorrências e arquiva as antigas.
 */
export async function runRecurrenceCheckAndGeneration() {
  try {
    const now = new Date()
    const currentMonthYear = `${now.getFullYear()}-${now.getMonth() + 1}`
    const log = getRecurrenceLog()

    // 1. Verifica se a geração já foi feita para este mês/ano
    if (log.lastRunMonthYear === currentMonthYear) {
      console.log(`Recorrência já executada para ${currentMonthYear}. Pulando geração.`)
      return
    }

    console.log(`Executando verificação de recorrência para ${currentMonthYear}...`)

    const allObligations = await getObligations()
    const allInstallments = await getInstallments()
    const allTaxes = await getTaxes()

    const newObligations: Obligation[] = []
    const newInstallments: Installment[] = []
    const newTaxes: Tax[] = []

    const updatedObligations: Obligation[] = []
    const updatedInstallments: Installment[] = []
    const updatedTaxes: Tax[] = []

    const todayStr = now.toISOString().split("T")[0]

    // --- Processamento de Obrigações ---
    allObligations.forEach((obl) => {
      // Adicionando verificação de segurança para clientId
      if (!obl.clientId) {
        console.warn(`Obrigação ${obl.id} ignorada: clientId ausente.`)
        return;
      }

      if (obl.recurrence !== "none" && obl.autoGenerate) {
        const nextDueDate = calculateNextDueDate(obl, now)

        const lastDue = new Date(obl.calculatedDueDate);
        const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        if (lastDue < firstDayOfCurrentMonth) {
            // 1. Cria a nova ocorrência
            const newRecurrence = generateNextRecurrence(obl, nextDueDate) as Obligation;
            newObligations.push(newRecurrence);
            
            // 2. Atualiza a obrigação original para que ela não gere mais a partir dela
            //    (ou a marca como 'arquivada' se estiver concluída)
            if (obl.status === "completed") {
                // Se concluída, remove a recorrência para não gerar mais a partir dela
                const archivedObl: Obligation = { ...obl, recurrence: "none", isArchived: true };
                updatedObligations.push(archivedObl);
            } else {
                // Se não concluída, ela permanece como está (agora overdue)
                updatedObligations.push(obl);
            }
        } else {
            updatedObligations.push(obl);
        }
      } else {
        updatedObligations.push(obl)
      }
    })

    // --- Processamento de Parcelamentos ---
    allInstallments.forEach((inst) => {
      // Adicionando verificação de segurança para clientId
      if (!inst.clientId) {
        console.warn(`Parcelamento ${inst.id} ignorado: clientId ausente.`)
        return;
      }

      if (inst.recurrence !== "none" && inst.autoGenerate) {
        const nextDueDate = calculateNextDueDate(inst, now)
        
        const lastDue = new Date(inst.calculatedDueDate);
        const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        if (lastDue < firstDayOfCurrentMonth) {
          // 1. Cria a nova ocorrência
          const newRecurrence = generateNextRecurrence(inst, nextDueDate) as Installment;
          
          // Verifica se o número da parcela não excedeu o total
          if (newRecurrence.installmentNumber <= newRecurrence.totalInstallments) {
            newInstallments.push(newRecurrence);
          }
          
          // 2. Atualiza o parcelamento original
          // Se o parcelamento original for a última parcela ou se já estiver concluído, arquiva.
          if (inst.installmentNumber >= inst.totalInstallments || inst.status === "completed") {
              const archivedInst: Installment = { ...inst, recurrence: "none", isArchived: true };
              updatedInstallments.push(archivedInst);
          } else {
              // Se não for a última parcela e não estiver concluído, atualiza o número da parcela
              // para que a próxima geração use o número correto.
              const updatedInst: Installment = { ...inst, installmentNumber: inst.installmentNumber + 1 };
              updatedInstallments.push(updatedInst);
          }
        } else {
          updatedInstallments.push(inst);
        }
      } else {
        updatedInstallments.push(inst)
      }
    })

    // --- Processamento de Impostos (Templates) ---
    // Impostos não geram novas entidades, apenas o template base é atualizado.
    allTaxes.forEach((tax) => {
      updatedTaxes.push(tax);
    });

    // --- Salvamento e Log ---
    
    // Filtra os itens que não foram arquivados e adiciona os novos
    const finalObligations = [...updatedObligations.filter(o => !o.isArchived), ...newObligations];
    const finalInstallments = [...updatedInstallments.filter(i => !i.isArchived), ...newInstallments];
    const finalTaxes = updatedTaxes;

    await saveAllObligations(finalObligations);
    await saveAllInstallments(finalInstallments);
    await saveAllTaxes(finalTaxes);

    // Salva o log de execução
    saveRecurrenceLog({
      lastRunMonthYear: currentMonthYear,
      timestamp: now.toISOString(),
      generatedCount: newObligations.length + newInstallments.length,
    })

    console.log(`Geração de recorrência concluída. ${newObligations.length + newInstallments.length} novos eventos gerados.`)
  } catch (error) {
    console.error("Erro durante a execução da recorrência:", error);
    // Re-lança o erro para que o chamador saiba que falhou, mas agora com um log útil.
    throw error;
  }
}