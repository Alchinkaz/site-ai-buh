import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { spawn } from 'child_process'

// Функция для парсинга PDF через Python скрипт
async function parsePDFContent(buffer: Buffer, bankName: string = 'Kaspi'): Promise<any[]> {
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
            reject(new Error(`Python скрипт завершился с ошибкой: ${errorOutput}`))
            return
          }
          
          try {
            // Парсим JSON вывод Python скрипта
            const lines = output.trim().split('\n')
            const jsonLine = lines.find(line => line.startsWith('{') || line.startsWith('['))
            
            if (!jsonLine) {
              reject(new Error('Python скрипт не вернул валидный JSON'))
              return
            }
            
            const pythonData = JSON.parse(jsonLine)
            
            // Преобразуем данные в формат приложения
            const transactions = pythonData.map((item: any) => ({
              date: item.ДатаОперации || item.date,
              type: item.Тип === 'Доход' ? 'income' : 'expense',
              amount: parseFloat(item.Сумма || item.amount || '0'),
              comment: item.Комментарий || item.comment || '',
              counterparty: item.Контрагент || item.counterparty || ''
            }))
            
            resolve(transactions)
          } catch (parseError) {
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
