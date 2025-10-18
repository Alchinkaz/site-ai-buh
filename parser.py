import os
import re
import chardet
from typing import List, Dict

# 🔧 Наша компания
COMPANY_NAME = "ALCHIN"

# 🔧 Ключи, которые нужно парсить
FIELDS = [
    "ПолучательНаименование",
    "ПлательщикНаименование",
    "ПлательщикБИН_ИИН",
    "ПолучательБИН_ИИН",
    "ПлательщикБанкНаименование",
    "ПолучательБанкНаименование",
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

            # Пропускаем внутренние переводы
            payer = record.get("ПлательщикНаименование", "").lower()
            receiver = record.get("ПолучательНаименование", "").lower()

            if COMPANY_NAME.lower() in payer and COMPANY_NAME.lower() in receiver:
                continue

            # Добавляем только если контрагент не мы
            all_records.append({k: record.get(k, "") for k in FIELDS})

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
        print(r)

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
