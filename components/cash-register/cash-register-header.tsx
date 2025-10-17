"use client"

import { Button } from "@/components/ui/button"
import { Plus, Download, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"

export function CashRegisterHeader() {
  const [open, setOpen] = useState(false)
  const src = process.env.NEXT_PUBLIC_FINANCEAPP_URL || ""
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Касса</h1>
        <p className="text-muted-foreground mt-2">Управление кассовыми операциями</p>
      </div>
      <div className="flex gap-2">
        <Link href="/transactions">
          <Button variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors">
            Доходы/Расходы
          </Button>
        </Link>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={!src}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Открыть FinanceApp
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] w-[1200px] h-[80vh] p-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle>FinanceApp</DialogTitle>
            </DialogHeader>
            {src ? (
              <iframe
                src={src}
                className="w-full h-full"
                sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups"
              />
            ) : (
              <div className="p-6 text-sm text-muted-foreground">
                Не задан адрес внешнего приложения. Установите переменную окружения
                <code className="mx-1">NEXT_PUBLIC_FINANCEAPP_URL</code>.
              </div>
            )}
          </DialogContent>
        </Dialog>
        <Link href="/cash-register/transactions-fa">
          <Button>
            Доходы/Расходы (FA)
          </Button>
        </Link>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Отчет
        </Button>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Новая операция
        </Button>
      </div>
    </div>
  )
}
