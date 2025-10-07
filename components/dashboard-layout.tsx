"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Calculator,
  Users,
  Bell,
  Settings,
  Menu,
  Building2,
  BarChart3,
  ShoppingCart,
  Warehouse,
  CreditCard,
  DollarSign,
  Globe,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  LayoutGrid,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { useSidebarConfig } from "@/hooks/use-sidebar-config"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navigation = [
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

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [language, setLanguage] = useState("РУС")
  const [company, setCompany] = useState("ТОО Компания 1")
  const { isCollapsed, isBasicMode, basicSections, toggleCollapsed, toggleMode } = useSidebarConfig()

  const filteredNavigation = isBasicMode ? navigation.filter((item) => basicSections.includes(item.href)) : navigation

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className={cn("p-6 border-b border-border", collapsed && "p-4")}>
        {!collapsed ? (
          <>
            <h2 className="text-xl font-bold text-balance">ИИ Бухгалтер</h2>
            <p className="text-sm text-muted-foreground mt-1">Умная бухгалтерия</p>
          </>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              ИИ
            </div>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="p-4 border-b border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 bg-transparent"
            onClick={toggleMode}
          >
            {isBasicMode ? <Layers className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
            <span className="text-xs">{isBasicMode ? "Базовые разделы" : "Все разделы"}</span>
          </Button>
        </div>
      )}

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <TooltipProvider delayDuration={0}>
          {filteredNavigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            const linkContent = (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                  collapsed ? "justify-center p-3" : "px-4 py-3",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return linkContent
          })}
        </TooltipProvider>
      </nav>

      <div className={cn("p-4 border-t border-border space-y-2", collapsed && "p-2")}>
        {!collapsed ? (
          <>
            <Link href="/settings">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="w-5 h-5 mr-3" />
                Настройки
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={toggleCollapsed}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Свернуть
            </Button>
          </>
        ) : (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/settings">
                  <Button variant="ghost" size="icon" className="w-full">
                    <Settings className="w-5 h-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Настройки</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-full" onClick={toggleCollapsed}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Развернуть</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={cn(
          "hidden lg:flex border-r border-border flex-col transition-all duration-300",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        <SidebarContent collapsed={isCollapsed} />
      </aside>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent collapsed={false} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-border bg-background sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <h2 className="text-lg font-bold">ИИ Бухгалтер</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Company Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{company}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setCompany("ТОО Компания 1")}>ТОО Компания 1</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCompany("ИП Иванов")}>ИП Иванов</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCompany("ТОО Компания 2")}>ТОО Компания 2</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Globe className="w-4 h-4" />
                  <span>{language}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage("РУС")}>Русский</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("ҚАЗ")}>Қазақша</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("ENG")}>English</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
