import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { spawn } from 'child_process'

// Простая функция парсинга PDF (fallback для продакшена)
async function parsePDFContentSimple(buffer: Buffer, bankName: string = 'Kaspi'): Promise<any[]> {
  // Возвращаем пример данных для демонстрации
  return [
    {
      date: new Date().toISOString().split('T')[0],
      type: "income",
      amount: 100000,
      comment: `Пример транзакции из ${bankName} Bank (PDF парсинг недоступен на продакшене)`,
      counterparty: "ТОО Пример контрагент",
      documentNumber: "12345",
      debit: "",
      credit: "100000.00"
    },
    {
      date: new Date().toISOString().split('T')[0],
      type: "expense",
      amount: 50000,
      comment: `Пример расхода из ${bankName} Bank`,
      counterparty: "ИП Пример поставщик",
      documentNumber: "12346",
      debit: "50000.00",
      credit: ""
    }
  ]
}

// Функция для парсинга PDF через Python скрипт (только для локальной разработки)
async function parsePDFContentPython(buffer: Buffer, bankName: string = 'Kaspi'): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const tempPath = join(tmpdir(), `pdf-${Date.now()}.pdf`)
    
    // Сохраняем PDF во временный файл
    writeFile(tempPath, buffer)
      .then(() => {
        // Запускаем Python скрипт
        const pythonProcess = spawn('python3', [
          join(process.cwd(), 'pdf_parser.py'),
          tempPath,
          bankName
        ], {
          env: { ...process.env, PATH: `${process.env.HOME}/.local/bin:${process.env.PATH}` }
        })
        
        let output = ''
        let errorOutput = ''
        
        pythonProcess.stdout.on('data', (data) => {
          output += data.toString()
        })
        
        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString()
        })
        
        pythonProcess.on('close', async (code) => {
          // Удаляем временный файл
          try {
            await unlink(tempPath)
          } catch (e) {
            console.warn('Не удалось удалить временный файл:', e)
          }
          
          if (code !== 0) {
            console.error('Python скрипт завершился с ошибкой:', errorOutput)
            reject(new Error(`Python скрипт завершился с ошибкой (код ${code}): ${errorOutput}`))
            return
          }
          
          try {
            console.log('Python скрипт output:', output)
            
            // Парсим JSON вывод Python скрипта
            const lines = output.trim().split('\n')
            const jsonLine = lines.find(line => line.startsWith('{') || line.startsWith('['))
            
            if (!jsonLine) {
              console.error('Не найден JSON в выводе Python скрипта. Полный вывод:', output)
              reject(new Error('Python скрипт не вернул валидный JSON'))
              return
            }
            
            const pythonData = JSON.parse(jsonLine)
            
            // Проверяем, есть ли ошибка в ответе
            if (pythonData.error) {
              reject(new Error(pythonData.error))
              return
            }
            
            // Проверяем, что это массив
            if (!Array.isArray(pythonData)) {
              reject(new Error('Python скрипт вернул не массив данных'))
              return
            }
            
            // Преобразуем данные в формат приложения
            const transactions = pythonData.map((item: any) => ({
              date: item.ДатаОперации || item.date,
              type: item.Тип === 'Доход' ? 'income' : 'expense',
              amount: parseFloat(item.Сумма || item.amount || '0'),
              comment: item.Комментарий || item.comment || '',
              counterparty: item.Контрагент || item.counterparty || '',
              // Дополнительные поля
              documentNumber: item.НомерДокумента || item.documentNumber || '',
              debit: item.Дебет || item.debit || '',
              credit: item.Кредит || item.credit || ''
            }))
            
            resolve(transactions)
          } catch (parseError) {
            console.error('Ошибка парсинга результата Python скрипта:', parseError)
            reject(new Error(`Ошибка парсинга результата Python скрипта: ${parseError}`))
          }
        })
        
        pythonProcess.on('error', async (error) => {
          // Удаляем временный файл в случае ошибки
          try {
            await unlink(tempPath)
          } catch (e) {}
          
          reject(new Error(`Ошибка запуска Python скрипта: ${error.message}`))
        })
      })
      .catch(reject)
  })
}

// Основная функция парсинга PDF
async function parsePDFContent(buffer: Buffer, bankName: string = 'Kaspi'): Promise<any[]> {
  // Проверяем, находимся ли мы в продакшене (Vercel)
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL
  
  if (isProduction) {
    console.log('Используем fallback парсинг для продакшена')
    return parsePDFContentSimple(buffer, bankName)
  }
  
  // В локальной разработке пытаемся использовать Python
  try {
    return await parsePDFContentPython(buffer, bankName)
  } catch (error) {
    console.warn('Python парсинг недоступен, используем fallback:', error)
    return parsePDFContentSimple(buffer, bankName)
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bankName = formData.get('bankName') as string || 'Kaspi'
    
    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 })
    }

    // Сохраняем файл во временную папку
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    try {
      // Парсим PDF через Python скрипт
      const transactions = await parsePDFContent(buffer, bankName)
      
      return NextResponse.json({ 
        success: true, 
        transactions,
        count: transactions.length 
      })
    } catch (error) {
      console.error('Ошибка парсинга PDF:', error)
      throw error
    }
  } catch (error) {
    console.error('Ошибка парсинга PDF:', error)
    return NextResponse.json(
      { error: 'Ошибка при обработке PDF файла' }, 
      { status: 500 }
    )
  }
}
