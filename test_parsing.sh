#!/bin/bash

# 🚀 Скрипт для быстрого тестирования улучшенного парсинга

echo "🚀 ТЕСТИРОВАНИЕ УЛУЧШЕННОГО ПАРСИНГА"
echo "=================================="

# Проверяем наличие Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не найден. Установите Python3 для продолжения."
    exit 1
fi

# Проверяем наличие необходимых файлов
if [ ! -f "parser_improved.py" ]; then
    echo "❌ Файл parser_improved.py не найден"
    exit 1
fi

if [ ! -f "pdf_parser_improved.py" ]; then
    echo "❌ Файл pdf_parser_improved.py не найден"
    exit 1
fi

# Устанавливаем зависимости если нужно
echo "📦 Проверка зависимостей..."
python3 -c "import pdfplumber" 2>/dev/null || {
    echo "📥 Установка pdfplumber..."
    pip3 install pdfplumber --break-system-packages
}

python3 -c "import chardet" 2>/dev/null || {
    echo "📥 Установка chardet..."
    pip3 install chardet --break-system-packages
}

# Запускаем тесты
echo "🧪 Запуск тестов..."
python3 test_improved_parsers.py

# Проверяем результаты
if [ -f "test_results.json" ]; then
    echo "✅ Результаты сохранены в test_results.json"
    
    # Показываем краткую статистику
    echo "📊 Краткая статистика:"
    python3 -c "
import json
try:
    with open('test_results.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f'  1C файлы: {data[\"summary\"][\"total_1c\"]} операций')
    print(f'  PDF файлы: {data[\"summary\"][\"total_pdf\"]} операций')
    print(f'  Всего: {data[\"summary\"][\"total_all\"]} операций')
except Exception as e:
    print(f'  Ошибка чтения результатов: {e}')
"
else
    echo "❌ Файл результатов не создан"
fi

echo ""
echo "🎯 СЛЕДУЮЩИЕ ШАГИ:"
echo "1. Проверьте результаты в test_results.json"
echo "2. При необходимости замените старые парсеры на улучшенные"
echo "3. Протестируйте в реальных условиях"
echo ""
echo "✅ Тестирование завершено!"


