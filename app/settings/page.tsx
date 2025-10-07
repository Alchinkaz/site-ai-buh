"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useSidebarConfig } from "@/hooks/use-sidebar-config"
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Calculator,
  Users,
  Bell,
  Building2,
  BarChart3,
  ShoppingCart,
  Warehouse,
  CreditCard,
  DollarSign,
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

const allSections = [
  { name: "Дашборд", href: "/", icon: LayoutDashboard },
  { name: "Документы", href: "/documents", icon: FileText },
  { name: "Чат с ИИ", href: "/chat", icon: MessageSquare },
  { name: "Контрагенты", href: "/counterparties", icon: Building2 },
  { name: "Налоги/Отчеты", href: "/taxes", icon: Calculator },
  { name: "Сотрудники/Зарплата", href: "/payroll", icon: Users },
  { name: "Торговля", href: "/trade", icon: ShoppingCart },
  { name: "Склады", href: "/warehouses", icon: Warehouse },
  { name: "Касса", href: "/cash-register", icon: CreditCard },
  { name: "Аналитика", href: "/analytics", icon: BarChart3 },
  { name: "Напоминания", href: "/reminders", icon: Bell },
  { name: "Тарифы", href: "/pricing", icon: DollarSign },
]

export default function SettingsPage() {
  const { basicSections, setBasicSections } = useSidebarConfig()
  const [selectedSections, setSelectedSections] = useState<string[]>(basicSections)

  useEffect(() => {
    setSelectedSections(basicSections)
  }, [basicSections])

  const handleToggleSection = (href: string) => {
    setSelectedSections((prev) => {
      if (prev.includes(href)) {
        return prev.filter((s) => s !== href)
      } else {
        if (prev.length >= 5) {
          toast.error("Максимум 5 разделов в базовом режиме")
          return prev
        }
        return [...prev, href]
      }
    })
  }

  const handleSave = () => {
    if (selectedSections.length === 0) {
      toast.error("Выберите хотя бы один раздел")
      return
    }
    setBasicSections(selectedSections)
    toast.success("Настройки сохранены")
  }

  const handleReset = () => {
    const defaultSections = ["/", "/documents", "/chat", "/taxes", "/payroll"]
    setSelectedSections(defaultSections)
    setBasicSections(defaultSections)
    toast.success("Настройки сброшены")
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Настройки</h1>
          <p className="text-muted-foreground mt-2">Настройте отображение разделов в базовом режиме</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Базовые разделы</CardTitle>
            <CardDescription>
              Выберите до 5 разделов, которые будут отображаться в базовом режиме навигации. Выбрано:{" "}
              {selectedSections.length}/5
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {allSections.map((section) => {
                const Icon = section.icon
                const isSelected = selectedSections.includes(section.href)

                return (
                  <div key={section.href} className="flex items-center space-x-3">
                    <Checkbox
                      id={section.href}
                      checked={isSelected}
                      onCheckedChange={() => handleToggleSection(section.href)}
                    />
                    <Label
                      htmlFor={section.href}
                      className="flex items-center gap-2 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <Icon className="w-4 h-4" />
                      {section.name}
                    </Label>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave}>Сохранить изменения</Button>
              <Button variant="outline" onClick={handleReset}>
                Сбросить по умолчанию
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>О базовом режиме</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Базовый режим позволяет упростить навигацию, показывая только самые важные для вас разделы.</p>
            <p>Переключайтесь между базовым и полным режимом с помощью кнопки в боковой панели.</p>
            <p>В свернутом виде боковой панели отображаются только иконки разделов с подсказками при наведении.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
