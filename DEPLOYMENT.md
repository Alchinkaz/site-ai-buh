# 🚀 Руководство по развертыванию

## 📋 PDF Парсер - Разные среды

### 🏠 Локальная разработка

**Полный функционал:**
- ✅ Python скрипт `pdf_parser.py` работает
- ✅ Реальный парсинг PDF файлов
- ✅ Извлечение транзакций из банковских выписок
- ✅ Поддержка всех банков (Kaspi, Forte, Onlinebank, и т.д.)

**Требования:**
```bash
# Установка зависимостей
pip install pdfplumber

# Или через requirements.txt
pip install -r requirements.txt
```

### 🌐 Продакшен (Vercel)

**Демо-режим:**
- ⚠️ Python недоступен на Vercel
- ✅ Fallback функция создает примерную транзакцию
- ✅ UI работает без ошибок
- ✅ Пользователь видит уведомление о демо-режиме

**Автоматическое определение:**
- API автоматически определяет среду
- В продакшене используется `parsePDFContentSimple()`
- В локальной разработке используется `parsePDFContentPython()`

## 🔧 Настройка для продакшена

### Вариант 1: Использовать внешний API

Создать отдельный сервис для парсинга PDF:

```typescript
// В app/api/parse-pdf/route.ts
async function parsePDFContent(buffer: Buffer, bankName: string) {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    // Вызов внешнего API
    const response = await fetch('https://your-pdf-parser-api.com/parse', {
      method: 'POST',
      body: formData
    })
    return response.json()
  }
  
  // Локальный Python парсинг
  return parsePDFContentPython(buffer, bankName)
}
```

### Вариант 2: Использовать Vercel Functions с Python

Создать отдельную Vercel Function:

```python
# api/pdf-parser.py
import json
import pdfplumber

def handler(request):
    # Логика парсинга PDF
    return json.dumps(result)
```

### Вариант 3: Использовать Docker

Развернуть на платформе с поддержкой Docker:

```dockerfile
FROM node:18
RUN apt-get update && apt-get install -y python3 python3-pip
COPY requirements.txt .
RUN pip3 install -r requirements.txt
COPY . .
RUN npm install
CMD ["npm", "start"]
```

## 📊 Текущее состояние

| Функция | Локально | Продакшен |
|---------|----------|-----------|
| PDF парсинг | ✅ Полный | ⚠️ Демо |
| UI компонент | ✅ | ✅ |
| API endpoint | ✅ | ✅ |
| Обработка ошибок | ✅ | ✅ |
| Уведомления | ✅ | ✅ |

## 🎯 Рекомендации

1. **Для демонстрации:** Текущее решение отлично подходит
2. **Для продакшена:** Рассмотрите варианты 1-3 выше
3. **Для разработки:** Используйте локальную среду с Python

## 🔗 Полезные ссылки

- [Vercel Functions](https://vercel.com/docs/functions)
- [Python на Vercel](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- [Docker на Vercel](https://vercel.com/docs/deployments/docker)
