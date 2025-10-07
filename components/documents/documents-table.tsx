"use client"

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

const documents = [
  {
    id: 1,
    type: "Счет на оплату",
    number: "№ 245",
    client: 'ТОО "Альфа Строй"',
    amount: "₸ 450,000",
    date: "10 окт 2025",
    status: "paid",
    description: "Услуги по разработке ПО",
  },
  {
    id: 2,
    type: "ЭСФ",
    number: "№ 1523",
    client: 'ИП "Бета Трейд"',
    amount: "₸ 280,000",
    date: "12 окт 2025",
    status: "sent",
    description: "Поставка оборудования",
  },
  {
    id: 3,
    type: "Договор",
    number: "№ 78",
    client: 'ТОО "Гамма Логистика"',
    amount: "₸ 1,200,000",
    date: "08 окт 2025",
    status: "signed",
    description: "Договор на оказание услуг",
  },
  {
    id: 4,
    type: "АВР",
    number: "№ 156",
    client: 'ТОО "Дельта Сервис"',
    amount: "₸ 320,000",
    date: "14 окт 2025",
    status: "pending",
    description: "Акт выполненных работ за сентябрь",
  },
  {
    id: 5,
    type: "КП",
    number: "№ 89",
    client: 'ТОО "Эпсилон Групп"',
    amount: "₸ 680,000",
    date: "09 окт 2025",
    status: "draft",
    description: "Коммерческое предложение на консалтинг",
  },
  {
    id: 6,
    type: "Накладная",
    number: "№ 234",
    client: 'ИП "Зета Маркет"',
    amount: "₸ 150,000",
    date: "11 окт 2025",
    status: "sent",
    description: "Товарная накладная",
  },
  {
    id: 7,
    type: "Счет на оплату",
    number: "№ 246",
    client: 'ТОО "Эта Технологии"',
    amount: "₸ 890,000",
    date: "13 окт 2025",
    status: "pending",
    description: "Разработка мобильного приложения",
  },
  {
    id: 8,
    type: "ЭСФ",
    number: "№ 1524",
    client: 'ТОО "Тета Инвест"',
    amount: "₸ 520,000",
    date: "15 окт 2025",
    status: "paid",
    description: "Консультационные услуги",
  },
]

const statusConfig = {
  paid: { label: "Оплачен", color: "bg-success text-success-foreground" },
  sent: { label: "Отправлен", color: "bg-accent text-accent-foreground" },
  signed: { label: "Подписан", color: "bg-primary text-primary-foreground" },
  pending: { label: "Ожидает", color: "bg-warning text-warning-foreground" },
  draft: { label: "Черновик", color: "bg-muted text-muted-foreground" },
}

export function DocumentsTable() {
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
            {documents.map((doc) => (
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
                        <DropdownMenuItem>
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
