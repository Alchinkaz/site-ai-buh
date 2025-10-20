#!/usr/bin/env python3
"""
Тестовый скрипт для проверки подключения к Supabase
"""

from supabase_config import test_connection, get_supabase_client
from parser_improved import get_transaction_statistics, get_recent_transactions

def main():
    print("🧪 Тестирование подключения к Supabase...")
    print("=" * 50)
    
    # Тест 1: Проверка подключения
    print("1️⃣ Проверка подключения...")
    if test_connection():
        print("✅ Подключение успешно!")
    else:
        print("❌ Ошибка подключения!")
        return
    
    print("\n2️⃣ Проверка таблиц...")
    try:
        supabase = get_supabase_client()
        
        # Проверяем наличие таблиц
        tables = ["companies", "accounts", "categories", "transactions"]
        for table in tables:
            try:
                result = supabase.table(table).select("id").limit(1).execute()
                print(f"✅ Таблица {table} доступна")
            except Exception as e:
                print(f"❌ Ошибка доступа к таблице {table}: {e}")
    except Exception as e:
        print(f"❌ Ошибка при проверке таблиц: {e}")
        return
    
    print("\n3️⃣ Проверка статистики...")
    try:
        stats = get_transaction_statistics()
        if "error" in stats:
            print(f"⚠️ Статистика недоступна: {stats['error']}")
        else:
            print(f"✅ Статистика получена:")
            print(f"   💰 Доходы: {stats['total_income']}")
            print(f"   💸 Расходы: {stats['total_expense']}")
            print(f"   📈 Чистая прибыль: {stats['net_amount']}")
            print(f"   📋 Количество транзакций: {stats['transaction_count']}")
    except Exception as e:
        print(f"❌ Ошибка при получении статистики: {e}")
    
    print("\n4️⃣ Проверка последних транзакций...")
    try:
        recent = get_recent_transactions(3)
        if recent:
            print(f"✅ Найдено {len(recent)} последних транзакций:")
            for i, t in enumerate(recent, 1):
                print(f"   {i}. {t['operation_date']} - {t['transaction_type']} - {t['amount_total']}")
        else:
            print("ℹ️ Транзакции не найдены (это нормально для нового проекта)")
    except Exception as e:
        print(f"❌ Ошибка при получении транзакций: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Тестирование завершено!")

if __name__ == "__main__":
    main()
