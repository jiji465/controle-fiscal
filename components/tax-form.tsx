"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Tax, Client } from "@/lib/types"
import { toast } from "@/hooks/use-toast"
import { createTax } from "@/lib/factory"

type TaxFormProps = {
  tax?: Tax
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (tax: Tax) => void
  clients: Client[]
}

export function TaxForm({ tax, open, onOpenChange, onSave, clients }: TaxFormProps) {
  const [formData, setFormData] = useState<Partial<Tax>>(createTax())
  const [newTag, setNewTag] = useState("")
  const [initialDueDate, setInitialDueDate] = useState("");

  useEffect(() => {
    if (tax) {
      setFormData(tax);
      if (tax.dueDay) {
        const year = new Date().getFullYear();
        const month = tax.dueMonth ? tax.dueMonth - 1 : new Date().getMonth();
        const day = tax.dueDay;
        const date = new Date(year, month, day);
        setInitialDueDate(date.toISOString().split('T')[0]);
      } else {
        setInitialDueDate("");
      }
    } else {
      setFormData(createTax());
      setInitialDueDate("");
    }
  }, [tax, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const taxData: Tax = {
      ...createTax(),
      ...formData,
      id: tax?.id || crypto.randomUUID(),
      createdAt: tax?.createdAt || new Date().toISOString(),
    }
    onSave(taxData)
    onOpenChange(false)
    toast({
      title: "Imposto salvo!",
      description: `O imposto "${taxData.name}" foi salvo com sucesso.`,
    });
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...(formData.tags || []), newTag.trim()] })
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter((t) => t !== tag) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tax ? "Editar Imposto" : "Novo Imposto"}</DialogTitle>
          <DialogDescription>Configure o imposto com todas as regras e vencimentos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Informações Básicas
              </h3>

              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Imposto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: ICMS, ISS, IRPJ"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o imposto..."
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="federalTaxCode">Código Federal (Opcional)</Label>
                <Input
                  id="federalTaxCode"
                  value={formData.federalTaxCode}
                  onChange={(e) => setFormData({ ...formData, federalTaxCode: e.target.value })}
                  placeholder="Ex: 1234"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="clientId">Cliente (Opcional)</Label>
                <Select
                  value={formData.clientId || "none"}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                >
                  <SelectTrigger id="clientId">
                    <SelectValue placeholder="Imposto global (sem cliente específico)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Imposto global (sem cliente específico)</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecione um cliente para tornar este imposto específico para ele.
                </p>
              </div>
            </div>

            {/* Configuração de Recorrência */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <h3 className="text-sm font-semibold">Configuração de Recorrência</h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="recurrence">Tipo de Recorrência *</Label>
                  <Select
                    value={formData.recurrence}
                    onValueChange={(value) => {
                      const newRecurrence = value as any;
                      let dueMonth = formData.dueMonth;
                      if (initialDueDate) {
                          const [, month] = initialDueDate.split('-').map(Number);
                          dueMonth = newRecurrence === 'annual' ? month : undefined;
                      }
                      setFormData({ 
                          ...formData, 
                          recurrence: newRecurrence,
                          dueMonth: dueMonth
                      });
                    }}
                  >
                    <SelectTrigger id="recurrence">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="bimonthly">Bimestral</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="semiannual">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.recurrence === "custom" && (
                  <div className="grid gap-2">
                    <Label htmlFor="recurrenceInterval">Intervalo (meses)</Label>
                    <Input
                      id="recurrenceInterval"
                      type="number"
                      min="1"
                      value={formData.recurrenceInterval || 1}
                      onChange={(e) => setFormData({ ...formData, recurrenceInterval: Number(e.target.value) })}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoGenerate">Gerar Automaticamente</Label>
                  <p className="text-xs text-muted-foreground">Criar próximas ocorrências automaticamente</p>
                </div>
                <Switch
                  id="autoGenerate"
                  checked={formData.autoGenerate}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoGenerate: checked })}
                />
              </div>

              {formData.autoGenerate && (
                <div className="grid gap-2">
                  <Label htmlFor="recurrenceEndDate">Data Final (Opcional)</Label>
                  <Input
                    id="recurrenceEndDate"
                    type="date"
                    value={formData.recurrenceEndDate || ""}
                    onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Deixe em branco para recorrência indefinida</p>
                </div>
              )}
            </div>

            {/* Vencimentos */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vencimentos</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Data de Vencimento Inicial *</Label>
                  <Input
                      type="date"
                      value={initialDueDate}
                      onChange={(e) => {
                          const newDateValue = e.target.value;
                          setInitialDueDate(newDateValue);
                          if (newDateValue) {
                              const [year, month, day] = newDateValue.split('-').map(Number);
                              setFormData({
                                  ...formData,
                                  dueDay: day,
                                  dueMonth: formData.recurrence === 'annual' ? month : undefined,
                              });
                          }
                      }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Selecione a data para o primeiro vencimento. A recorrência definirá os próximos.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="weekendRule">Regra de Final de Semana *</Label>
                  <Select
                    value={formData.weekendRule}
                    onValueChange={(value) => setFormData({ ...formData, weekendRule: value as any })}
                  >
                    <SelectTrigger id="weekendRule">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postpone">Postergar</SelectItem>
                      <SelectItem value="anticipate">Antecipar</SelectItem>
                      <SelectItem value="keep">Manter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Informações Adicionais
              </h3>

              <div className="grid gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações adicionais, comentários internos..."
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    placeholder="Adicionar tag..."
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Adicionar
                  </Button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Imposto</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}