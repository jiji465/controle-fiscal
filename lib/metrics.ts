import type { ObligationWithDetails, ProductivityMetrics, Priority } from "./types"

export function calculateProductivityMetrics(obligations: ObligationWithDetails[]): ProductivityMetrics {
  const completed = obligations.filter((o) => o.status === "completed")

  // Calculate average completion time
  const completionTimes = completed
    .filter((o) => o.completedAt && o.createdAt)
    .map((o) => {
      const created = new Date(o.createdAt).getTime()
      const completedDate = new Date(o.completedAt!).getTime()
      return (completedDate - created) / (1000 * 60 * 60 * 24) // days
    })

  const averageCompletionTime =
    completionTimes.length > 0 ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length : 0

  // Calculate on-time rate
  const completedOnTime = completed.filter((o) => {
    if (!o.completedAt) return false
    const completedDate = new Date(o.completedAt)
    const dueDate = new Date(o.calculatedDueDate)
    return completedDate <= dueDate
  }).length

  const onTimeRate = completed.length > 0 ? (completedOnTime / completed.length) * 100 : 0

  // Group by responsible
  const byResponsible = Object.entries(
    obligations.reduce( // Changed to use all obligations, not just completed
      (acc, o) => {
        const name = o.assignedTo || "Não atribuído"
        if (!acc[name]) acc[name] = { completed: 0, onTime: 0 }
        if (o.status === "completed") { // Only count completed for these stats
          acc[name].completed++
          if (o.completedAt && new Date(o.completedAt) <= new Date(o.calculatedDueDate)) {
            acc[name].onTime++
          }
        }
        return acc
      },
      {} as Record<string, { completed: number; onTime: number }>,
    ),
  ).map(([name, data]) => ({ name, ...data }))

  // Group by month
  const byMonth = Object.entries(
    obligations.reduce(
      (acc, o) => {
        const monthKey = new Date(o.calculatedDueDate).toLocaleDateString("pt-BR", { year: "numeric", month: "short" })
        if (!acc[monthKey]) acc[monthKey] = { completed: 0, overdue: 0 }
        if (o.status === "completed") acc[monthKey].completed++
        if (o.status === "overdue") acc[monthKey].overdue++
        return acc
      },
      {} as Record<string, { completed: number; overdue: number }>,
    ),
  ).map(([month, data]) => ({ month, ...data }))

  // Group by priority
  const byPriority: { priority: Priority; count: number }[] = ["urgent", "high", "medium", "low"].map((priority) => ({
    priority: priority as Priority,
    count: obligations.filter((o) => o.priority === priority).length,
  }))

  // New: Obligations by Status for charts
  const obligationsByStatus = Object.entries(
    obligations.reduce(
      (acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    )
  ).map(([status, count]) => ({ status, count }));

  // New: Obligations by Client for charts
  const obligationsByClient = Object.entries(
    obligations.reduce(
      (acc, o) => {
        const clientName = o.client.name;
        acc[clientName] = (acc[clientName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    )
  ).map(([clientName, count]) => ({ clientName, count }));


  return {
    totalCompleted: completed.length,
    averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
    onTimeRate: Math.round(onTimeRate * 10) / 10,
    byResponsible,
    byMonth: byMonth.slice(-6), // Last 6 months
    byPriority,
    obligationsByStatus, // Added for charts
    obligationsByClient, // Added for charts
  }
}