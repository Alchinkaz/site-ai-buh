import re
import csv
from pathlib import Path

# === Настройки ===

INPUT_FILE = "vipiska_forte.txt"   # путь к файлу выписки
OUTPUT_FILE = "parsed_result.csv"  # куда сохранить результат

# Ключевые слова для категорий (можно расширять)
CATEGORIES = {
    "Продажи Kaspi": ["kaspi.kz", "продажи", "kaspi qr"],
    "Оплата от клиента": ["оплата", "поступление", "услуги", "мониторинг", "видеонаблюдение", "камера", "договор"],
    "Налоги и сборы": ["налог", "гос", "казначейство"],
    "Перевод между счетами": ["своего счета", "перевод собственных средств", "между своими счетами"],
    "Платеж поставщику": ["оплата", "счет на оплату", "товар", "поставка", "услуги"],
    "Kaspi Pay комиссия": ["kaspi pay", "информационно-технологические услуги"],
    "Бензин / топливо": ["топливо", "гбо", "ai", "ai-92", "ai-95"],
    "Прочее": []
}


def detect_category(text: str) -> str:
    """Определяет категорию по ключевым словам"""
    text_low = text.lower()
    for category, keywords in CATEGORIES.items():
        if any(word in text_low for word in keywords):
            return category
    return "Прочее"


def parse_1c_file(content: str) -> list[dict]:
    """
    Парсит выписку 1CClientBankExchange (ForteBank, Kaspi)
    и возвращает список операций без дублей.
    """
    # --- 1. Берем только полноценные документы ---
    # ForteBank формирует дубли: "Выписка" + "ПлатежноеПоручение"
    # Мы игнорируем "Выписка", берем только "ПлатежноеПоручение"
    blocks = re.findall(r"СекцияДокумент=ПлатежноеПоручение[\s\S]*?КонецДокумента", content, re.IGNORECASE)

    operations = []

    for block in blocks:
        # --- 2. Извлекаем дату ---
        date_match = re.search(r"ДатаДокумента=(.+)", block)
        date = date_match.group(1).strip() if date_match else ""

        # --- 3. Извлекаем сумму ---
        sum_match = re.search(r"Сумма=(.+)", block)
        if not sum_match:
            continue
        amount = float(sum_match.group(1).replace(",", "."))

        # --- 4. Извлекаем участников операции ---
        payer = re.search(r"ПлательщикНаименование=(.+)", block)
        receiver = re.search(r"ПолучательНаименование=(.+)", block)
        payer_name = payer.group(1).strip() if payer else ""
        receiver_name = receiver.group(1).strip() if receiver else ""

        # --- 5. Определяем тип операции ---
        if "alchin" in payer_name.lower():
            type_ = "Расход"
            amount = -amount
            counterparty = receiver_name
        else:
            type_ = "Доход"
            counterparty = payer_name

        # --- 6. Назначение платежа ---
        purpose_match = re.search(r"НазначениеПлатежа=(.+)", block)
        purpose = purpose_match.group(1).strip() if purpose_match else ""

        # --- 7. Исключаем записи без контрагента и внутренние переводы ---
        if not counterparty or counterparty.strip() == "" or counterparty.lower() == "alchin" or "своего счета" in purpose.lower():
            continue  # пропускаем такие строки

        # --- 8. Категория и финальные данные ---
        category = detect_category(purpose)

        operations.append({
            "Дата": date,
            "Тип": type_,
            "Категория": category,
            "Контрагент": counterparty,
            "Сумма": f"{amount:,.2f}".replace(",", " "),
            "Комментарий": purpose
        })

    # --- 9. Убираем возможные дубли по комбинации (дата, сумма, контрагент) ---
    unique_ops = []
    seen = set()
    for op in operations:
        key = (op["Дата"], op["Сумма"], op["Контрагент"])
        if key not in seen:
            seen.add(key)
            unique_ops.append(op)

    return unique_ops


def save_to_csv(data: list[dict], filename: str):
    """Сохраняет результат в CSV"""
    if not data:
        print("❌ Нет данных для сохранения.")
        return
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
    print(f"✅ Готово! Сохранено: {filename} ({len(data)} операций)")


def main():
    # Чтение файла
    text = Path(INPUT_FILE).read_text(encoding="utf-8", errors="ignore")

    # Парсинг и сохранение
    parsed = parse_1c_file(text)
    save_to_csv(parsed, OUTPUT_FILE)


if __name__ == "__main__":
    main()
