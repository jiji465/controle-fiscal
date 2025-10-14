"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, CheckCircle2, PlayCircle, AlertTriangle, FileText, DollarSign } from "lucide-react"
import type { ObligationWithDetails, InstallmentWithDetails } from "@/lib/types"
import { saveObligation, saveInstallment } from "@/lib/storage"
import { isOverdue } from "@/lib/date-utils"

type QuickActionsProps = {
  obligations: ObligationWithDetails[]
  installments: InstallmentWithDetails[] // New prop for installments
  onUpdate: () => void
}

export function QuickActions({ obligations, installments, onUpdate }: QuickActionsProps) {
  const pendingObligations = obligations.filter((o) => o.status === "pending")
  const inProgressObligations = obligations.filter((o) => o.status === "in_progress")
  const overdueObligations = obligations.filter(
    (o) => isOverdue(o.calculatedDueDate) && o.status !== "completed",
  )

  const pendingInstallments = installments.filter((i) => i.status === "pending")
  const overdueInstallments = installments.filter(
    (i) => isOverdue(i.calculatedDueDate) && i.status !== "paid",
  )

  const handleBulkCompleteObligations = (obligationList: ObligationWithDetails[]) => {
    if (confirm(`Tem certeza que deseja marcar ${obligationList.length} obrigação(ões) como concluída(s)?`)) {
      obligationList.forEach((obligation) => {
        const updated = {
          ...obligation,
          status: "completed" as const,
          completedAt: new Date().toISOString(),
          realizationDate: new Date().toISOString().split("T")[0],
          history: [
            ...(obligation.history || []),
            {
              id: crypto.randomUUID(),
              action: "completed" as const,
              description: "Obrigação marcada como concluída (ação em lote)",
              timestamp: new Date().toISOString(),
            },
          ],
        }
        saveObligation(updated)
      })
      onUpdate()
    }
  }

  const handleBulkStartObligations = (obligationList: ObligationWithDetails[]) => {
    if (confirm(`Tem certeza que deseja iniciar ${obligationList.length} obrigação(ões)?`)) {
      obligationList.forEach((obligation) => {
        const updated = {
          ...obligation,
          status: "in_progress" as const,
          history: [
            ...(obligation.history || []),
            {
              id: crypto.randomUUID(),
              action: "status_changed" as const,
              description: "Status alterado para Em Andamento (ação em lote)",
              timestamp: new Date().toISOString(),
            },
          ],
        }
        saveObligation(updated)
      })
      onUpdate()
    }
  }

  const handleBulkPayInstallments = (installmentList: InstallmentWithDetails[]) => {
    if (confirm(`Tem certeza que deseja marcar ${installmentList.length} parcelamento(s) como pago(s)?`)) {
      installmentList.forEach((installment) => {
        const updated = {
          ...installment,
          status: "paid" as const,
          paidAt: new Date().toISOString(),
          paidBy: "Usuário (ação em lote)",
        }
        saveInstallment(updated)
      })
      onUpdate()
    }
  }

  const quickActions = [
    {
      title: "Concluir Obrigações Pendentes",
      description: `${pendingObligations.length} obrigações pendentes`,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      action: () => handleBulkCompleteObligations(pendingObligations),
      disabled: pendingObligations.length === 0,
    },
    {
      title: "Iniciar Obrigações Pendentes",
      description: `${pendingObligations.length} obrigações para iniciar`,
      icon: PlayCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      action: () => handleBulkStartObligations(pendingObligations),
      disabled: pendingObligations.length === 0,
    },
    {
      title: "Concluir Obrigações Em Andamento",
      description: `${inProgressObligations.length} obrigações em andamento`,
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      action: () => handleBulkCompleteObligations(inProgressObligations),
      disabled: inProgressObligations.length === 0,
    },
    {
      title: "Pagar Parcelamentos Pendentes",
      description: `${pendingInstallments.length} parcelamentos pendentes`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      action: () => handleBulkPayInstallments(pendingInstallments),
      disabled: pendingInstallments.length === 0,
    },
    {
      title: "Resolver Obrigações Atrasadas",
      description: `${overdueObligations.length} obrigações atrasadas`,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      action: () => handleBulkCompleteObligations(overdueObligations),
      disabled: overdueObligations.length === 0,
    },
    {
      title: "Resolver Parcelamentos Atrasados",
      description: `${overdueInstallments.length} parcelamentos atrasados`,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      action: () => handleBulkPayInstallments(overdueInstallments),
      disabled: overdueInstallments.length === 0,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="size-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={index}
                variant="outline"
                className={`h-auto p-4 justify-start ${action.bgColor} border-2 hover-lift`}
                onClick={action.action}
                disabled={action.disabled}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={`p-2 rounded-lg bg-background/50`}>
                    <Icon className={`size-5 ${action.color}`} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm mb-0.5">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}