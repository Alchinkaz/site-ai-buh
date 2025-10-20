#!/usr/bin/env python3
"""
Скрипт для синхронизации кассовых операций с Supabase
"""

import os
import sys
from parser_improved import sync_cash_transactions, test_connection

def main():
    print("💰 AI Accountant - Синхронизация кассовых операций")
    print("=" * 60)
    
    # Проверяем подключение к Supabase
    print("🔌 Проверка подключения к Supabase...")
    if not test_connection():
        print("❌ Не удалось подключиться к Supabase. Проверьте настройки.")
        sys.exit(1)
    
    # Ищем файлы .txt
    folder = "."
    files = [os.path.join(folder, f) for f in os.listdir(folder) if f.endswith(".txt")]

    if not files:
        print("❌ Не найдено файлов .txt для обработки")
        sys.exit(1)

    print(f"📁 Найдено {len(files)} файлов для обработки")
    
    # Синхронизируем только кассовые операции
    print("💰 Синхронизация кассовых операций...")
    success = sync_cash_transactions(files)
    
    if success:
        print("✅ Кассовые операции успешно синхронизированы!")
        print("\n💡 Теперь все кассовые операции доступны в Supabase")
        print("   - Проверьте таблицу 'transactions'")
        print("   - Фильтруйте по 'category = Касса'")
        print("   - Или по 'payer_account/receiver_account = CASH'")
    else:
        print("❌ Ошибка при синхронизации кассовых операций")
        sys.exit(1)

if __name__ == "__main__":
    main()
