"""
Конфигурация Supabase для AI Accountant
"""
import os
from supabase import create_client, Client

# Конфигурация Supabase
SUPABASE_URL = "https://aigrzflspieakaoaptml.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZ3J6ZmxzcGllYWthb2FwdG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMTM3MzUsImV4cCI6MjA3NTc4OTczNX0.0hxEz--8z9JfJVadJrb4HwS5wf9xoInEdPAjTycwcNQ"

# Создание клиента Supabase
def get_supabase_client() -> Client:
    """Возвращает настроенный клиент Supabase"""
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Настройки базы данных
DATABASE_CONFIG = {
    "transactions_table": "transactions",
    "accounts_table": "accounts",
    "categories_table": "categories",
    "companies_table": "companies"
}

# Функция для проверки подключения
def test_connection():
    """Тестирует подключение к Supabase"""
    try:
        supabase = get_supabase_client()
        # Простой запрос для проверки подключения
        result = supabase.table("transactions").select("id").limit(1).execute()
        print("✅ Подключение к Supabase успешно!")
        return True
    except Exception as e:
        print(f"❌ Ошибка подключения к Supabase: {e}")
        return False

if __name__ == "__main__":
    test_connection()
