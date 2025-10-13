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
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [month, setMonth] = useState<string>("")
  const [q, setQ] = useState("")
  const [sortBy, setSortBy] = useState<string>("occurred_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState<number>(0)
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
    if (dateFrom) params.set("from", new Date(dateFrom).toISOString())
    if (dateTo) params.set("to", new Date(dateTo).toISOString())
    if (month) {
      const first = new Date(month + "-01T00:00:00")
      const last = new Date(first)
      last.setMonth(first.getMonth() + 1)
      last.setDate(0)
      params.set("from", first.toISOString())
      params.set("to", new Date(first.getFullYear(), first.getMonth() + 1, 0, 23, 59, 59).toISOString())
    }
    if (q.trim()) params.set("q", q.trim())
    params.set("sortBy", sortBy)
    params.set("sortDir", sortDir)
    params.set("limit", String(pageSize))
    params.set("offset", String(page * pageSize))
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
  }, [filterType, dateFrom, dateTo, month, q, sortBy, sortDir, pageSize, page])

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

  function toggleSortFactory(currentSortBy: string, currentSortDir: "asc" | "desc", setSortByFn: any, setSortDirFn: any, setPageFn: any) {
    return (column: string) => {
      if (currentSortBy === column) {
        setSortDirFn(currentSortDir === 'asc' ? 'desc' : 'asc')
      } else {
        setSortByFn(column)
        setSortDirFn('asc')
      }
      setPageFn(0)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Доходы / Расходы</h1>
            <p className="text-muted-foreground mt-2">Управление финансовыми операциями и категориями</p>
          </div>
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>Настройки категорий</Button>
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
                <Input
                  type="datetime-local"
                  value={new Date(form.occurred_at).toISOString().slice(0,16)}
                  onChange={(e) => setForm({ ...form, occurred_at: new Date(e.target.value).toISOString() })}
                />
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
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Операции ({count})</CardTitle>
            <div className="flex items-center gap-3">
              <Input placeholder="Поиск..." value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} className="w-48" />
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
              <Input type="month" value={month} onChange={(e) => { setMonth(e.target.value); setDateFrom(""); setDateTo(""); setPage(0) }} />
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setMonth(""); setPage(0) }} />
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setMonth(""); setPage(0) }} />
              <Button variant="outline" onClick={() => exportExcel(items)}>Экспорт</Button>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="file" accept=".xlsx,.xls" onChange={importExcel} className="hidden" />
                <span className="px-3 py-2 rounded-md border">Импорт</span>
              </label>
              <Select value={String(pageSize)} onValueChange={(v: any) => { setPageSize(Number(v)); setPage(0) }}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Строк" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('occurred_at')}>Дата</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('type')}>Тип</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('category_id')}>Категория</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('amount')}>Сумма</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('method')}>Метод</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('description')}>Описание</TableHead>
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
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">Всего: {count}</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Назад</Button>
                <div className="text-sm">Стр. {page + 1} / {Math.max(1, Math.ceil(count / pageSize))}</div>
                <Button variant="outline" disabled={(page + 1) * pageSize >= count} onClick={() => setPage((p) => p + 1)}>Вперед</Button>
              </div>
            </div>
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

// Simple Excel export/import using SheetJS (xlsx) via dynamic import
async function exportExcel(rows: any[]) {
  if (!rows?.length) return
  const XLSX = await import('xlsx')
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'transactions.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

async function importExcel(e: any) {
  const file = e?.target?.files?.[0]
  if (!file) return
  const XLSX = await import('xlsx')
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const json: any[] = XLSX.utils.sheet_to_json(sheet)
  // naive bulk insert; in real app, add validation/mapping
  await fetch('/api/transactions', { method: 'POST', body: JSON.stringify(json) })
  window.location.reload()
}

// binded sort toggler
const toggleSort = toggleSortFactory(sortBy, sortDir, setSortBy, setSortDir, setPage)


