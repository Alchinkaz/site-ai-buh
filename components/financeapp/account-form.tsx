"use client"

import type React from "react"
import { useState } from "react"
import { useFinance } from "@/lib/financeapp/finance-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface AccountFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function AccountForm({ onSuccess, onCancel }: AccountFormProps) {
  const { addAccount, accounts } = useFinance()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    type: "bank" as "bank" | "cash" | "kaspi" | "other",
    balance: "",
    currency: "KZT",
    accountNumber: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.balance) {
      toast.error("Пожалуйста, заполните все обязательные поля")
      return
    }

    setIsSubmitting(true)
    try {
      const newAccountData = {
        name: formData.name,
        type: formData.type,
        balance: Number.parseFloat(formData.balance) || 0,
        currency: formData.currency,
        accountNumber: formData.accountNumber.trim() || undefined,
      }

      addAccount(newAccountData)

      toast.success(`Счёт "${formData.name}" успешно создан`)

      setFormData({ name: "", type: "bank", balance: "", currency: "KZT", accountNumber: "" })
      onSuccess?.()
    } catch (error) {
      toast.error("Не удалось создать счёт. Попробуйте снова.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Название счёта *</Label>
        <Input id="name" placeholder="Например: Kaspi Gold, Наличные, Halyk Bank" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required disabled={isSubmitting} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Тип счёта</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as typeof formData.type })} disabled={isSubmitting}>
            <SelectTrigger id="type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bank">Банковский счёт</SelectItem>
              <SelectItem value="kaspi">Kaspi</SelectItem>
              <SelectItem value="cash">Наличные</SelectItem>
              <SelectItem value="other">Другое</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Валюта</Label>
          <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })} disabled={isSubmitting}>
            <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="KZT">KZT (Тенге)</SelectItem>
              <SelectItem value="USD">USD (Доллар)</SelectItem>
              <SelectItem value="EUR">EUR (Евро)</SelectItem>
              <SelectItem value="RUB">RUB (Рубль)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountNumber">Номер счёта (необязательно)</Label>
        <Input id="accountNumber" placeholder="Например: 4400 1234 5678 9012" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} disabled={isSubmitting} />
        <p className="text-xs text-muted-foreground">Мы покажем только последние цифры для безопасности.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="balance">Начальный баланс *</Label>
        <Input id="balance" type="number" step="0.01" placeholder="0.00" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} required disabled={isSubmitting} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>{isSubmitting ? "Создание..." : "Создать счёт"}</Button>
        {onCancel && (<Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Отмена</Button>)}
      </div>
    </form>
  )
}


