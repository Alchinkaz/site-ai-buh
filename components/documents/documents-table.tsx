"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Edit, Trash2, Send } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"

type DocumentItem = {
  id: number
  type: string
  number: string
  client: string
  amount: string
  date: string
  status: "paid" | "sent" | "signed" | "pending" | "draft"
  description: string
}

const statusConfig = {
  paid: { label: "Оплачен", color: "bg-success text-success-foreground" },
  sent: { label: "Отправлен", color: "bg-accent text-accent-foreground" },
  signed: { label: "Подписан", color: "bg-primary text-primary-foreground" },
  pending: { label: "Ожидает", color: "bg-warning text-warning-foreground" },
  draft: { label: "Черновик", color: "bg-muted text-muted-foreground" },
}

export function DocumentsTable() {
  const [docs, setDocs] = useState<DocumentItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    fetch("/api/documents")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data = (await r.json()) as DocumentItem[]
        if (isMounted) setDocs(data)
      })
      .catch((e) => {
        if (isMounted) setError("Не удалось загрузить документы")
        console.error(e)
      })
    return () => {
      isMounted = false
    }
  }, [])

  const rows = useMemo(() => docs ?? [], [docs])

  return (
    <Card className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Тип</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Номер</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Клиент</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Описание</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Сумма</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Дата</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Статус</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Действия</th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr>
                <td colSpan={8} className="py-6 px-4 text-sm text-destructive">
                  {error}
                </td>
              </tr>
            )}
            {!error && docs === null && (
              <tr>
                <td colSpan={8} className="py-6 px-4 text-sm text-muted-foreground">
                  Загрузка...
                </td>
              </tr>
            )}
            {!error && rows.map((doc) => (
              <tr key={doc.id} className="border-b border-border hover:bg-accent/50">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{doc.type}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-muted-foreground">{doc.number}</td>
                <td className="py-4 px-4 text-sm">{doc.client}</td>
                <td className="py-4 px-4 text-sm text-muted-foreground max-w-xs truncate">{doc.description}</td>
                <td className="py-4 px-4 text-sm font-medium">{doc.amount}</td>
                <td className="py-4 px-4 text-sm text-muted-foreground">{doc.date}</td>
                <td className="py-4 px-4">
                  <Badge className={statusConfig[doc.status as keyof typeof statusConfig].color}>
                    {statusConfig[doc.status as keyof typeof statusConfig].label}
                  </Badge>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="w-4 h-4 mr-2" />
                          Отправить
                        </DropdownMenuItem>
                         <DropdownMenuItem
                           onClick={(e) => {
                             e.preventDefault()
                             const url = `/api/documents/${doc.id}`
                             const a = document.createElement("a")
                             a.href = url
                             a.download = `document-${doc.id}.json`
                             document.body.appendChild(a)
                             a.click()
                             a.remove()
                           }}
                         >
                           <Download className="w-4 h-4 mr-2" />
                           Скачать
                         </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
