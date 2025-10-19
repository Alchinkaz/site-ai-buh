# 🚀 Быстрый старт - AI Accountant

## ✅ Что уже запущено

Ваш проект уже работает! Вот что доступно:

### 🌐 Веб-приложение
- **URL:** http://localhost:3001
- **Статус:** ✅ Работает
- **Порт:** 3001 (3000 занят)

### 🐍 PDF Парсер
- **Статус:** ✅ Готов к работе
- **Зависимости:** ✅ Установлены (pdfplumber)

### 🔌 API Endpoints
- **PDF парсинг:** http://localhost:3001/api/parse-pdf
- **Статус:** ✅ Доступен

## 🎯 Как использовать

### 1. Откройте приложение
```
http://localhost:3001
```

### 2. Перейдите к транзакциям
```
http://localhost:3001/cash-register/transactions-fa
```

### 3. Импорт PDF
1. Нажмите кнопку **"Импорт по PDF"**
2. Выберите PDF файл банковской выписки
3. Выберите банк (Kaspi, Forte, Onlinebank, и т.д.)
4. Выберите счет для импорта
5. Нажмите **"Импортировать"**

## 🔧 Если что-то не работает

### Перезапуск сервера
```bash
# Остановить сервер
pkill -f "next dev"

# Запустить заново
npm run dev
```

### Проверка Python
```bash
export PATH="$HOME/.local/bin:$PATH"
python3 -c "import pdf_parser; print('PDF парсер работает')"
```

### Проверка портов
```bash
ss -tlnp | grep -E ":300[0-9]"
```

## 📋 Основные страницы

- **Главная:** http://localhost:3001
- **Транзакции:** http://localhost:3001/cash-register/transactions-fa
- **Счета:** http://localhost:3001/cash-register/accounts-fa
- **Категории:** http://localhost:3001/cash-register/categories-fa

## 🎉 Готово!

Ваш AI Accountant готов к работе! Все компоненты запущены и функционируют.
