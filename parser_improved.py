import os
import re
import chardet
from typing import List, Dict, Optional
from datetime import datetime
from supabase_config import get_supabase_client, test_connection
from decimal import Decimal
import hashlib

# 🔧 Наша компания
COMPANY_NAME = "ALCHIN"

# 🔧 Наши счета (ИИК) - расширенный список
OUR_ACCOUNTS = [
    "KZ87722C000022014099",  # Kaspi Bank
    "KZ88722S000040014444",  # Kaspi Pay
    "KZ9496511F0008314291",  # ForteBank
    # Добавляем другие возможные форматы счетов
    "KZ87722C000022014099",  # Kaspi Bank (дубликат для надежности)
    "KZ88722S000040014444",  # Kaspi Pay (дубликат для надежности)
]

# 🔧 Псевдо-счет для наличной кассы
CASH_ACCOUNT = "CASH"

# Ключевые слова для определения операций наличной кассы
CASH_KEYWORDS = [
    "касса",      # рус
    "налич",      # наличные/наличный/наличка
    "cash",       # en
]

# 🔧 Ключи, которые парсим - расширенный список
FIELDS = [
    "ПолучательНаименование",
    "ПлательщикНаименование", 
    "ПлательщикБИН_ИИН",
    "ПолучательБИН_ИИН",
    "ПлательщикИИК",
    "ПолучательИИК",
    "НомерДокумента",
    "ДатаОперации",
    "ДатаДокумента",  # Добавляем дату документа
    "СуммаРасход",
    "СуммаПриход",
    "Сумма",  # Общая сумма
    "НазначениеПлатежа",
    "ВидДокумента",  # Тип документа
    "КодНазначенияПлатежа",  # Код назначения
]

def detect_encoding(filepath: str) -> str:
    """Определяем кодировку файла с улучшенной логикой"""
    try:
        with open(filepath, "rb") as f:
            raw = f.read(4096)  # Увеличиваем размер для лучшего определения
        result = chardet.detect(raw)
        
        # Проверяем уверенность определения
        if result["confidence"] > 0.7:
            return result["encoding"] or "utf-8"
        else:
            # Если уверенность низкая, пробуем стандартные кодировки
            for encoding in ["utf-8", "cp1251", "windows-1251", "iso-8859-1"]:
                try:
                    with open(filepath, "r", encoding=encoding) as f:
                        f.read(1024)
                    return encoding
                except:
                    continue
            return "utf-8"
    except Exception as e:
        print(f"Ошибка определения кодировки: {e}")
        return "utf-8"

def normalize_field_name(field_name: str) -> str:
    """Нормализует название поля"""
    # Убираем лишние пробелы и приводим к стандартному виду
    field_name = field_name.strip()
    
    # Маппинг альтернативных названий полей
    field_mapping = {
        "ПолучательНаименование": "ПолучательНаименование",
        "ПлательщикНаименование": "ПлательщикНаименование",
        "ПлательщикБИН_ИИН": "ПлательщикБИН_ИИН",
        "ПолучательБИН_ИИН": "ПолучательБИН_ИИН",
        "ПлательщикИИК": "ПлательщикИИК",
        "ПолучательИИК": "ПолучательИИК",
        "НомерДокумента": "НомерДокумента",
        "ДатаОперации": "ДатаОперации",
        "ДатаДокумента": "ДатаДокумента",
        "СуммаРасход": "СуммаРасход",
        "СуммаПриход": "СуммаПриход",
        "Сумма": "Сумма",
        "НазначениеПлатежа": "НазначениеПлатежа",
        "ВидДокумента": "ВидДокумента",
        "КодНазначенияПлатежа": "КодНазначенияПлатежа",
    }
    
    return field_mapping.get(field_name, field_name)

