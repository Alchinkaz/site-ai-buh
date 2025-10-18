import re
import csv
from pathlib import Path

INPUT_FILE = "vipiska_forte.txt"
OUTPUT_FILE = "parsed_result.csv"

CATEGORIES = {
    "Продажи Kaspi": ["kaspi.kz", "продажи", "kaspi qr"],
    "Оплата от клиента": ["оплата", "поступление", "услуги", "мониторинг", "видеонаблюдение", "камера", "договор"],
    "Налоги и сборы": ["налог", "гос", "казначейство"],
    "Перевод между счетами": ["своего счета", "перевод собственных средств"],
    "Платеж поставщику": ["оплата", "счет на оплату", "товар", "услуги", "лизинг", "поставка"],
    "Kaspi Pay комиссия": ["информационно-технологические услуги", "kaspi pay"],
    "Бензин / топливо": ["гбо", "топливо", "нефть", "ai", "ai-92", "ai-95"],
    "Прочее": []
}


def detect_category(text: str) -> str:
    t = text.lower()
    for cat, words in CATEGORIES.items():
        if any(w in t for w in words):
            return cat
    return "Прочее"


def parse_1c_file(text: str) -> list[dict]:
    # Берем только блоки ПлатежноеПоручение (второй уровень)
    blocks = re.findall(r"СекцияДокумент=ПлатежноеПоручение[\s\S]*?КонецДокумента", text, re.IGNORECASE)
    results = []
    seen_transactions = set()  # Для отслеживания дубликатов

    for block in blocks:
        # Дата
        date_match = re.search(r"ДатаДокумента=(.+)", block)
        date = date_match.group(1).strip() if date_match else ""

        # Сумма
        sum_match = re.search(r"Сумма=(.+)", block)
        amount = float(sum_match.group(1).replace(",", ".")) if sum_match else 0.0

        # Определяем тип по тому, кто Alchin: плательщик или получатель
        payer = re.search(r"ПлательщикНаименование=(.+)", block)
        receiver = re.search(r"ПолучательНаименование=(.+)", block)
        payer_name = payer.group(1).strip() if payer else ""
        receiver_name = receiver.group(1).strip() if receiver else ""

        if "alchin" in payer_name.lower():
            type_ = "Расход"
            amount = -amount
            counterparty = receiver_name
        else:
            type_ = "Доход"
            counterparty = payer_name

        # Назначение
        purpose = re.search(r"НазначениеПлатежа=(.+)", block)
        purpose_text = purpose.group(1).strip() if purpose else ""

        # Создаем уникальный ключ для проверки дубликатов
        # Используем комбинацию даты, суммы, контрагента и назначения
        transaction_key = f"{date}_{amount}_{counterparty}_{purpose_text}"
        
        # Проверяем, не встречалась ли уже такая транзакция
        if transaction_key in seen_transactions:
            print(f"⚠️  Пропущен дубликат: {date} - {amount} - {counterparty}")
            continue
        
        seen_transactions.add(transaction_key)

        category = detect_category(purpose_text)

        results.append({
            "Дата": date,
            "Тип": type_,
            "Категория": category,
            "Контрагент": counterparty,
            "Сумма": f"{amount:,.2f}".replace(",", " "),
            "Комментарий": purpose_text
        })

    return results


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
