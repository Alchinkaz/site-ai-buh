"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreVertical, Building2, User } from "lucide-react"

const counterparties = [
  {
    id: 1,
    name: "ТОО Поставщик 1",
    type: "Поставщик",
    bin: "123456789012",
    contact: "Иванов И.И.",
    phone: "+7 777 123 4567",
    email: "supplier1@example.kz",
    balance: 250000,
  },
  {
    id: 2,
    name: "ИП Клиент 1",
    type: "Клиент",
    bin: "987654321098",
    contact: "Петров П.П.",
    phone: "+7 777 987 6543",
    email: "client1@example.kz",
    balance: -150000,
  },
  {
    id: 3,
    name: "ТОО Партнер",
    type: "Клиент",
    bin: "456789123456",
    contact: "Сидоров С.С.",
    phone: "+7 777 456 7890",
    email: "partner@example.kz",
    balance: 0,
  },
]

export function CounterpartiesTable() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Список контрагентов</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Поиск..." className="pl-9" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Название</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Тип</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">БИН/ИИН</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Контакт</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Телефон</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Баланс</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {counterparties.map((counterparty) => (
                <tr key={counterparty.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {counterparty.name.startsWith("ТОО") ? (
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <User className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium">{counterparty.name}</div>
                        <div className="text-sm text-muted-foreground">{counterparty.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={counterparty.type === "Клиент" ? "default" : "secondary"}>
                      {counterparty.type}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-sm">{counterparty.bin}</td>
                  <td className="py-4 px-4 text-sm">{counterparty.contact}</td>
                  <td className="py-4 px-4 text-sm">{counterparty.phone}</td>
                  <td className="py-4 px-4 text-right">
                    <span
                      className={
                        counterparty.balance > 0
                          ? "text-red-500 font-medium"
                          : counterparty.balance < 0
                            ? "text-green-500 font-medium"
                            : ""
                      }
                    >
                      {counterparty.balance.toLocaleString("ru-KZ")} ₸
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Просмотр</DropdownMenuItem>
                        <DropdownMenuItem>Редактировать</DropdownMenuItem>
                        <DropdownMenuItem>История операций</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Удалить</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