def extract_field_value(text: str, field_name: str) -> Optional[str]:
    """Извлекает значение поля из текста с улучшенной логикой"""
    # Создаем различные варианты поиска
    patterns = [
        rf"{re.escape(field_name)}\s*=\s*(.+)",
        rf"{re.escape(field_name)}\s*:\s*(.+)",
        rf"{re.escape(field_name)}\s+(.+)",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            value = match.group(1).strip()
            # Очищаем значение от лишних символов
            value = re.sub(r'[^\w\sА-Яа-я.,-]', '', value)
            return value
    
    return None

def parse_date(date_str: str) -> Optional[str]:
    """Парсит дату в различных форматах"""
    if not date_str:
        return None
    
    # Убираем лишние символы
    date_str = re.sub(r'[^\d./-]', '', date_str)
    
    # Различные форматы дат
    date_formats = [
        r"(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})",
        r"(\d{2,4})[./-](\d{1,2})[./-](\d{1,2})",
    ]
    
    for pattern in date_formats:
        match = re.match(pattern, date_str)
        if match:
            day, month, year = match.groups()
            
            # Нормализуем год
            if len(year) == 2:
                year = "20" + year if int(year) < 50 else "19" + year
            
            # Нормализуем день и месяц
            day = day.zfill(2)
            month = month.zfill(2)
            
            try:
                # Проверяем валидность даты
                datetime(int(year), int(month), int(day))
                return f"{day}.{month}.{year}"
            except ValueError:
                continue
    
    return date_str  # Возвращаем исходную строку если не удалось распарсить

def determine_transaction_type(record: Dict[str, str]) -> Dict[str, str]:
    """Определяет тип транзакции с улучшенной логикой"""
    payer_iik = record.get("ПлательщикИИК", "").strip()
    receiver_iik = record.get("ПолучательИИК", "").strip()
    doc_type = (record.get("ВидДокумента", "") or "").lower()
    payment_purpose = (record.get("НазначениеПлатежа", "") or "").lower()
    
    # Нормализуем ИИК (убираем пробелы, приводим к верхнему регистру)
    payer_iik = payer_iik.replace(" ", "").upper()
    receiver_iik = receiver_iik.replace(" ", "").upper()
    
    # Нормализуем наши счета
    our_accounts_normalized = [acc.replace(" ", "").upper() for acc in OUR_ACCOUNTS]
    
    payer_is_ours = payer_iik in our_accounts_normalized
    receiver_is_ours = receiver_iik in our_accounts_normalized
    
    result = {
        "ТипТранзакции": "",
        "СчетОткуда": "",
        "СчетКуда": "",
        "Счет": "",
        "Контрагент": "",
        "Категория": "",
    }
    
    # 1) Переводы между своими банковскими счетами
    if payer_is_ours and receiver_is_ours:
        # Перевод между своими счетами
        result["ТипТранзакции"] = "transfer"
        result["СчетОткуда"] = payer_iik
        result["СчетКуда"] = receiver_iik
        result["Контрагент"] = "Перевод между своими счетами"
        result["Категория"] = "Перевод"
    # 2) Банковский расход
    elif payer_is_ours:
        # Расход
        result["ТипТранзакции"] = "expense"
        result["Счет"] = payer_iik
        result["Контрагент"] = record.get("ПолучательНаименование", "")
        result["Категория"] = "Расход"
    # 3) Банковский доход
    elif receiver_is_ours:
        # Доход
        result["ТипТранзакции"] = "income"
        result["Счет"] = receiver_iik
        result["Контрагент"] = record.get("ПлательщикНаименование", "")
        result["Категория"] = "Доход"
    else:
        # 4) НАЛИЧНАЯ КАССА: если не нашли наши банковские ИИК, но по тексту видно, что операция кассовая
        is_cash_related = any(kw in doc_type for kw in CASH_KEYWORDS) or any(kw in payment_purpose for kw in CASH_KEYWORDS)

        if is_cash_related:
            # Определяем направление по суммам
            expense_exists = bool(record.get("СуммаРасход"))
            income_exists = bool(record.get("СуммаПриход"))

            if expense_exists and not income_exists:
                result["ТипТранзакции"] = "expense"
                result["Счет"] = CASH_ACCOUNT
                result["Контрагент"] = record.get("ПолучательНаименование", "") or "Наличные расход"
                result["Категория"] = "Расход"
            elif income_exists and not expense_exists:
                result["ТипТранзакции"] = "income"
                result["Счет"] = CASH_ACCOUNT
                result["Контрагент"] = record.get("ПлательщикНаименование", "") or "Наличные приход"
                result["Категория"] = "Доход"
            else:
                # Если обе суммы или ни одной — оставляем неопределенной, пусть отфильтруется валидатором
                pass
    
    return result

def save_transactions_to_database(transactions: List[Dict[str, str]]) -> bool:
    """Сохраняет транзакции в базу данных Supabase"""
    try:
        supabase = get_supabase_client()
        
        # Получаем ID нашей компании
        company_result = supabase.table("companies").select("id").eq("name", COMPANY_NAME).execute()
        if not company_result.data:
            print(f"❌ Компания {COMPANY_NAME} не найдена в базе данных")
            return False
        
        company_id = company_result.data[0]["id"]
        
        # Подготавливаем данные для вставки/синхронизации
        db_transactions = []
        for transaction in transactions:
            # Конвертируем дату
            operation_date = None
            if transaction.get("ДатаОперации"):
                try:
                    operation_date = datetime.strptime(transaction["ДатаОперации"], "%d.%m.%Y").date()
                except:
                    try:
                        operation_date = datetime.strptime(transaction["ДатаОперации"], "%Y-%m-%d").date()
                    except:
                        print(f"⚠️ Не удалось распарсить дату: {transaction['ДатаОперации']}")
                        continue
            
            document_date = None
            if transaction.get("ДатаДокумента"):
                try:
                    document_date = datetime.strptime(transaction["ДатаДокумента"], "%d.%m.%Y").date()
                except:
                    try:
                        document_date = datetime.strptime(transaction["ДатаДокумента"], "%Y-%m-%d").date()
                    except:
                        pass
            
            # Конвертируем суммы
            amount_expense = Decimal(0)
            amount_income = Decimal(0)
            
            if transaction.get("СуммаРасход"):
                try:
                    amount_expense = Decimal(str(transaction["СуммаРасход"]).replace(",", "."))
                except:
                    pass
            
            if transaction.get("СуммаПриход"):
                try:
                    amount_income = Decimal(str(transaction["СуммаПриход"]).replace(",", "."))
                except:
                    pass
            
            # Если есть общая сумма, но нет конкретных расходов/доходов
            if transaction.get("Сумма") and amount_expense == 0 and amount_income == 0:
                try:
                    amount = Decimal(str(transaction["Сумма"]).replace(",", "."))
                    if transaction.get("ТипТранзакции") == "expense":
                        amount_expense = amount
                    elif transaction.get("ТипТранзакции") == "income":
                        amount_income = amount
                except:
                    pass
            
            db_transaction = {
                "company_id": company_id,
                "transaction_type": transaction.get("ТипТранзакции", ""),
                "operation_date": operation_date.isoformat() if operation_date else None,
                "document_date": document_date.isoformat() if document_date else None,
                "document_number": transaction.get("НомерДокумента", ""),
                "document_type": transaction.get("ВидДокумента", ""),
                "amount_expense": float(amount_expense),
                "amount_income": float(amount_income),
                # Если операция кассовая, фиксируем счет как CASH
                "payer_account": (CASH_ACCOUNT if (transaction.get("ТипТранзакции") == "expense" and transaction.get("Счет") == CASH_ACCOUNT) else transaction.get("ПлательщикИИК", "")),
                "receiver_account": (CASH_ACCOUNT if (transaction.get("ТипТранзакции") == "income" and transaction.get("Счет") == CASH_ACCOUNT) else transaction.get("ПолучательИИК", "")),
                "from_account": transaction.get("СчетОткуда", ""),
                "to_account": transaction.get("СчетКуда", ""),
                "payer_name": transaction.get("ПлательщикНаименование", ""),
                "receiver_name": transaction.get("ПолучательНаименование", ""),
                "payer_bin_iin": transaction.get("ПлательщикБИН_ИИН", ""),
                "receiver_bin_iin": transaction.get("ПолучательБИН_ИИН", ""),
                "payment_purpose": transaction.get("НазначениеПлатежа", ""),
                "payment_code": transaction.get("КодНазначенияПлатежа", ""),
                "counterparty": transaction.get("Контрагент", ""),
                "category": transaction.get("Категория", ""),
            }

            # Стабильный хеш транзакции для идемпотентной синхронизации
            hash_source_parts = [
                str(company_id),
                str(db_transaction.get("transaction_type", "")).strip().lower(),
                str(db_transaction.get("operation_date", "")),
                str(db_transaction.get("document_date", "")),
                str(db_transaction.get("document_number", "")).strip(),
                str(db_transaction.get("amount_expense", 0.0)),
                str(db_transaction.get("amount_income", 0.0)),
                str(db_transaction.get("payer_account", "")).replace(" ", "").upper(),
                str(db_transaction.get("receiver_account", "")).replace(" ", "").upper(),
                str(db_transaction.get("from_account", "")).replace(" ", "").upper(),
                str(db_transaction.get("to_account", "")).replace(" ", "").upper(),
                str(db_transaction.get("counterparty", "")).strip().lower(),
            ]
            hash_source = "|".join(hash_source_parts)
            transaction_hash = hashlib.sha256(hash_source.encode("utf-8")).hexdigest()
            db_transaction["transaction_hash"] = transaction_hash
            
            db_transactions.append(db_transaction)
        
        if not db_transactions:
            print("❌ Нет валидных транзакций для сохранения")
            return False
        
        # Идемпотентная синхронизация по (company_id, transaction_hash)
        # Важно: должен существовать unique index на (company_id, transaction_hash)
        result = (
            supabase
            .table("transactions")
            .upsert(db_transactions, on_conflict="company_id,transaction_hash")
            .select("*")
            .execute()
        )
        
        if getattr(result, "data", None) is not None:
            saved = len(result.data)
            print(f"✅ Успешно синхронизировано {saved} транзакций с базой данных")
            return True
        else:
            print(f"❌ Ошибка при сохранении транзакций: {getattr(result, 'error', 'unknown error')}")
            return False

    except Exception as e:
        print(f"❌ Ошибка при сохранении в базу данных: {e}")
        return False

def sync_transactions(file_paths: List[str]) -> bool:
    """Высокоуровневая синхронизация: парсит файлы и делает upsert в БД"""
    records = parse_1c_files_improved(file_paths)
    if not records:
        print("ℹ️ Нет валидных операций для синхронизации")
        return False
    return save_transactions_to_database(records)
            
    except Exception as e:
        print(f"❌ Ошибка при сохранении в базу данных: {e}")
        return False

def get_transaction_statistics(start_date: str = None, end_date: str = None) -> Dict:
    """Получает статистику транзакций из базы данных"""
    try:
        supabase = get_supabase_client()
        
        # Получаем ID нашей компании
        company_result = supabase.table("companies").select("id").eq("name", COMPANY_NAME).execute()
        if not company_result.data:
            return {"error": f"Компания {COMPANY_NAME} не найдена"}
        
        company_id = company_result.data[0]["id"]
        
        # Вызываем функцию статистики
        result = supabase.rpc("get_transaction_stats", {
            "company_uuid": company_id,
            "start_date": start_date,
            "end_date": end_date
        }).execute()
        
        if result.data:
            return result.data[0]
        else:
            return {"error": "Не удалось получить статистику"}
            
    except Exception as e:
        return {"error": f"Ошибка при получении статистики: {e}"}

def get_recent_transactions(limit: int = 10) -> List[Dict]:
    """Получает последние транзакции из базы данных"""
    try:
        supabase = get_supabase_client()
        
        # Получаем ID нашей компании
        company_result = supabase.table("companies").select("id").eq("name", COMPANY_NAME).execute()
        if not company_result.data:
            return []
        
        company_id = company_result.data[0]["id"]
        
        # Получаем последние транзакции
        result = supabase.table("transactions")\
            .select("*")\
            .eq("company_id", company_id)\
            .order("operation_date", desc=True)\
            .limit(limit)\
            .execute()
        
        return result.data if result.data else []
        
    except Exception as e:
        print(f"❌ Ошибка при получении транзакций: {e}")
        return []

def validate_record(record: Dict[str, str]) -> bool:
    """Валидирует запись транзакции"""
    # Проверяем обязательные поля
    required_fields = ["ДатаОперации"]
    
    for field in required_fields:
        if not record.get(field):
            return False
    
    # Проверяем, что есть хотя бы одна сумма
    has_amount = any(record.get(field) for field in ["СуммаРасход", "СуммаПриход", "Сумма"])
    if not has_amount:
        return False
    
    # Проверяем валидность даты
    date = parse_date(record.get("ДатаОперации", ""))
    if not date:
        return False
    
    return True

def parse_1c_files_improved(file_paths: List[str]) -> List[Dict[str, str]]:
    """Улучшенная функция парсинга файлов 1C"""
    all_records = []
    
    for file_path in file_paths:
        if not os.path.exists(file_path):
            print(f"Файл не найден: {file_path}")
            continue
        
        try:
            encoding = detect_encoding(file_path)
            with open(file_path, "r", encoding=encoding, errors="ignore") as f:
                text = f.read()
        except Exception as e:
            print(f"Ошибка чтения файла {file_path}: {e}")
            continue
        
        # Унификация ключей - улучшенная логика
        text = re.sub(r"([А-ЯA-Z_]+)=", lambda m: m.group(1).capitalize() + "=", text)
        
        # Разделяем на документы - улучшенная логика
        doc_patterns = [
            r"СекцияДокумент=.*?\n",
            r"Документ=.*?\n",
            r"Операция=.*?\n",
        ]
        
        docs = [text]  # Начинаем с полного текста
        for pattern in doc_patterns:
            new_docs = []
            for doc in docs:
                parts = re.split(pattern, doc, flags=re.IGNORECASE)
                new_docs.extend(parts)
            docs = new_docs
        
        for doc in docs:
            if not doc.strip():
                continue
            
            record = {}
            
            # Извлекаем поля с улучшенной логикой
            for field in FIELDS:
                value = extract_field_value(doc, field)
                if value:
                    record[field] = value
            
            # Пропускаем записи без даты операции
            if "ДатаОперации" not in record:
                continue
            
            # Нормализуем дату
            record["ДатаОперации"] = parse_date(record["ДатаОперации"]) or record["ДатаОперации"]
            
            # Убираем лишнюю строку "Сумма" при наличии СуммаРасход/СуммаПриход
            if "Сумма" in record and ("СуммаРасход" in record or "СуммаПриход" in record):
                record.pop("Сумма", None)
            
            # Определяем тип транзакции
            transaction_info = determine_transaction_type(record)
            
            # Пропускаем операции, не связанные с нашими счетами
            if not transaction_info["ТипТранзакции"]:
                continue
            
            # Валидируем запись
            if not validate_record(record):
                continue
            
            # Формируем финальную запись
            final_record = {
                **{f: record.get(f, "") for f in FIELDS},
                **transaction_info,
            }
            
            all_records.append(final_record)
    
    # Убираем дубли - улучшенная логика
    unique_records = []
    seen = set()
    
    for rec in all_records:
        # Создаем более точный ключ для определения дублей
        key = (
            rec.get("ДатаОперации", ""),
            rec.get("СуммаРасход", "") or rec.get("СуммаПриход", ""),
            rec.get("ТипТранзакции", ""),
            rec.get("Контрагент", ""),
            rec.get("НомерДокумента", ""),
        )
        
        if key not in seen:
            seen.add(key)
            unique_records.append(rec)
    
    return unique_records

# Обратная совместимость
def parse_1c_files(file_paths: List[str]) -> List[Dict[str, str]]:
    """Оригинальная функция для обратной совместимости"""
    return parse_1c_files_improved(file_paths)

# ✅ Пример использования
if __name__ == "__main__":
    # Проверяем подключение к Supabase
    print("🔌 Проверка подключения к Supabase...")
    if not test_connection():
        print("❌ Не удалось подключиться к Supabase. Проверьте настройки.")
        exit(1)
    
    folder = "."
    files = [os.path.join(folder, f) for f in os.listdir(folder) if f.endswith(".txt")]

    if not files:
        print("❌ Не найдено файлов .txt для обработки")
        exit(1)

    print(f"📁 Найдено {len(files)} файлов для обработки")
    
    # Парсим файлы
    records = parse_1c_files_improved(files)
    print(f"✅ Найдено {len(records)} операций")

    if records:
        # Сохраняем в базу данных
        print("💾 Сохранение транзакций в базу данных...")
        if save_transactions_to_database(records):
            print("✅ Транзакции успешно сохранены!")
            
            # Получаем статистику
            print("\n📊 Статистика транзакций:")
            stats = get_transaction_statistics()
            if "error" not in stats:
                print(f"💰 Общий доход: {stats['total_income']:.2f}")
                print(f"💸 Общий расход: {stats['total_expense']:.2f}")
                print(f"📈 Чистая прибыль: {stats['net_amount']:.2f}")
                print(f"📋 Количество транзакций: {stats['transaction_count']}")
            else:
                print(f"❌ Ошибка получения статистики: {stats['error']}")
            
            # Показываем последние транзакции
            print("\n🔄 Последние 5 транзакций:")
            recent = get_recent_transactions(5)
            for i, t in enumerate(recent, 1):
                print(f"{i}. {t['operation_date']} - {t['transaction_type']} - {t['amount_total']} - {t['counterparty']}")
        else:
            print("❌ Ошибка при сохранении транзакций")
    else:
        print("❌ Не найдено валидных операций для сохранения")
