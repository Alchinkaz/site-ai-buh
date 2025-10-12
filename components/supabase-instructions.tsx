"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

const SQL_SCRIPT = `-- Создание таблицы employees
CREATE TABLE employees (
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

-- Включение RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Создание политики для анонимного доступа
CREATE POLICY "Enable all operations for anonymous users" ON employees
FOR ALL USING (true) WITH CHECK (true);

-- Вставка тестовых данных
INSERT INTO employees (name, position, salary, email, phone, status, work_schedule, hire_date) VALUES
('Айгуль Нурланова', 'Главный бухгалтер', 500000, 'aigul@company.kz', '+7 777 123 4567', 'active', 'full-time', '2023-01-15'),
('Ерлан Сапаров', 'Финансовый директор', 600000, 'erlan@company.kz', '+7 777 234 5678', 'active', 'full-time', '2022-11-20'),
('Динара Касымова', 'Бухгалтер', 350000, 'dinara@company.kz', '+7 777 345 6789', 'active', 'full-time', '2023-03-10');`

export function SupabaseInstructions() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(SQL_SCRIPT)
      setCopied(true)
      toast.success("SQL скрипт скопирован в буфер обмена!")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Не удалось скопировать скрипт")
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Настройка Supabase</h3>
      
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Таблица <code>employees</code> не найдена в Supabase. 
            Выполните следующие шаги для создания таблицы.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h4 className="font-medium">Пошаговые инструкции:</h4>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <p className="font-medium">Откройте Supabase Dashboard</p>
                <p className="text-sm text-muted-foreground">
                  Перейдите в ваш проект Supabase
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Открыть Dashboard
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <p className="font-medium">Перейдите в SQL Editor</p>
                <p className="text-sm text-muted-foreground">
                  В левом меню выберите "SQL Editor"
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <p className="font-medium">Скопируйте и выполните SQL скрипт</p>
                <p className="text-sm text-muted-foreground">
                  Нажмите кнопку "Копировать" и вставьте в SQL Editor
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Скопировано!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Копировать SQL
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">4</div>
              <div>
                <p className="font-medium">Нажмите "Run" для выполнения</p>
                <p className="text-sm text-muted-foreground">
                  Скрипт создаст таблицу и вставит тестовые данные
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">5</div>
              <div>
                <p className="font-medium">Обновите страницу приложения</p>
                <p className="text-sm text-muted-foreground">
                  После создания таблицы синхронизация заработает
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-medium text-sm">SQL скрипт для создания таблицы:</h5>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={copyToClipboard}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-background p-3 rounded border">
{SQL_SCRIPT}
          </pre>
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            После выполнения скрипта вы увидите зеленый индикатор "Синхронизация с Supabase" 
            и сможете использовать все функции управления сотрудниками с сохранением в облаке.
          </AlertDescription>
        </Alert>
      </div>
    </Card>
  )
}
