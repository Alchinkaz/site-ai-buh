"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MoreVertical, Mail, Phone } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const employees = [
  {
    id: 1,
    name: "Айгуль Нурланова",
    position: "Главный бухгалтер",
    salary: "₸ 500,000",
    email: "aigul@company.kz",
    phone: "+7 777 123 4567",
    status: "active",
    taxes: {
      ipn: "₸ 50,000",
      so: "₸ 17,500",
      opv: "₸ 50,000",
      osms: "₸ 10,000",
    },
  },
  {
    id: 2,
    name: "Ерлан Сапаров",
    position: "Финансовый директор",
    salary: "₸ 600,000",
    email: "erlan@company.kz",
    phone: "+7 777 234 5678",
    status: "active",
    taxes: {
      ipn: "₸ 60,000",
      so: "₸ 21,000",
      opv: "₸ 60,000",
      osms: "₸ 12,000",
    },
  },
  {
    id: 3,
    name: "Динара Касымова",
    position: "Бухгалтер",
    salary: "₸ 350,000",
    email: "dinara@company.kz",
    phone: "+7 777 345 6789",
    status: "active",
    taxes: {
      ipn: "₸ 35,000",
      so: "₸ 12,250",
      opv: "₸ 35,000",
      osms: "₸ 7,000",
    },
  },
  {
    id: 4,
    name: "Асель Токтарова",
    position: "Помощник бухгалтера",
    salary: "₸ 280,000",
    email: "asel@company.kz",
    phone: "+7 777 456 7890",
    status: "pending",
    taxes: {
      ipn: "₸ 28,000",
      so: "₸ 9,800",
      opv: "₸ 28,000",
      osms: "₸ 5,600",
    },
  },
  {
    id: 5,
    name: "Нурлан Абдуллаев",
    position: "Аудитор",
    salary: "₸ 450,000",
    email: "nurlan@company.kz",
    phone: "+7 777 567 8901",
    status: "active",
    taxes: {
      ipn: "₸ 45,000",
      so: "₸ 15,750",
      opv: "₸ 45,000",
      osms: "₸ 9,000",
    },
  },
  {
    id: 6,
    name: "Гульнара Смагулова",
    position: "Экономист",
    salary: "₸ 400,000",
    email: "gulnara@company.kz",
    phone: "+7 777 678 9012",
    status: "active",
    taxes: {
      ipn: "₸ 40,000",
      so: "₸ 14,000",
      opv: "₸ 40,000",
      osms: "₸ 8,000",
    },
  },
]

export function EmployeeList() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Список сотрудников</h3>

      <div className="space-y-4">
        {employees.map((employee) => (
          <div
            key={employee.id}
            className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50"
          >
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h4 className="font-semibold">{employee.name}</h4>
                  <p className="text-sm text-muted-foreground">{employee.position}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                    {employee.status === "active" ? "Активен" : "Ожидает"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Редактировать</DropdownMenuItem>
                      <DropdownMenuItem>Начислить зарплату</DropdownMenuItem>
                      <DropdownMenuItem>История выплат</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Удалить</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Оклад</p>
                  <p className="text-lg font-bold">{employee.salary}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ИПН (10%)</p>
                  <p className="text-sm font-medium">{employee.taxes.ipn}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">СО (3.5%)</p>
                  <p className="text-sm font-medium">{employee.taxes.so}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ОПВ (10%)</p>
                  <p className="text-sm font-medium">{employee.taxes.opv}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ОСМС (2%)</p>
                  <p className="text-sm font-medium">{employee.taxes.osms}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">К выплате</p>
                  <p className="text-sm font-bold text-success">
                    ₸{" "}
                    {(
                      Number.parseInt(employee.salary.replace(/[^\d]/g, "")) -
                      Number.parseInt(employee.taxes.ipn.replace(/[^\d]/g, "")) -
                      Number.parseInt(employee.taxes.opv.replace(/[^\d]/g, "")) -
                      Number.parseInt(employee.taxes.osms.replace(/[^\d]/g, ""))
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {employee.email}
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {employee.phone}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
