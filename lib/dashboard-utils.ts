import type { DashboardStats, ObligationWithDetails, TaxDueDate, Tax, Client, Installment, InstallmentWithDetails, FiscalEventStatus, FiscalEventType } from "./types"
import { getClients, getTaxes, getObligations, getInstallments, getTaxStatuses } from "./storage"
import { calculateDueDate, isOverdue, isUpcomingThisWeek, calculateTaxDueDate, calculateInstallmentDueDate } from "./date-utils"

export const getObligationsWithDetails = async (): Promise<ObligationWithDetails[]> => {
  const obligations = await getObligations()
  const clients = await getClients()
  const taxes = await getTaxes(); // Fetch taxes here to link

  const unknownClient: Client = {
    id: "unknown",
    name: "Cliente Desconhecido",
    cnpj: "00.000.000/0000-00",
    email: "",
    phone: "",
    status: "inactive",
    createdAt: new Date().toISOString(),
  };

  return obligations.map((obligation) => {
    const client = clients.find((c) => c.id === obligation.clientId) || unknownClient;
    const tax = obligation.taxId ? taxes.find((t) => t.id === obligation.taxId) : undefined;

    const calculatedDueDate = calculateDueDate(
      obligation.dueDay,
      obligation.dueMonth,
      obligation.frequency,
      obligation.weekendRule,
    ).toISOString();

    return {
      ...obligation,
      client,
      tax,
      calculatedDueDate,
      type: "obligation", // Explicitly add the type from FiscalEventBase
      status: obligation.status, // Ensure status is explicitly set from obligation
    } as ObligationWithDetails;
  })
}

export const getTaxesDueDates = async (monthsAhead: number = 3): Promise<TaxDueDate[]> => {
  const taxes = await getTaxes();
  const clients = await getClients();
  const today = new Date();
  const taxDueDates: TaxDueDate[] = [];
  const taxStatuses = await getTaxStatuses();

  const unknownClient: Client = {
    id: "unknown",
    name: "Cliente Desconhecido",
    cnpj: "00.000.000/0000-00",
    email: "",
    phone: "",
    status: "inactive",
    createdAt: new Date().toISOString(),
  };

  taxes.forEach(tax => {
    // Determine the initial reference date based on the tax's creation date
    const initialReferenceDate = new Date(tax.createdAt);
    
    // Calculate the first due date based on the initial reference date
    let calculatedDueDate = calculateTaxDueDate(tax, initialReferenceDate);
    
    // If the calculated date is in the past, advance it to the current month/period
    while (calculatedDueDate < today) {
        calculatedDueDate.setMonth(calculatedDueDate.getMonth() + (tax.recurrenceInterval || 1));
        calculatedDueDate = calculateTaxDueDate(tax, calculatedDueDate);
    }

    // Generate occurrences for the next 'monthsAhead' periods starting from the calculated date
    for (let i = 0; i < monthsAhead; i++) {
      const referenceDate = new Date(calculatedDueDate.getFullYear(), calculatedDueDate.getMonth() + i, 1);
      let occurrenceDate = calculateTaxDueDate(tax, referenceDate);

      const client = tax.clientId ? clients.find(c => c.id === tax.clientId) || unknownClient : unknownClient;
      
      const uniqueId = `${tax.id}-${occurrenceDate.toISOString().split("T")[0]}`;
      const storedStatus = taxStatuses[uniqueId];
      const isEventOverdue = isOverdue(occurrenceDate.toISOString());
      
      let status: FiscalEventStatus = "pending";
      if (storedStatus) {
        status = storedStatus;
      } else if (isEventOverdue) {
        status = "overdue";
      }

      taxDueDates.push({
        ...tax,
        id: uniqueId,
        client,
        calculatedDueDate: occurrenceDate.toISOString(),
        status,
        type: "tax",
      } as TaxDueDate);
    }
  });

  return taxDueDates
    .filter(item => new Date(item.calculatedDueDate) >= today || isOverdue(item.calculatedDueDate))
    .sort((a, b) => new Date(a.calculatedDueDate).getTime() - new Date(b.calculatedDueDate).getTime());
};

