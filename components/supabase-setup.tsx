"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export function SupabaseSetup() {
  const [isCreating, setIsCreating] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)

  const createTable = async () => {
    setIsCreating(true)
    setResult(null)
    
    try {
      // Динамический импорт supabase
      const { supabase } = await import("@/lib/supabase")
      
      console.log("Creating employees table...")
      
      // Попытка создать простую запись для проверки существования таблицы
      const { data: testData, error: testError } = await supabase
        .from('employees')
        .select('id')
        .limit(1)

      if (!testError) {
        setResult({
          success: true,
          message: "Таблица employees уже существует!",
          details: "Синхронизация должна работать корректно."
        })
        return
      }

      // Если таблица не существует, показываем инструкции
      setResult({
        success: false,
        message: "Таблица employees не найдена",
        details: "Пожалуйста, выполните SQL скрипт в Supabase Dashboard для создания таблицы."
      })

    } catch (error) {
      console.error("Setup error:", error)
      setResult({
        success: false,
        message: "Ошибка проверки таблицы",
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Настройка Supabase</h3>
      
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Таблица <code>employees</code> не найдена в Supabase. 
            Выполните SQL скрипт в Supabase Dashboard для создания таблицы.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={createTable} 
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Проверка таблицы...
            </>
          ) : (
            "Проверить таблицу employees"
          )}
        </Button>

        {result && (
          <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
              <div className="font-medium">{result.message}</div>
              {result.details && (
                <div className="text-sm mt-1 opacity-80">{result.details}</div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground">
          <p><strong>Инструкции по созданию таблицы:</strong></p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Откройте <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
            <li>Выберите ваш проект</li>
            <li>Перейдите в раздел "SQL Editor"</li>
            <li>Скопируйте и выполните SQL скрипт из файла <code>create-table.sql</code></li>
            <li>Обновите страницу приложения</li>
          </ol>
          
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="font-medium mb-2">SQL скрипт для создания таблицы:</p>
            <pre className="text-xs overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS public.employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  salary INTEGER NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT,
  social_media TEXT,
  status VARCHAR(20) DEFAULT 'active',
  work_schedule VARCHAR(100),
  hire_date DATE,
  dismiss_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for anonymous users" ON public.employees
FOR ALL USING (true) WITH CHECK (true);`}
            </pre>
          </div>
        </div>
      </div>
    </Card>
  )
}
