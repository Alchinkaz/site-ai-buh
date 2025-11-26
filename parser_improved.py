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
    "РасчСчет",  # Расчетный счет (используется в Форте банке)
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
    # Для Форте банка используем РасчСчет, если он есть
    rasch_schet = record.get("РасчСчет", "").strip()
    
    # Если есть РасчСчет, используем его как основной счет
    if rasch_schet:
        # Для Форте банка: РасчСчет - это наш счет
        payer_iik = rasch_schet.replace(" ", "").upper()
        receiver_iik = record.get("ПолучательИИК", "").strip().replace(" ", "").upper()
        # Если получатель не указан, используем РасчСчет и для получателя
        if not receiver_iik:
            receiver_iik = payer_iik
    else:
        # Стандартная логика для других банков
        payer_iik = record.get("ПлательщикИИК", "").strip()
        receiver_iik = record.get("ПолучательИИК", "").strip()
    
    doc_type = (record.get("ВидДокумента", "") or "").lower()
    payment_purpose = (record.get("НазначениеПлатежа", "") or "").lower()
    
    # Нормализуем ИИК (убираем пробелы, приводим к верхнему регистру)
    payer_iik = payer_iik.replace(" ", "").upper()
    receiver_iik = receiver_iik.replace(" ", "").upper()
    
    # Нормализуем наши счета
    our_accounts_normalized = [acc.replace(" ", "").upper() for acc in OUR_ACCOUNTS]
    
    # Если есть РасчСчет, то это наш счет (для Форте банка)
    if rasch_schet:
        payer_is_ours = True  # РасчСчет всегда наш счет
        receiver_is_ours = receiver_iik in our_accounts_normalized if receiver_iik else False
    else:
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

def detect_bank_by_iik(iik: str) -> tuple[str, str]:
    """
    Определяет банк и тип счета по ИИК (IBAN)
    Возвращает (bank_name, account_type)
    """
    if not iik:
        return ("Неизвестно", "other")
    
    iik_clean = iik.replace(" ", "").upper()
    
    # Определение банка по префиксу ИИК
    bank_mapping = {
        "KZ877": ("Kaspi Bank", "bank"),
        "KZ887": ("Kaspi Pay", "kaspi"),
        "KZ949": ("Forte Bank", "bank"),
        "KZ086": ("Halyk Bank", "bank"),
        "KZ209": ("Forte Bank", "bank"),
        "KZ119": ("Forte Bank", "bank"),
        "CASH": ("Cash Desk", "cash"),
    }
    
    # Проверяем по первым 5 символам
    for prefix, (bank_name, account_type) in bank_mapping.items():
        if iik_clean.startswith(prefix):
            return (bank_name, account_type)
    
    return ("Неизвестный банк", "other")

