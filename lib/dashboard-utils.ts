import type { DashboardStats, ObligationWithDetails, TaxDueDate, Tax, Client, Installment, InstallmentWithDetails, FiscalEventStatus, FiscalEventType } from "./types"
import { getClients, getTaxes, getObligations, getInstallments } from "./storage"
import { calculateDueDate, isOverdue, isUpcomingThisWeek, calculateTaxDueDate, calculateInstallmentDueDate } from "./date-utils"

export const getObligationsWithDetails = (): ObligationWithDetails[] => {
  const obligations = getObligations()
  const clients = getClients()

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
    const taxes = getTaxes(); // Fetch taxes here to link
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

export const getTaxesDueDates = (monthsAhead: number = 3): TaxDueDate[] => {
  const taxes = getTaxes();
  const clients = getClients();
  const today = new Date();
  const taxDueDates: TaxDueDate[] = [];

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
    for (let i = 0; i < monthsAhead; i++) {
      const referenceDate = new Date(today.getFullYear(), today.getMonth() + i, 1); // Start of current/future month
      let calculatedDueDate = calculateTaxDueDate(tax, referenceDate);

      // Ensure we don't generate past dates for the current month
      if (i === 0 && calculatedDueDate < today && calculatedDueDate.getDate() !== today.getDate()) {
        calculatedDueDate = calculateTaxDueDate(tax, new Date(today.getFullYear(), today.getMonth() + 1, 1));
      }

      const client = tax.clientId ? clients.find(c => c.id === tax.clientId) || unknownClient : unknownClient;
      const status: FiscalEventStatus = isOverdue(calculatedDueDate.toISOString()) ? "overdue" : "pending";

      taxDueDates.push({
        ...tax,
        client,
        calculatedDueDate: calculatedDueDate.toISOString(),
        status, // Explicitly add the derived status
        type: "tax", // Explicitly add the type from FiscalEventBase
        // Taxes don't have amount, completedAt, completedBy, paidAt, paidBy in this context
      } as TaxDueDate);
    }
  });

  // Filter out duplicates and past dates
  const uniqueTaxDueDates = Array.from(new Map(taxDueDates.map(item => [item.id, item])).values())
    .filter(item => new Date(item.calculatedDueDate) >= today || isOverdue(item.calculatedDueDate)) // Keep current/future or overdue
    .sort((a, b) => new Date(a.calculatedDueDate).getTime() - new Date(b.calculatedDueDate).getTime());

  return uniqueTaxDueDates;
};

export const getInstallmentsWithDetails = (): InstallmentWithDetails[] => {
  const installments = getInstallments();
  const clients = getClients();

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
    const calculatedDueDate = calculateInstallmentDueDate(installment).toISOString();

    return {
      ...installment,
      client,
      calculatedDueDate,
      type: "installment", // Explicitly add the type from FiscalEventBase
      status: installment.status, // Ensure status is explicitly set from installment
    } as InstallmentWithDetails;
  });
};


export const calculateDashboardStats = (): DashboardStats => {
  const clients = getClients()
  const obligations = getObligationsWithDetails()
  const installments = getInstallmentsWithDetails();
  const taxesDueDates = getTaxesDueDates(1); // Only current month for stats

  const activeClients = clients.filter((c) => c.status === "active").length

  const pendingObligations = obligations.filter((o) => o.status === "pending" && !isOverdue(o.calculatedDueDate))
  const overdueObligations = obligations.filter(o => o.status === 'overdue' || (o.status === 'pending' && isOverdue(o.calculatedDueDate)))
  const upcomingObligationsThisWeek = obligations.filter((o) => isUpcomingThisWeek(o.calculatedDueDate) && o.status !== 'completed')

  const pendingInstallments = installments.filter(i => i.status === "pending" && !isOverdue(i.calculatedDueDate));
  const overdueInstallments = installments.filter(i => i.status === 'overdue' || (i.status === 'pending' && isOverdue(i.calculatedDueDate)));
  const upcomingInstallmentsThisWeek = installments.filter(i => isUpcomingThisWeek(i.calculatedDueDate) && i.status !== 'paid');

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
  const paidInstallmentsThisMonth = installments.filter((i) => {
    if (!i.paidAt) return false
    const paid = new Date(i.paidAt)
    return (
      paid.getMonth() === today.getMonth() &&
      paid.getFullYear() === today.getFullYear() &&
      i.status === "paid"
    )
  }).length

  return {
    totalClients: clients.length,
    activeClients,
    totalEvents: obligations.length + installments.length + taxesDueDates.length,
    pendingEvents: pendingObligations.length + pendingInstallments.length + pendingTaxes.length,
    completedThisMonth: completedObligationsThisMonth + paidInstallmentsThisMonth,
    overdueEvents: overdueObligations.length + overdueInstallments.length + overdueTaxes.length,
    upcomingThisWeek: upcomingObligationsThisWeek.length + upcomingInstallmentsThisWeek.length + upcomingTaxesThisWeek.length,
  }
}