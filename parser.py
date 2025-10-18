import re
import csv
from pathlib import Path

# === Настройки ===

INPUT_FILE = "vipiska_forte.txt"   # путь к файлу выписки
OUTPUT_FILE = "parsed_result.csv"  # итоговый CSV

# --- Категории по ключевым словам ---
CATEGORIES = {
    "Продажи Kaspi": ["kaspi.kz", "продажи", "kaspi qr"],
    "Оплата от клиента": ["оплата", "поступление", "услуги", "мониторинг", "видеонаблюдение", "камера", "договор"],
    "Налоги и сборы": ["налог", "гос", "казначейство"],
    "Перевод между счетами": ["своего счета", "перевод собственных средств"],
    "Платеж поставщику": ["оплата", "счет на оплату", "товар", "услуги", "поставка"],
    "Kaspi Pay комиссия": ["kaspi pay", "информационно-технологические услуги"],
    "Бензин / топливо": ["топливо", "гбо", "ai", "ai-92", "ai-95"],
    "Прочее": []
}


def detect_category(text: str) -> str:
    text_low = text.lower()
    for cat, words in CATEGORIES.items():
        if any(w in text_low for w in words):
            return cat
    return "Прочее"


def parse_1c_file(content: str) -> list[dict]:
    """
    Читает 1CClientBankExchange, берет только настоящие платежи (без дубликатов).
    """
    lines = content.splitlines()
    results = []

    current_block = []
    inside_block = False

    # --- Собираем блоки вручную, чтобы отсечь "СекцияДокумент=Выписка" ---
    for line in lines:
        if line.startswith("СекцияДокумент="):
            inside_block = True
            current_block = [line]
        elif line.startswith("КонецДокумента"):
            current_block.append(line)
            block_text = "\n".join(current_block)

            # Берем только реальные документы, где есть получатель или назначение
            if (
                "ПлательщикНаименование=" in block_text
                and "НазначениеПлатежа=" in block_text
            ):
                results.append(block_text)

            inside_block = False
            current_block = []
        elif inside_block:
            current_block.append(line)

    parsed = []

    for block in results:
        # Дата документа
        date_match = re.search(r"ДатаДокумента=(.+)", block)
        date = date_match.group(1).strip() if date_match else ""

        # Сумма
        sum_match = re.search(r"Сумма=(.+)", block)
        if not sum_match:
            continue
        amount = float(sum_match.group(1).replace(",", "."))

        # Плательщик / Получатель
        payer_match = re.search(r"ПлательщикНаименование=(.+)", block)
        receiver_match = re.search(r"ПолучательНаименование=(.+)", block)
        payer = payer_match.group(1).strip() if payer_match else ""
        receiver = receiver_match.group(1).strip() if receiver_match else ""

        # Направление
        if "alchin" in payer.lower():
            type_ = "Расход"
            amount = -amount
            counterparty = receiver
        else:
            type_ = "Доход"
            counterparty = payer

        # Назначение
        purpose_match = re.search(r"НазначениеПлатежа=(.+)", block)
        purpose = purpose_match.group(1).strip() if purpose_match else ""

        # Исключаем внутренние переводы
        if counterparty.lower() == "alchin" or "своего счета" in purpose.lower():
            continue

        # Категория
        category = detect_category(purpose)

        parsed.append({
            "Дата": date,
            "Тип": type_,
            "Категория": category,
            "Контрагент": counterparty,
            "Сумма": f"{amount:,.2f}".replace(",", " "),
            "Комментарий": purpose
        })

    # --- Убираем дубли (одинаковые дата + сумма + контрагент) ---
    unique = []
    seen = set()
    for item in parsed:
        key = (item["Дата"], item["Сумма"], item["Контрагент"])
        if key not in seen:
            seen.add(key)
            unique.append(item)

    return unique


def save_to_csv(data: list[dict], filename: str):
    if not data:
        print("❌ Нет данных для сохранения.")
        return
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
    print(f"✅ Сохранено: {filename} ({len(data)} операций)")


def main():
    text = Path(INPUT_FILE).read_text(encoding="utf-8", errors="ignore")
    parsed = parse_1c_file(text)
    save_to_csv(parsed, OUTPUT_FILE)


if __name__ == "__main__":
    main()
