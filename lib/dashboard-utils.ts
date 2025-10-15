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
} from "./types"
import { isOverdue } from "./date-utils"
import { calculateNextDueDate, generateNextRecurrence } from "./recurrence-utils"
import { v4 as uuidv4 } from "uuid"

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

  const totalObligations = obligations.length
  const totalInstallments = installments.length
  const totalClients = (await getClients()).length

  const completedObligations = obligations.filter((o) => o.status === "completed").length
  const completedInstallments = installments.filter((i) => i.status === "completed").length

  const overdueObligations = obligations.filter(
    (o) => o.status !== "completed" && isOverdue(o.calculatedDueDate),
  ).length
  const overdueInstallments = installments.filter(
    (i) => i.status !== "completed" && isOverdue(i.calculatedDueDate),
  ).length

  const completionRate =
    totalObligations + totalInstallments > 0
      ? Math.round(((completedObligations + completedInstallments) / (totalObligations + totalInstallments)) * 100)
      : 0

  return {
    totalClients,
    totalObligations: totalObligations + totalInstallments,
    completed: completedObligations + completedInstallments,
    overdue: overdueObligations + overdueInstallments,
    completionRate,
  }
}

// --- Lógica de Recorrência e Arquivamento (Nova) ---

/**
 * Verifica se a geração de recorrência para o mês atual já foi executada.
 * Se não, gera novas ocorrências e arquiva as antigas.
 */
