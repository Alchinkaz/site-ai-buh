import os
import re
import chardet
from typing import List, Dict

# 🔧 Наша компания
COMPANY_NAME = "ALCHIN"

# 🔧 Наши счета (ИИК)
OUR_ACCOUNTS = [
    "KZ87722C000022014099",  # Kaspi Bank
    "KZ88722S000040014444",  # Kaspi Pay
    "KZ9496511F0008314291",  # ForteBank
    # можно добавлять новые
]

# 🔧 Ключи, которые нужно парсить из файла
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
    "НазначениеПлатежа",
]


def detect_encoding(filepath: str) -> str:
    """Определяем кодировку файла"""
    with open(filepath, "rb") as f:
        raw = f.read(2048)
    result = chardet.detect(raw)
    return result["encoding"] or "utf-8"


def determine_transaction_type(payer_iik: str, receiver_iik: str) -> str:
    """
    Определяет тип транзакции на основе ИИК плательщика и получателя:
      - transfer: оба ИИК наши счета
      - expense: плательщик наш счет
      - income: получатель наш счет
      - unknown: не наша операция
    """
    payer_is_ours = payer_iik in OUR_ACCOUNTS
    receiver_is_ours = receiver_iik in OUR_ACCOUNTS

    if payer_is_ours and receiver_is_ours:
        return "transfer"  # Перевод между своими счетами
    elif payer_is_ours:
        return "expense"   # Мы платим (расход)
    elif receiver_is_ours:
        return "income"    # Нам платят (доход)
    else:
        return "unknown"   # Не наши счета


def parse_1c_files(file_paths: List[str]) -> List[Dict[str, str]]:
    """
    Парсит список файлов формата 1CClientBankExchange.
    Возвращает список словарей с транзакциями (без дублей).
    """
    all_records = []

    for file_path in file_paths:
        encoding = detect_encoding(file_path)
        with open(file_path, "r", encoding=encoding, errors="ignore") as f:
            text = f.read()

        # Унификация регистра ключей (чтобы не было путаницы между А-Я и а-я)
        text = re.sub(r"([А-ЯA-Z_]+)=", lambda m: m.group(1).capitalize() + "=", text)

        # Разделяем по блокам документов
        docs = re.split(r"СекцияДокумент=.*?\n", text, flags=re.IGNORECASE)

        for doc in docs:
            record = {}

            if not doc.strip():
                continue

            # Извлекаем нужные поля
            for field in FIELDS + ["Сумма"]:
                match = re.search(rf"{field}\s*=\s*(.+)", doc, flags=re.IGNORECASE)
                if match:
                    record[field] = match.group(1).strip()

            # Пропускаем, если нет даты (служебные блоки)
            if "ДатаОперации" not in record:
                continue

            # Пропускаем служебные дубли (когда есть Сумма и одновременно СуммаРасход/СуммаПриход)
            if "Сумма" in record and ("СуммаРасход" in record or "СуммаПриход" in record):
                record.pop("Сумма", None)

            # --- Определяем тип транзакции ---
            payer_iik = record.get("ПлательщикИИК", "").strip()
            receiver_iik = record.get("ПолучательИИК", "").strip()
            transaction_type = determine_transaction_type(payer_iik, receiver_iik)

            # Пропускаем чужие транзакции
            if transaction_type == "unknown":
                continue

            # --- Формируем результат ---
            record["ТипТранзакции"] = transaction_type

            if transaction_type == "transfer":
                # Перевод между своими счетами
                record["СчетОткуда"] = payer_iik
                record["СчетКуда"] = receiver_iik
                record["Контрагент"] = "Перевод между своими счетами"
                record["Категория"] = "Перевод"
            elif transaction_type == "income":
                record["Счет"] = receiver_iik
                record["Контрагент"] = record.get("ПлательщикНаименование", "")
                record["Категория"] = "Доход"
            elif transaction_type == "expense":
                record["Счет"] = payer_iik
                record["Контрагент"] = record.get("ПолучательНаименование", "")
                record["Категория"] = "Расход"

            # Добавляем запись
            all_records.append({
                **{f: record.get(f, "") for f in FIELDS},
                "ТипТранзакции": record.get("ТипТранзакции", ""),
                "СчетОткуда": record.get("СчетОткуда", ""),
                "СчетКуда": record.get("СчетКуда", ""),
                "Счет": record.get("Счет", ""),
                "Контрагент": record.get("Контрагент", ""),
                "Категория": record.get("Категория", ""),
            })

    # --- Удаляем дубли (одинаковая дата + сумма + контрагент) ---
    unique_records = []
    seen = set()
    for rec in all_records:
        key = (
            rec.get("ДатаОперации", ""),
            rec.get("СуммаРасход", "") or rec.get("СуммаПриход", ""),
            rec.get("Контрагент", "")
        )
        if key not in seen:
            seen.add(key)
            unique_records.append(rec)

    return unique_records


# ✅ Пример использования
if __name__ == "__main__":
    # Папка, где лежат файлы
    folder = "."
    files = [os.path.join(folder, f) for f in os.listdir(folder) if f.endswith(".txt")]

    records = parse_1c_files(files)

    # Пример вывода
    print(f"✅ Найдено {len(records)} операций:")
    for r in records[:10]:
        print(f"Дата: {r.get('ДатаОперации')}")
        print(f"Тип: {r.get('ТипТранзакции')}")
        print(f"Контрагент: {r.get('Контрагент')}")
        if r.get("ТипТранзакции") == "transfer":
            print(f"Перевод: {r.get('СчетОткуда')} → {r.get('СчетКуда')}")
        else:
            print(f"Счет: {r.get('Счет')}")
        print(f"Сумма: {r.get('СуммаРасход', r.get('СуммаПриход', ''))}")
        print(f"Категория: {r.get('Категория', '')}")
        print("---")