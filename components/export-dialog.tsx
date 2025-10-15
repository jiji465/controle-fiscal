import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Download, FileSpreadsheet, FileText, File } from "lucide-react"
import type { ExportFormat, ObligationWithDetails, Client } from "@/lib/types"
import { toast } from "@/hooks/use-toast"

interface ExportDialogProps {
  obligations: ObligationWithDetails[]
  clients: Client[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportDialog({ obligations, clients, open, onOpenChange }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("csv")
  const [loading, setLoading] = useState(false)

  const handleExport = () => {
    setLoading(true)
    // Simulação de exportação
    setTimeout(() => {
      toast({
        title: "Exportação Concluída",
        description: `Dados exportados com sucesso no formato ${format.toUpperCase()}.`,
        variant: "success",
      })
      setLoading(false)
      onOpenChange(false)
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="size-5" /> Exportar Dados
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="format">Formato de Exportação</Label>
            <Select value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
              <SelectTrigger id="format">
                <SelectValue placeholder="Selecione o formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2"><FileSpreadsheet className="size-4" /> CSV (Planilha)</div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2"><FileText className="size-4" /> JSON (Dados Brutos)</div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2"><File className="size-4" /> PDF (Relatório)</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            Serão exportadas todas as obrigações e parcelamentos ativos.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? "Exportando..." : "Exportar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}