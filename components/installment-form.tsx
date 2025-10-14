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
import type { Installment, Client } from "@/lib/types"
import { toast } from "@/hooks/use-toast"
import { createInstallment } from "@/lib/factory"

type InstallmentFormProps = {
  installment?: Installment
  clients: Client[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (installment: Installment) => void
}

export function InstallmentForm({ installment, clients, open, onOpenChange, onSave }: InstallmentFormProps) {
  const [formData, setFormData] = useState<Partial<Installment>>(createInstallment())
  const [newTag, setNewTag] = useState("")
  const [initialDueDate, setInitialDueDate] = useState("");

  useEffect(() => {
    if (installment) {
      setFormData(installment);
      if (installment.dueDay) {
        const year = new Date().getFullYear();
        const month = installment.dueMonth ? installment.dueMonth - 1 : new Date().getMonth();
        const day = installment.dueDay;
        const date = new Date(year, month, day);
        setInitialDueDate(date.toISOString().split('T')[0]);
      } else {
        setInitialDueDate("");
      }
    } else {
      setFormData(createInstallment());
      setInitialDueDate("");
    }
  }, [installment, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const installmentData: Installment = {
      ...createInstallment(),
      ...formData,
      id: installment?.id || crypto.randomUUID(),
      createdAt: installment?.createdAt || new Date().toISOString(),
    }
    onSave(installmentData)
    onOpenChange(false)
    toast({
      title: "Parcelamento salvo!",
      description: `O parcelamento "${installmentData.name}" foi salvo com sucesso.`,
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
          <DialogTitle>{installment ? "Editar Parcelamento" : "Novo Parcelamento"}</DialogTitle>
          <DialogDescription>Configure os detalhes do parcelamento fiscal.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Informações Básicas
              </h3>

              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Parcelamento *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Parcelamento ICMS, Refis"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o parcelamento..."
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="clientId">Cliente *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  required
                >
                  <SelectTrigger id="clientId">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Valores e Parcelas */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Controle de Parcelas
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="installmentNumber">Número da Parcela *</Label>
                  <Input
                    id="installmentNumber"
                    type="number"
                    min="1"
                    value={formData.installmentNumber || ""}
                    onChange={(e) => setFormData({ ...formData, installmentNumber: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="totalInstallments">Total de Parcelas *</Label>
                  <Input
                    id="totalInstallments"
                    type="number"
                    min="1"
                    value={formData.totalInstallments || ""}
                    onChange={(e) => setFormData({ ...formData, totalInstallments: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Gestão e Controle */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Gestão e Controle</h3>
              <div className="grid gap-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="overdue">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
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

            {/* Vencimentos e Status */}
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
                    Selecione a data para o primeiro vencimento.
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
                  value={formData.notes || ""}
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
            <Button type="submit">Salvar Parcelamento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}