def ensure_account_exists(iik: str, supabase, company_id: Optional[str] = None, seen_iiks: Optional[set] = None) -> bool:
    """
    Проверяет существование счета по ИИК и создает его, если не существует.
    Возвращает True, если счет существует или был создан успешно.
    
    Args:
        iik: Номер счета (ИИК)
        supabase: Клиент Supabase
        company_id: ID компании
        seen_iiks: Множество уже обработанных ИИК для избежания повторных проверок
    """
    if not iik or not iik.strip():
        return False
    
    if iik.upper() == CASH_ACCOUNT:
        return True  # Касса уже должна существовать
    
    try:
        # Нормализуем ИИК
        iik_clean = iik.replace(" ", "").upper()
        
        # Используем кэш обработанных ИИК для избежания повторных проверок
        if seen_iiks is not None:
            if iik_clean in seen_iiks:
                return True  # Уже обработан в этой сессии
            seen_iiks.add(iik_clean)
        
        # Проверяем, существует ли счет в базе данных
        existing = None
        is_new_account = True
        if company_id:
            existing = supabase.table("accounts").select("id").eq("company_id", company_id).eq("account_number", iik_clean).execute()
            if existing.data:
                is_new_account = False
                return True  # Счет уже существует в базе
        
        # Определяем банк и тип счета
        bank_name, account_type = detect_bank_by_iik(iik_clean)
        
        # Проверяем, является ли это нашим счетом
        is_our_account = iik_clean in [acc.replace(" ", "").upper() for acc in OUR_ACCOUNTS]
        
        # Создаем счет
        account_data = {
            "company_id": company_id,
            "account_number": iik_clean,
            "bank_name": bank_name,
            "account_type": account_type,
            "is_our_account": is_our_account,
        }
        
        # Используем upsert для избежания дубликатов (уникальный индекс на company_id, account_number)
        result = supabase.table("accounts").upsert(
            account_data,
            on_conflict="company_id,account_number"
        ).execute()
        
        if result.data:
            # Выводим сообщение только для новых счетов
            if is_new_account:
                print(f"✅ Создан счет: {iik_clean} ({bank_name})")
            return True
        else:
            print(f"⚠️ Не удалось создать счет: {iik_clean}")
            return False
            
    except Exception as e:
        # Если ошибка связана с дубликатом - это нормально, счет уже существует
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            return True
        print(f"❌ Ошибка при создании счета {iik}: {e}")
        return False

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
        
        # Собираем все уникальные ИИК из транзакций для автоматического создания счетов
        unique_iiks = set()
        for transaction in transactions:
            # Для Форте банка используем РасчСчет
            rasch_schet = transaction.get("РасчСчет", "").strip()
            payer_iik = transaction.get("ПлательщикИИК", "").strip()
            receiver_iik = transaction.get("ПолучательИИК", "").strip()
            from_account = transaction.get("СчетОткуда", "").strip()
            to_account = transaction.get("СчетКуда", "").strip()
            account = transaction.get("Счет", "").strip()
            
            accounts_list = [payer_iik, receiver_iik, from_account, to_account, account]
            if rasch_schet:
                accounts_list.append(rasch_schet)
            
            for iik in accounts_list:
                if iik and iik.upper() != CASH_ACCOUNT:
                    unique_iiks.add(iik.replace(" ", "").upper())
        
        # Автоматически создаем все счета, которых еще нет
        # Используем кэш для избежания повторных проверок
        seen_iiks = set()
        print(f"📋 Проверяю и создаю {len(unique_iiks)} уникальных счетов...")
        for iik in unique_iiks:
            ensure_account_exists(iik, supabase, company_id, seen_iiks)
        
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

def sync_cash_transactions(file_paths: List[str]) -> bool:
    """Специальная синхронизация кассовых операций"""
    try:
        supabase = get_supabase_client()
        
        # Получаем ID нашей компании
        company_result = supabase.table("companies").select("id").eq("name", COMPANY_NAME).execute()
        if not company_result.data:
            print(f"❌ Компания {COMPANY_NAME} не найдена в базе данных")
            return False
        
        company_id = company_result.data[0]["id"]
        
        # Парсим файлы
        records = parse_1c_files_improved(file_paths)
        if not records:
            print("ℹ️ Нет файлов для обработки")
            return False
        
        # Фильтруем только кассовые операции
        cash_records = []
        for record in records:
            doc_type = (record.get("ВидДокумента", "") or "").lower()
            payment_purpose = (record.get("НазначениеПлатежа", "") or "").lower()
            counterparty = (record.get("Контрагент", "") or "").lower()
            
            # Проверяем, является ли операция кассовой
            is_cash = any(kw in doc_type for kw in CASH_KEYWORDS) or \
                     any(kw in payment_purpose for kw in CASH_KEYWORDS) or \
                     any(kw in counterparty for kw in CASH_KEYWORDS)
            
            if is_cash:
                cash_records.append(record)
        
        if not cash_records:
            print("ℹ️ Кассовые операции не найдены")
            return False
        
        print(f"💰 Найдено {len(cash_records)} кассовых операций")
        
        # Подготавливаем данные для вставки
        db_transactions = []
        for transaction in cash_records:
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
            
            # Определяем тип кассовой операции
            if amount_expense > 0 and amount_income == 0:
                transaction_type = "expense"
                counterparty = transaction.get("ПолучательНаименование", "") or "Кассовый расход"
            elif amount_income > 0 and amount_expense == 0:
                transaction_type = "income"
                counterparty = transaction.get("ПлательщикНаименование", "") or "Кассовый приход"
            else:
                continue  # Пропускаем неопределенные операции
            
            db_transaction = {
                "company_id": company_id,
                "transaction_type": transaction_type,
                "operation_date": operation_date.isoformat() if operation_date else None,
                "document_date": None,
                "document_number": transaction.get("НомерДокумента", ""),
                "document_type": transaction.get("ВидДокумента", ""),
                "amount_expense": float(amount_expense),
                "amount_income": float(amount_income),
                "payer_account": CASH_ACCOUNT if transaction_type == "expense" else "",
                "receiver_account": CASH_ACCOUNT if transaction_type == "income" else "",
                "from_account": "",
                "to_account": "",
                "payer_name": transaction.get("ПлательщикНаименование", ""),
                "receiver_name": transaction.get("ПолучательНаименование", ""),
                "payer_bin_iin": "",
                "receiver_bin_iin": "",
                "payment_purpose": transaction.get("НазначениеПлатежа", ""),
                "payment_code": transaction.get("КодНазначенияПлатежа", ""),
                "counterparty": counterparty,
                "category": "Касса",
            }
            
            # Стабильный хеш для кассовых операций
            hash_source_parts = [
                str(company_id),
                "cash",
                str(db_transaction.get("operation_date", "")),
                str(db_transaction.get("document_number", "")).strip(),
                str(db_transaction.get("amount_expense", 0.0)),
                str(db_transaction.get("amount_income", 0.0)),
                str(db_transaction.get("counterparty", "")).strip().lower(),
            ]
            hash_source = "|".join(hash_source_parts)
            transaction_hash = hashlib.sha256(hash_source.encode("utf-8")).hexdigest()
            db_transaction["transaction_hash"] = transaction_hash
            
            db_transactions.append(db_transaction)
        
        if not db_transactions:
            print("❌ Нет валидных кассовых транзакций для сохранения")
            return False
        
        # Идемпотентная синхронизация кассовых операций
        result = (
            supabase
            .table("transactions")
            .upsert(db_transactions, on_conflict="company_id,transaction_hash")
            .select("*")
            .execute()
        )
        
        if getattr(result, "data", None) is not None:
            saved = len(result.data)
            print(f"✅ Успешно синхронизировано {saved} кассовых операций с базой данных")
            return True
        else:
            print(f"❌ Ошибка при сохранении кассовых операций: {getattr(result, 'error', 'unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка при синхронизации кассовых операций: {e}")
        return False
            
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

