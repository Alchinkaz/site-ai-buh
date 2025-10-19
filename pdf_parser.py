import io
import re
import json
import pdfplumber

def parse_text_content(text: str, bank_name: str):
    """Парсит текстовое содержимое и возвращает список операций."""
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t]{2,}", " ", text)

    lines = [l.strip() for l in text.splitlines() if l.strip()]
    
    # Проверяем, что есть строки для обработки
    if not lines:
        return []
    
    operations, cur = [], []
    for line in lines:
        # если строка начинается с даты — новая операция
        if re.match(r"\d{1,2}[./-]\d{1,2}[./-]\d{2,4}", line):
            if cur:
                operations.append(cur)
                cur = []
        cur.append(line)
    if cur:
        operations.append(cur)

    results = []
    for op in operations:
        full = " ".join(op)
        
        # Извлекаем дату
        date_match = re.search(r"\d{1,2}[./-]\d{1,2}[./-]\d{2,4}", full)
        date = date_match.group(0) if date_match else ""
        
        # Извлекаем номер документа
        doc_number = ""
        doc_match = re.search(r"(?:док|документ|№|#)\s*(\d+)", full, re.IGNORECASE)
        if doc_match:
            doc_number = doc_match.group(1)
        
        # Извлекаем дебет и кредит
        debit = ""
        credit = ""
        
        # Ищем суммы в разных форматах
        # Сначала удаляем дату и номер документа из текста для поиска сумм
        text_for_amounts = full
        
        # Удаляем дату
        if date:
            text_for_amounts = text_for_amounts.replace(date, "")
        
        # Удаляем номер документа
        if doc_number:
            text_for_amounts = text_for_amounts.replace(f"№{doc_number}", "").replace(f"док {doc_number}", "")
        
        # Ищем числа, которые могут быть суммами
        amounts = []
        all_numbers = re.findall(r"\d+(?:[.,]\d{2})?", text_for_amounts)
        
        for num in all_numbers:
            try:
                clean_num = num.replace(",", ".")
                value = float(clean_num)
                # Проверяем, что это разумная сумма (больше 0 и меньше 10 миллионов)
                if 0 < value < 10000000:
                    amounts.append(num)
            except:
                continue
        
        # Определяем дебет и кредит
        if len(amounts) >= 2:
            # Если есть две суммы, берем их как дебет и кредит
            amounts_clean = [amt.replace(" ", "").replace(",", ".") for amt in amounts]
            # Сортируем по убыванию и берем две наибольшие
            amounts_clean.sort(key=lambda x: float(x), reverse=True)
            credit = amounts_clean[0]  # Большая сумма
            debit = amounts_clean[1]   # Меньшая сумма
        elif len(amounts) == 1:
            # Если одна сумма, определяем по контексту
            amount = amounts[0].replace(" ", "").replace(",", ".")
            if any(word in full.lower() for word in ["дебет", "расход", "списание", "оплата"]):
                debit = amount
            elif any(word in full.lower() for word in ["кредит", "доход", "поступление", "зачисление"]):
                credit = amount
            else:
                # По умолчанию считаем расходом
                debit = amount
        
        # Определяем тип операции
        operation_type = ""
        if debit and not credit:
            operation_type = "Расход"
            amount = debit
        elif credit and not debit:
            operation_type = "Доход"
            amount = credit
        elif debit and credit:
            # Если есть и дебет и кредит, определяем по большей сумме
            debit_val = float(debit) if debit else 0
            credit_val = float(credit) if credit else 0
            if debit_val > credit_val:
                operation_type = "Расход"
                amount = debit
            else:
                operation_type = "Доход"
                amount = credit
        else:
            operation_type = "Неопределено"
            amount = ""
        
        # Извлекаем контрагента
        counterparty = ""
        
        # Паттерны для поиска контрагентов
        counterparty_patterns = [
            r"(?:ИП|ТОО|ООО|АО|АООТ|ТДО|КХ|ПК|КП|СПК|ЧП|ФЛ)\s+[A-Za-zА-Яа-я0-9 .\"'«»-]+",
            r"[A-Za-zА-Яа-я]{2,}\s+[A-Za-zА-Яа-я]{2,}(?:\s+[A-Za-zА-Яа-я]{2,})*",
        ]
        
        for pattern in counterparty_patterns:
            match = re.search(pattern, full)
            if match:
                counterparty = match.group(0).strip()
                # Очищаем от лишних символов
                counterparty = re.sub(r'[^\w\sА-Яа-я«»""\'-]', '', counterparty)
                if len(counterparty) > 3:  # Минимальная длина названия
                    break
        
        # Извлекаем детали платежа (комментарий)
        comment = full
        
        # Убираем из комментария уже извлеченные данные
        if date:
            comment = comment.replace(date, "").strip()
        if doc_number:
            comment = comment.replace(f"№{doc_number}", "").replace(f"док {doc_number}", "").strip()
        if counterparty:
            comment = comment.replace(counterparty, "").strip()
        if debit:
            comment = comment.replace(debit, "").strip()
        if credit:
            comment = comment.replace(credit, "").strip()
        
        # Очищаем комментарий от лишних пробелов
        comment = re.sub(r'\s+', ' ', comment).strip()
        
        results.append({
            "ДатаОперации": date,
            "НомерДокумента": doc_number,
            "Дебет": debit,
            "Кредит": credit,
            "Тип": operation_type,
            "Контрагент": counterparty,
            "Сумма": amount,
            "Комментарий": comment,
            "Банк": bank_name
        })
    return results

def parse_pdf(file_bytes: bytes, bank_name: str):
    """Парсит PDF-файл из памяти (байты) и возвращает список операций."""
    try:
        text = ""
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"
    except Exception as e:
        print(json.dumps({"error": f"Ошибка при открытии PDF: {str(e)}"}, ensure_ascii=False))
        return []

    # Проверяем, что текст не пустой
    if not text.strip():
        print(json.dumps({"error": "PDF файл не содержит текста или не может быть обработан"}, ensure_ascii=False))
        return []

    # Используем функцию парсинга текста
    return parse_text_content(text, bank_name)


# --------------------------
# пример запуска напрямую
# --------------------------
if __name__ == "__main__":
    import os
    import sys
    import json

    # Проверяем аргументы командной строки
    if len(sys.argv) >= 3:
        # Запуск из API - получаем аргументы из командной строки
        pdf_path = sys.argv[1]
        bank_name = sys.argv[2]
        
        if not os.path.exists(pdf_path):
            print(json.dumps({"error": "Файл не найден"}, ensure_ascii=False))
            sys.exit(1)

        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        data = parse_pdf(pdf_bytes, bank_name)
        
        # Выводим результат в JSON формате для API
        print(json.dumps(data, ensure_ascii=False, indent=2))
        
    else:
        # Интерактивный режим
        pdf_path = input("📄 Укажи путь к PDF-файлу (например, Выписка.pdf): ").strip()
        bank_name = input("🏦 Укажи банк (Kaspi / Forte / Onlinebank): ").strip()

        if not os.path.exists(pdf_path):
            print("❌ Файл не найден.")
            exit()

        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        data = parse_pdf(pdf_bytes, bank_name)
        print(f"\n✅ Найдено операций: {len(data)}\n")

        for d in data[:10]:
            print(d)

        # если хочешь сохранить результат в JSON
        save_json = input("\n💾 Сохранить результат в JSON? (y/n): ").strip().lower()
        if save_json == "y":
            out = "result.json"
            with open(out, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"✅ Сохранено в {out}")
