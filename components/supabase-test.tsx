"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function SupabaseTest() {
  const [testResult, setTestResult] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setTestResult("")
    
    try {
      console.log("Testing Supabase connection...")
      
      // Динамический импорт supabase
      const { supabase } = await import("@/lib/supabase")
      
      // Тест 1: Проверка подключения
      const { data: connectionTest, error: connectionError } = await supabase
        .from('employees')
        .select('count')
        .limit(1)
      
      if (connectionError) {
        throw new Error(`Connection error: ${connectionError.message}`)
      }
      
      setTestResult("✅ Подключение к Supabase успешно!")
      
      // Тест 2: Проверка таблицы
      const { data: tableTest, error: tableError } = await supabase
        .from('employees')
        .select('*')
        .limit(5)
      
      if (tableError) {
        throw new Error(`Table error: ${tableError.message}`)
      }
      
      setTestResult(prev => prev + `\n✅ Таблица employees найдена! Записей: ${tableTest?.length || 0}`)
      
      // Тест 3: Проверка структуры
      if (tableTest && tableTest.length > 0) {
        const firstRecord = tableTest[0]
        const fields = Object.keys(firstRecord)
        setTestResult(prev => prev + `\n✅ Поля таблицы: ${fields.join(', ')}`)
      }
      
    } catch (error) {
      console.error("Test error:", error)
      setTestResult(`❌ Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      setLoading(false)
    }
  }

  const createTable = async () => {
    setLoading(true)
    setTestResult("")
    
    try {
      // Динамический импорт supabase
      const { supabase } = await import("@/lib/supabase")
      
      // Попытка создать простую запись для проверки структуры таблицы
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          name: 'Тестовый сотрудник',
          position: 'Тестовая должность',
          salary: 100000,
          email: 'test@company.kz',
          phone: '+7 777 000 0000',
          status: 'active'
        }])
        .select()
        .single()
      
      if (error) {
        throw new Error(`Insert error: ${error.message}`)
      }
      
      setTestResult("✅ Тестовая запись создана успешно!")
      
      // Удаляем тестовую запись
      await supabase
        .from('employees')
        .delete()
        .eq('id', data.id)
      
      setTestResult(prev => prev + "\n✅ Тестовая запись удалена")
      
    } catch (error) {
      console.error("Create table test error:", error)
      setTestResult(`❌ Ошибка создания записи: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Тест подключения к Supabase</h3>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testConnection} disabled={loading}>
            {loading ? "Тестирование..." : "Тест подключения"}
          </Button>
          <Button onClick={createTable} disabled={loading} variant="outline">
            {loading ? "Создание..." : "Тест создания записи"}
          </Button>
        </div>
        
        {testResult && (
          <div className="p-4 bg-muted rounded-md">
            <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
          </div>
        )}
        
        <div className="text-sm text-muted-foreground">
          <p><strong>URL:</strong> https://aigrzflspieakaoaptml.supabase.co</p>
          <p><strong>Статус:</strong> {loading ? "Подключение..." : "Готов к тестированию"}</p>
        </div>
      </div>
    </Card>
  )
}
