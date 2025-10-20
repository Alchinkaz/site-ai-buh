#!/bin/bash

# AI Accountant - Скрипт установки и запуска
# Автоматическая установка зависимостей и тестирование подключения

echo "🚀 AI Accountant - Установка и настройка"
echo "=========================================="

# Проверяем наличие Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не найден. Установите Python3 и повторите попытку."
    exit 1
fi

echo "✅ Python3 найден: $(python3 --version)"

# Проверяем наличие pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 не найден. Установите pip3 и повторите попытку."
    exit 1
fi

echo "✅ pip3 найден"

# Устанавливаем зависимости
echo ""
echo "📦 Установка зависимостей..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Зависимости установлены успешно"
else
    echo "❌ Ошибка при установке зависимостей"
    exit 1
fi

# Тестируем подключение
echo ""
echo "🧪 Тестирование подключения к Supabase..."
python3 test_connection.py

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Установка завершена успешно!"
    echo ""
    echo "📋 Следующие шаги:"
    echo "1. Выполните SQL схему в Supabase: database_schema.sql"
    echo "2. Поместите файлы .txt в текущую папку"
    echo "3. Запустите парсер: python3 parser_improved.py"
    echo ""
    echo "📚 Дополнительная информация в README.md"
else
    echo ""
    echo "⚠️ Обнаружены проблемы с подключением к Supabase"
    echo "Проверьте:"
    echo "1. URL и ключ в supabase_config.py"
    echo "2. Выполнена ли SQL схема в Supabase"
    echo "3. Интернет-соединение"
fi
