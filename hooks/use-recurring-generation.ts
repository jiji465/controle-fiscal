"use client"

import { useEffect } from "react"
import {
  getObligations,
  getTaxes,
  getInstallments,
  saveObligation,
  saveInstallment,
  getLastGenerationRun,
  setLastGenerationRun,
} from "@/lib/storage"
import { generateOccurrenceForMonth } from "@/lib/recurrence-utils"
import { addNotification } from "@/lib/storage"

export function useRecurringGeneration() {
  useEffect(() => {
    const runGeneration = () => {
      console.log("Verificando necessidade de gerar recorrências...")
      const lastRun = getLastGenerationRun()
      const now = new Date()

      if (lastRun) {
        const lastRunDate = new Date(lastRun)
        if (
          lastRunDate.getMonth() === now.getMonth() &&
          lastRunDate.getFullYear() === now.getFullYear()
        ) {
          console.log("Geração de recorrências já executada para este mês.")
          return // Already run this month
        }
      }

      console.log("Iniciando geração de recorrências...")
      let generatedCount = 0

      const allObligations = getObligations()
      const allInstallments = getInstallments()

      // Generate Obligations
      const obligationTemplates = allObligations.filter(
        (o) => o.autoGenerate && !o.parentObligationId,
      )
      obligationTemplates.forEach((template) => {
        const occurrence = generateOccurrenceForMonth(template, now, allObligations)
        if (occurrence) {
          saveObligation(occurrence)
          generatedCount++
        }
      })

      // Generate Installments
      const installmentTemplates = allInstallments.filter(
        (i) => i.autoGenerate && !i.parentInstallmentId,
      )
      installmentTemplates.forEach((template) => {
        const occurrence = generateOccurrenceForMonth(template, now, allInstallments)
        if (occurrence) {
          saveInstallment(occurrence as any) // Type assertion might be needed depending on return type
          generatedCount++
        }
      })
      
      setLastGenerationRun(now.toISOString())
      console.log(`${generatedCount} novas tarefas recorrentes geradas.`)
      if (generatedCount > 0) {
        addNotification(`${generatedCount} novas tarefas recorrentes foram geradas para este mês.`, "success")
      }
    }

    runGeneration()
  }, [])
}