def parse_1c_files_improved(file_paths: List[str], auto_create_accounts: bool = True) -> List[Dict[str, str]]:
    """Улучшенная функция парсинга файлов 1C
    
    Args:
        file_paths: Список путей к файлам для парсинга
        auto_create_accounts: Автоматически создавать счета при парсинге (по умолчанию True)
    """
    all_records = []
    
    # Кэш для обработанных ИИК, чтобы избежать повторных проверок
    seen_iiks = set()
    
    # Получаем company_id для автоматического создания счетов
    company_id = None
    supabase = None
    if auto_create_accounts:
        try:
            supabase = get_supabase_client()
            company_result = supabase.table("companies").select("id").eq("name", COMPANY_NAME).execute()
            if company_result.data:
                company_id = company_result.data[0]["id"]
        except Exception as e:
            print(f"⚠️ Не удалось подключиться к Supabase для автосоздания счетов: {e}")
            auto_create_accounts = False

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
            
            # Автоматически создаем счета, если они не существуют
            if auto_create_accounts and supabase and company_id:
                # Для Форте банка используем РасчСчет
                rasch_schet = record.get("РасчСчет", "").strip()
                payer_iik = record.get("ПлательщикИИК", "").strip()
                receiver_iik = record.get("ПолучательИИК", "").strip()
                from_account = transaction_info.get("СчетОткуда", "").strip()
                to_account = transaction_info.get("СчетКуда", "").strip()
                account = transaction_info.get("Счет", "").strip()
                
                # Если есть РасчСчет, добавляем его в список для создания
                accounts_to_create = [payer_iik, receiver_iik, from_account, to_account, account]
                if rasch_schet:
                    accounts_to_create.append(rasch_schet)
                
                # Создаем все найденные счета (используем кэш для избежания дубликатов)
                for iik in accounts_to_create:
                    if iik:
                        ensure_account_exists(iik, supabase, company_id, seen_iiks)
            
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
        # Синхронизируем кассовые операции
        print("💰 Синхронизация кассовых операций...")
        cash_success = sync_cash_transactions(files)
        
        # Синхронизируем все остальные транзакции
        print("💾 Синхронизация всех транзакций...")
        all_success = save_transactions_to_database(records)
        
        if cash_success or all_success:
            print("✅ Синхронизация завершена!")
            
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
            print("❌ Ошибка при синхронизации транзакций")
    else:
        print("❌ Не найдено валидных операций для сохранения")