export async function runRecurrenceCheckAndGeneration() {
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
    if (obl.recurrence !== "none") {
      const nextDueDate = calculateNextDueDate(obl, now)

      // Se a próxima data de vencimento for para o mês atual ou anterior (e ainda não foi gerada)
      if (nextDueDate <= todayStr) {
        const newObligation = generateNextRecurrence(obl, nextDueDate) as Obligation
        newObligations.push(newObligation)

        // Atualiza a obrigação original para apontar para a nova data de vencimento
        // e marca a antiga como 'arquivada' se estiver concluída.
        const updatedObl = { ...obl }
        updatedObl.calculatedDueDate = nextDueDate // Atualiza a data de vencimento da base para a próxima
        
        // Lógica de Arquivamento:
        // Se a obrigação original (do mês anterior) foi concluída, ela é mantida no histórico.
        // Se não foi concluída, ela é mantida como está (overdue ou pending) e a nova é gerada.
        // Para fins de organização, vamos manter apenas a última ocorrência recorrente ativa.
        // A nova ocorrência gerada é a que deve ser trabalhada.
        
        // Para evitar duplicação, vamos apenas gerar a nova e manter a antiga no array
        // se ela ainda não foi concluída. Se foi concluída, ela não precisa ser atualizada.
        
        // A abordagem mais simples para o frontend é:
        // 1. Gerar a nova ocorrência.
        // 2. Manter a antiga no array, mas não a atualizar.
        // 3. A lista de exibição deve filtrar/organizar para mostrar apenas as relevantes.
        
        // Para simular o "arquivamento" e manter a lista limpa, vamos *remover* as obrigações
        // concluídas do mês anterior e *manter* as não concluídas (que se tornarão atrasadas).
        
        // Se a obrigação original (do mês anterior) foi concluída, ela é removida do array principal
        // para simular o arquivamento. Se não foi concluída, ela permanece (e se torna overdue).
        if (obl.status !== "completed") {
            updatedObligations.push(obl); // Mantém a antiga (agora atrasada)
        }
        
        // A nova obrigação gerada é a que deve ser trabalhada no futuro.
        // Para simplificar, vamos apenas gerar a nova e deixar a lógica de filtro
        // nas listas para lidar com as antigas.
        
        // Para o modelo atual, onde cada item é uma "série" recorrente, a lógica é mais complexa.
        // Vamos adotar a abordagem de "Ocorrências":
        
        // Se a obrigação original (obl) tem uma data de vencimento no passado (mês anterior)
        // e não foi concluída, ela deve ser mantida como 'overdue'.
        // Se ela foi concluída, ela é mantida como 'completed'.
        
        // O que precisamos é de uma nova OBRIGAÇÃO para o mês atual.
        
        // Se a data de vencimento da obrigação original (obl.calculatedDueDate) for anterior ao mês atual,
        // e ela for recorrente, criamos uma nova.
        
        const lastDueDate = new Date(obl.calculatedDueDate);
        const lastDueMonthYear = `${lastDueDate.getFullYear()}-${lastDueDate.getMonth() + 1}`;
        
        if (lastDueMonthYear !== currentMonthYear && lastDueDate < now) {
            // Cria uma nova ocorrência para o mês atual
            const newRecurrence = generateNextRecurrence(obl, nextDueDate) as Obligation;
            newRecurrences.push(newRecurrence);
            
            // A obrigação original (obl) é mantida no array, mas não é atualizada aqui.
            // A lista de obrigações deve ser uma lista de OCORRÊNCIAS.
            // Como o modelo atual trata cada Obligation como uma série, vamos mudar a abordagem:
            
            // 1. Se a data de vencimento da obrigação original for anterior ao mês atual,
            //    e ela for recorrente, criamos uma nova OBRIGAÇÃO (com novo ID) para o mês atual.
            // 2. A obrigação original (do mês anterior) é mantida no array, mas não é mais recorrente.
            
            // Para simplificar, vamos apenas gerar a nova e manter a antiga no array.
            // O sistema de listagem deve filtrar as obrigações que já passaram do mês.
            
            // Vamos reverter para a lógica mais simples:
            // Se a data de vencimento da obrigação original for anterior ao mês atual,
            // e ela for recorrente, criamos uma nova OBRIGAÇÃO (com novo ID) para o mês atual.
            
            const lastDue = new Date(obl.calculatedDueDate);
            const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            
            if (lastDue < firstDayOfCurrentMonth) {
                // 1. Cria a nova ocorrência
                const newRecurrence = generateNextRecurrence(obl, nextDueDate) as Obligation;
                newObligations.push(newRecurrence);
                
                // 2. Atualiza a obrigação original para que ela não gere mais recorrência
                //    (ou a marca como 'arquivada' se estiver concluída)
                if (obl.status === "completed") {
                    // Se concluída, remove a recorrência para não gerar mais a partir dela
                    const archivedObl = { ...obl, recurrence: "none" as const, isArchived: true };
                    updatedObligations.push(archivedObl);
                } else {
                    // Se não concluída, ela permanece como está (agora overdue)
                    updatedObligations.push(obl);
                }
            } else {
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
    if (inst.recurrence !== "none") {
      const nextDueDate = calculateNextDueDate(inst, now)
      
      const lastDue = new Date(inst.calculatedDueDate);
      const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      if (lastDue < firstDayOfCurrentMonth) {
        // 1. Cria a nova ocorrência
        const newRecurrence = generateNextRecurrence(inst, nextDueDate) as Installment;
        newInstallments.push(newRecurrence);
        
        // 2. Atualiza o parcelamento original
        if (inst.status === "completed") {
            // Se concluído, remove a recorrência e marca como arquivado
            const archivedInst = { ...inst, recurrence: "none" as const, isArchived: true };
            updatedInstallments.push(archivedInst);
        } else {
            // Se não concluído, permanece como está (agora overdue)
            updatedInstallments.push(inst);
        }
      } else {
        updatedInstallments.push(inst);
      }
    } else {
      updatedInstallments.push(inst)
    }
  })

  // --- Processamento de Impostos (Templates) ---
  // Impostos são gerados dinamicamente em getTaxesDueDates, mas precisamos garantir
  // que o template base (Tax) não seja alterado, a menos que seja para arquivar.
  allTaxes.forEach((tax) => {
    // Impostos não precisam de geração de novas entidades, apenas o template base.
    // A lógica de getTaxesDueDates já gera as datas futuras.
    // Apenas garantimos que o template não seja arquivado.
    updatedTaxes.push(tax);
  });

  // --- Salvamento e Log ---
  
  // Combina as obrigações antigas (atualizadas) com as novas ocorrências
  const finalObligations = [...updatedObligations.filter(o => !o.isArchived), ...newObligations];
  const finalInstallments = [...updatedInstallments.filter(i => !i.isArchived), ...newInstallments];
  const finalTaxes = updatedTaxes; // Impostos não geram novas entidades, apenas datas

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
}