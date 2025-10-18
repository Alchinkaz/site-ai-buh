import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

// Простая функция для парсинга PDF (заглушка)
async function parsePDFContent(buffer: Buffer): Promise<any[]> {
  // Здесь должна быть реальная логика парсинга PDF
  // Пока возвращаем моковые данные
  return [
    {
      date: "2024-01-15",
      type: "income",
      amount: 50000,
      comment: "Поступление от клиента",
      counterparty: "ООО Клиент"
    },
    {
      date: "2024-01-16", 
      type: "expense",
      amount: 15000,
      comment: "Оплата поставщику",
      counterparty: "ИП Поставщик"
    }
  ]
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 })
    }

    // Сохраняем файл во временную папку
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const tempPath = join(tmpdir(), `pdf-${Date.now()}.pdf`)
    await writeFile(tempPath, buffer)

    try {
      // Парсим PDF
      const transactions = await parsePDFContent(buffer)
      
      // Удаляем временный файл
      await unlink(tempPath)
      
      return NextResponse.json({ 
        success: true, 
        transactions,
        count: transactions.length 
      })
    } catch (error) {
      // Удаляем временный файл в случае ошибки
      try {
        await unlink(tempPath)
      } catch {}
      
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
