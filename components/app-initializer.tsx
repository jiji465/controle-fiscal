"use client"

import { useRecurringGeneration } from "@/hooks/use-recurring-generation"

export function AppInitializer({ children }: { children: React.ReactNode }) {
  useRecurringGeneration()
  return <>{children}</>
}