export const getInstallmentsWithDetails = async (): Promise<InstallmentWithDetails[]> => {
  const installments = await getInstallments();
  const clients = await getClients();

  const unknownClient: Client = {
    id: "unknown",
    name: "Cliente Desconhecido",
    cnpj: "00.000.000/0000-00",
    email: "",
    phone: "",
    status: "inactive",
    createdAt: new Date().toISOString(),
  };

  return installments.map((installment) => {
    const client = clients.find((c) => c.id === installment.clientId) || unknownClient;
    
    // Use the installment's creation date as the reference for the first calculation
    const initialReferenceDate = new Date(installment.createdAt);
    const calculatedDueDate = calculateInstallmentDueDate(installment, initialReferenceDate).toISOString();

    return {
      ...installment,
      client,
      calculatedDueDate,
      type: "installment", // Explicitly add the type from FiscalEventBase
      status: installment.status, // Ensure status is explicitly set from installment
    } as InstallmentWithDetails;
  });
};


export const calculateDashboardStats = async (): Promise<DashboardStats> => {
  const clients = await getClients()
  const obligations = await getObligationsWithDetails()
  const installments = await getInstallmentsWithDetails();
  const taxesDueDates = await getTaxesDueDates(1); // Only current month for stats

  const activeClients = clients.filter((c) => c.status === "active").length

  const pendingObligations = obligations.filter((o) => o.status === "pending" && !isOverdue(o.calculatedDueDate))
  const overdueObligations = obligations.filter(o => o.status === 'overdue' || (o.status === 'pending' && isOverdue(o.calculatedDueDate)))
  const upcomingObligationsThisWeek = obligations.filter((o) => isUpcomingThisWeek(o.calculatedDueDate) && o.status !== 'completed')

  const pendingInstallments = installments.filter(i => i.status === "pending" && !isOverdue(i.calculatedDueDate));
  const overdueInstallments = installments.filter(i => i.status === 'overdue' || (i.status === 'pending' && isOverdue(i.calculatedDueDate)));
  const upcomingInstallmentsThisWeek = installments.filter(i => isUpcomingThisWeek(i.calculatedDueDate) && i.status !== 'completed');

  const pendingTaxes = taxesDueDates.filter(t => !isOverdue(t.calculatedDueDate));
  const overdueTaxes = taxesDueDates.filter(t => isOverdue(t.calculatedDueDate));
  const upcomingTaxesThisWeek = taxesDueDates.filter(t => isUpcomingThisWeek(t.calculatedDueDate) && !isOverdue(t.calculatedDueDate));

  const today = new Date()
  const completedObligationsThisMonth = obligations.filter((o) => {
    if (!o.completedAt) return false
    const completed = new Date(o.completedAt)
    return (
      completed.getMonth() === today.getMonth() &&
      completed.getFullYear() === today.getFullYear() &&
      o.status === "completed"
    )
  }).length
  const completedInstallmentsThisMonth = installments.filter((i) => {
    if (!i.completedAt) return false
    const completed = new Date(i.completedAt)
    return (
      completed.getMonth() === today.getMonth() &&
      completed.getFullYear() === today.getFullYear() &&
      i.status === "completed"
    )
  }).length

  return {
    totalClients: clients.length,
    activeClients,
    totalEvents: obligations.length + installments.length + taxesDueDates.length,
    pendingEvents: pendingObligations.length + pendingInstallments.length + pendingTaxes.length,
    completedThisMonth: completedObligationsThisMonth + completedInstallmentsThisMonth,
    overdueEvents: overdueObligations.length + overdueInstallments.length + overdueTaxes.length,
    upcomingThisWeek: upcomingObligationsThisWeek.length + upcomingInstallmentsThisWeek.length + upcomingTaxesThisWeek.length,
  }
}