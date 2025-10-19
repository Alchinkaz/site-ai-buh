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
]

# 🔧 Ключи, которые парсим
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


def parse_1c_files(file_paths: List[str]) -> List[Dict[str, str]]:
    """Парсит выписки 1CClientBankExchange и определяет тип операции"""
    all_records = []

    for file_path in file_paths:
        encoding = detect_encoding(file_path)
        with open(file_path, "r", encoding=encoding, errors="ignore") as f:
            text = f.read()

        # Унификация ключей
        text = re.sub(r"([А-ЯA-Z_]+)=", lambda m: m.group(1).capitalize() + "=", text)
        docs = re.split(r"СекцияДокумент=.*?\n", text, flags=re.IGNORECASE)

        for doc in docs:
            if not doc.strip():
                continue

            record = {}
            for field in FIELDS + ["Сумма"]:
                match = re.search(rf"{field}\s*=\s*(.+)", doc, flags=re.IGNORECASE)
                if match:
                    record[field] = match.group(1).strip()

            if "ДатаОперации" not in record:
                continue

            # Убираем лишнюю строку "Сумма" при наличии СуммаРасход/СуммаПриход
            if "Сумма" in record and ("СуммаРасход" in record or "СуммаПриход" in record):
                record.pop("Сумма", None)

            payer_iik = record.get("ПлательщикИИК", "").strip()
            receiver_iik = record.get("ПолучательИИК", "").strip()

            payer_is_ours = payer_iik in OUR_ACCOUNTS
            receiver_is_ours = receiver_iik in OUR_ACCOUNTS

            # --- Определяем тип транзакции ---
            if payer_is_ours and receiver_is_ours:
                # Перевод между своими счетами
                record["ТипТранзакции"] = "transfer"
                record["СчетОткуда"] = payer_iik
                record["СчетКуда"] = receiver_iik
                record["Контрагент"] = "Перевод между своими счетами"
                record["Категория"] = "Перевод"
            elif payer_is_ours:
                # Расход
                record["ТипТранзакции"] = "expense"
                record["Счет"] = payer_iik
                record["Контрагент"] = record.get("ПолучательНаименование", "")
                record["Категория"] = "Расход"
            elif receiver_is_ours:
                # Доход
                record["ТипТранзакции"] = "income"
                record["Счет"] = receiver_iik
                record["Контрагент"] = record.get("ПлательщикНаименование", "")
                record["Категория"] = "Доход"
            else:
                continue  # Не наши операции — пропускаем

            # --- Формируем финальную запись ---
            all_records.append({
                **{f: record.get(f, "") for f in FIELDS},
                "ТипТранзакции": record.get("ТипТранзакции", ""),
                "СчетОткуда": record.get("СчетОткуда", ""),
                "СчетКуда": record.get("СчетКуда", ""),
                "Счет": record.get("Счет", ""),
                "Контрагент": record.get("Контрагент", ""),
                "Категория": record.get("Категория", ""),
            })

    # --- Убираем дубли (по дате, сумме и типу) ---
    unique_records = []
    seen = set()
    for rec in all_records:
        key = (
            rec.get("ДатаОперации", ""),
            rec.get("СуммаРасход", "") or rec.get("СуммаПриход", ""),
            rec.get("ТипТранзакции", ""),
            rec.get("Контрагент", "")
        )
        if key not in seen:
            seen.add(key)
            unique_records.append(rec)

    return unique_records


# ✅ Пример использования
if __name__ == "__main__":
    folder = "."
    files = [os.path.join(folder, f) for f in os.listdir(folder) if f.endswith(".txt")]

    records = parse_1c_files(files)

    print(f"✅ Найдено {len(records)} операций:\n")
    for r in records:
        print(f"Дата: {r.get('ДатаОперации')}")
        print(f"Тип: {r.get('ТипТранзакции')}")
        if r.get("ТипТранзакции") == "transfer":
            print(f"Перевод: {r.get('СчетОткуда')} → {r.get('СчетКуда')}")
        else:
            print(f"Счет: {r.get('Счет')}")
            print(f"Контрагент: {r.get('Контрагент')}")
        print(f"Сумма: {r.get('СуммаРасход', r.get('СуммаПриход', ''))}")
        print(f"Категория: {r.get('Категория')}")
        print("-" * 50)