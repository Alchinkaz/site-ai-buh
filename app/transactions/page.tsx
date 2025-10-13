"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2 } from "lucide-react"

type Category = { id: number; name: string; type: "income" | "expense" }
type Transaction = {
  id: number
  type: "income" | "expense"
  amount: number
  currency: string
  category_id: number | null
  description: string | null
  method: string | null
  occurred_at: string
}

export default function TransactionsPage() {
  const [items, setItems] = useState<Transaction[]>([])
  const [count, setCount] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [filterType, setFilterType] = useState<"income" | "expense" | "all">("all")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [form, setForm] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    currency: "KZT",
    category_id: "",
    description: "",
    method: "",
    occurred_at: new Date().toISOString(),
  })
  const [otherCategoryName, setOtherCategoryName] = useState("")
  const [newCategory, setNewCategory] = useState({ name: "", type: "expense" as "income" | "expense" })

  async function loadCategories() {
    const res = await fetch("/api/categories")
    const json = await res.json()
    setCategories(json.data ?? [])
  }

  async function loadTransactions() {
    const params = new URLSearchParams()
    if (filterType !== "all") params.set("type", filterType)
    const res = await fetch(`/api/transactions?${params.toString()}`)
    const json = await res.json()
    setItems(json.data ?? [])
    setCount(json.count ?? 0)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [filterType])

  function resetForm() {
    setForm({
      type: "expense",
      amount: "",
      currency: "KZT",
      category_id: "",
      description: "",
      method: "",
      occurred_at: new Date().toISOString(),
    })
    setEditing(null)
    setOtherCategoryName("")
  }

  async function submitForm() {
    if (isSubmitting) return
    setIsSubmitting(true)
    const payload: any = {
      ...form,
      amount: Number(form.amount),
      category_id: form.category_id ? Number(form.category_id) : null,
    }

    try {
      if (form.category_id === "__other__" && otherCategoryName.trim()) {
        const res = await fetch('/api/categories', { method: 'POST', body: JSON.stringify({ name: otherCategoryName.trim(), type: form.type }) })
        const json = await res.json()
        if (json?.data?.id) {
          payload.category_id = json.data.id
        }
      }
      if (editing) {
        payload.id = editing.id
        await fetch("/api/transactions", { method: "PUT", body: JSON.stringify(payload) })
      } else {
        await fetch("/api/transactions", { method: "POST", body: JSON.stringify(payload) })
      }
      setOpen(false)
      resetForm()
      await loadTransactions()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deleteItem(id: number) {
    await fetch(`/api/transactions?id=${id}`, { method: "DELETE" })
    loadTransactions()
  }

  function startEdit(item: Transaction) {
    setEditing(item)
    setForm({
      type: item.type,
      amount: String(item.amount),
      currency: item.currency,
      category_id: item.category_id ? String(item.category_id) : "",
      description: item.description ?? "",
      method: item.method ?? "",
      occurred_at: item.occurred_at,
    })
    setOpen(true)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Доходы / Расходы</h1>
            <p className="text-muted-foreground mt-2">Управление финансовыми операциями и категориями</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
            <DialogTrigger asChild>
              <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Добавить
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Редактировать операцию" : "Новая операция"}</DialogTitle>
                <DialogDescription>Заполните данные операции</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v, category_id: "" })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Тип" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Доход</SelectItem>
                      <SelectItem value="expense">Расход</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Сумма"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={form.category_id}
                    onValueChange={(v) => setForm({ ...form, category_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Категория" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c) => c.type === form.type)
                        .map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      <SelectItem value="__other__">Остальное...</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={form.method} onValueChange={(v: any) => setForm({ ...form, method: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Метод оплаты" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Наличка">Наличка</SelectItem>
                      <SelectItem value="Безнал">Безнал</SelectItem>
                      <SelectItem value="Каспи пэй">Каспи пэй</SelectItem>
                      <SelectItem value="Банки">Банки</SelectItem>
                      <SelectItem value="Переводы">Переводы</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.category_id === "__other__" && (
                  <Input
                    placeholder="Название новой категории"
                    value={otherCategoryName}
                    onChange={(e) => setOtherCategoryName(e.target.value)}
                  />
                )}
                <Input
                  placeholder="Описание"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => { if (!isSubmitting) { setOpen(false); resetForm() } }} disabled={isSubmitting}>Отмена</Button>
                <Button onClick={submitForm} disabled={isSubmitting}>{isSubmitting ? "Сохраняю..." : (editing ? "Сохранить" : "Добавить")}</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>Настройки категорий</Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Операции ({count})</CardTitle>
            <div className="flex items-center gap-3">
              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Фильтр" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="income">Доходы</SelectItem>
                  <SelectItem value="expense">Расходы</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Метод</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((t) => {
                  const cat = categories.find((c) => c.id === t.category_id)
                  return (
                    <TableRow key={t.id}>
                      <TableCell>{new Date(t.occurred_at).toLocaleString("ru-RU")}</TableCell>
                      <TableCell>{t.type === "income" ? "Доход" : "Расход"}</TableCell>
                      <TableCell>{cat ? cat.name : "-"}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("ru-RU", { style: "currency", currency: t.currency || "KZT" }).format(
                          Number(t.amount)
                        )}
                      </TableCell>
                      <TableCell>{t.method || "-"}</TableCell>
                      <TableCell>{t.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => startEdit(t)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteItem(t.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    {/* Categories settings dialog */}
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Категории</DialogTitle>
          <DialogDescription>Добавьте новую категорию</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Название" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} />
            <Select value={newCategory.type} onValueChange={(v: any) => setNewCategory({ ...newCategory, type: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Доход</SelectItem>
                <SelectItem value="expense">Расход</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={async () => {
                if (!newCategory.name.trim()) return
                await fetch('/api/categories', { method: 'POST', body: JSON.stringify(newCategory) })
                setNewCategory({ name: '', type: 'expense' })
                setSettingsOpen(false)
                loadCategories()
              }}
            >Добавить</Button>
          </div>
        </div>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Тип</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.type === 'income' ? 'Доход' : 'Расход'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
    </DashboardLayout>
  )
}


