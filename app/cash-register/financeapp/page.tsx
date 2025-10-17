"use client"

import { DashboardLayout } from "@/components/dashboard-layout"

export default function FinanceAppEmbedPage() {
  const src = process.env.NEXT_PUBLIC_FINANCEAPP_URL || ""

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 h-[calc(100vh-120px)]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">FinanceApp</h1>
          <p className="text-muted-foreground mt-2">Встроенный доступ к внешнему приложению</p>
        </div>
        {src ? (
          <iframe
            src={src}
            className="w-full flex-1 rounded-lg border"
            sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups"
          />
        ) : (
          <div className="text-sm text-muted-foreground">
            Не задан адрес внешнего приложения. Установите переменную окружения
            <code className="mx-1">NEXT_PUBLIC_FINANCEAPP_URL</code>
            в настройках среды.
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}


