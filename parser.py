import os
import re
import chardet
from typing import List, Dict

# 🔧 Наша компания
COMPANY_NAME = "ALCHIN"

# 🔧 Номера наших счетов (ИИК)
OUR_ACCOUNTS = [
    "KZ87722C000022014099",  # Kaspi Bank
    "KZ88722S000040014444",  # Kaspi Pay
    # Добавьте другие номера счетов по мере необходимости
]

# 🔧 Ключи, которые нужно парсить
FIELDS = [
    "ПолучательНаименование",
    "ПлательщикНаименование",
    "ПлательщикБИН_ИИН",
    "ПолучательБИН_ИИН",
    "ПлательщикИИК",
    "ПолучательИИК",
    "НомерДокумента",
    "ДатаОперации",
    "СуммаРасход",
    "СуммаПриход",
    "НазначениеПлатежа"
]


def detect_encoding(filepath: str) -> str:
    """Определяем кодировку файла"""
    with open(filepath, "rb") as f:
        raw = f.read(2048)
    result = chardet.detect(raw)
    return result["encoding"] or "utf-8"


def determine_transaction_type(payer_iik: str, receiver_iik: str) -> str:
    """
    Определяет тип транзакции на основе ИИК плательщика и получателя
    
    Args:
        payer_iik: ИИК плательщика
        receiver_iik: ИИК получателя
    
    Returns:
        'transfer' - если оба ИИК наши счета
        'expense' - если плательщик наш счет
        'income' - если получатель наш счет
        'unknown' - если ни один ИИК не наш
    """
    payer_is_ours = payer_iik in OUR_ACCOUNTS
    receiver_is_ours = receiver_iik in OUR_ACCOUNTS
    
    if payer_is_ours and receiver_is_ours:
        return 'transfer'  # Перевод между нашими счетами
    elif payer_is_ours:
        return 'expense'   # Мы платим (расход)
    elif receiver_is_ours:
        return 'income'    # Нам платят (доход)
    else:
        return 'unknown'   # Не наша транзакция


def parse_1c_files(file_paths: List[str]) -> List[Dict[str, str]]:
    """
    Парсит список файлов формата 1CClientBankExchange
    Возвращает список словарей с ключами из FIELDS
    """
    all_records = []

    for file_path in file_paths:
        encoding = detect_encoding(file_path)
        with open(file_path, "r", encoding=encoding, errors="ignore") as f:
            text = f.read()

        # Унификация регистра ключей
        text = re.sub(r'([А-ЯA-Z_]+)=', lambda m: m.group(1).capitalize() + '=', text)

        # Разделяем по блокам документов
        docs = re.split(r"СекцияДокумент=.*?\n", text, flags=re.IGNORECASE)

        for doc in docs:
            record = {}

            # Пропускаем пустые блоки
            if not doc.strip():
                continue

            # Вытаскиваем ключи
            for field in FIELDS + ["Сумма"]:
                # Найдём "Ключ=Значение"
                match = re.search(rf"{field}\s*=\s*(.+)", doc, flags=re.IGNORECASE)
                if match:
                    record[field] = match.group(1).strip()

            # Пропускаем, если нет даты (значит не документ)
            if "ДатаОперации" not in record:
                continue

            # Пропускаем, если есть только "Сумма=", а нет СуммаРасход/СуммаПриход (чтобы избежать дублей)
            if "Сумма" in record and ("СуммаРасход" in record or "СуммаПриход" in record):
                record.pop("Сумма", None)

            # Определяем тип транзакции на основе ИИК
            payer_iik = record.get("ПлательщикИИК", "").strip()
            receiver_iik = record.get("ПолучательИИК", "").strip()
            
            transaction_type = determine_transaction_type(payer_iik, receiver_iik)
            
            # Пропускаем транзакции, которые не относятся к нашим счетам
            if transaction_type == 'unknown':
                continue
            
            # Добавляем тип транзакции в запись
            record["ТипТранзакции"] = transaction_type
            
            # Для переводов между счетами добавляем дополнительную информацию
            if transaction_type == 'transfer':
                record["СчетОткуда"] = payer_iik
                record["СчетКуда"] = receiver_iik
                record["Контрагент"] = "Перевод между счетами"
            elif transaction_type == 'income':
                record["Счет"] = receiver_iik
                record["Контрагент"] = record.get("ПлательщикНаименование", "")
            elif transaction_type == 'expense':
                record["Счет"] = payer_iik
                record["Контрагент"] = record.get("ПолучательНаименование", "")

            # Добавляем запись
            all_records.append({k: record.get(k, "") for k in FIELDS + ["ТипТранзакции", "СчетОткуда", "СчетКуда", "Счет", "Контрагент"]})

    return all_records


# ✅ Пример использования
if __name__ == "__main__":
    # Путь к папке с файлами
    folder = "."
    files = [os.path.join(folder, f) for f in os.listdir(folder) if f.endswith(".txt")]

    records = parse_1c_files(files)

    # Вывод для проверки
    print(f"Найдено {len(records)} операций:")
    for r in records[:5]:
        print(f"Тип: {r.get('ТипТранзакции', 'неизвестно')}")
        print(f"Контрагент: {r.get('Контрагент', 'неизвестно')}")
        if r.get('ТипТранзакции') == 'transfer':
            print(f"Перевод: {r.get('СчетОткуда', '')} → {r.get('СчетКуда', '')}")
        else:
            print(f"Счет: {r.get('Счет', '')}")
        print(f"Сумма: {r.get('СуммаРасход', r.get('СуммаПриход', ''))}")
        print("---")

    # Пример подготовки к вставке в БД:
    # cursor.executemany(
    #     """INSERT INTO payments (
    #         receiver_name, payer_name, payer_bin, receiver_bin,
    #         operation_date, expense_sum, income_sum, payment_purpose
    #     ) VALUES (%(ПолучательНаименование)s, %(ПлательщикНаименование)s, %(ПлательщикБИН_ИИН)s,
    #               %(ПолучательБИН_ИИН)s, %(ДатаОперации)s, %(СуммаРасход)s,
    #               %(СуммаПриход)s, %(НазначениеПлатежа)s)""",
    #     records
    # )
