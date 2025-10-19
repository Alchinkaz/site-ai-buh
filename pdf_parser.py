import io
import re
import json
import pdfplumber

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

    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t]{2,}", " ", text)

    lines = [l.strip() for l in text.splitlines() if l.strip()]
    
    # Проверяем, что есть строки для обработки
    if not lines:
        print(json.dumps({"error": "PDF файл не содержит данных для обработки"}, ensure_ascii=False))
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
        date_match = re.search(r"\d{1,2}[./-]\d{1,2}[./-]\d{2,4}", full)
        date = date_match.group(0) if date_match else ""
        sums = re.findall(r"[-+]?\d[\d\s.,]*\d", full)
        amount = sums[-1].replace(" ", "").replace(",", ".") if sums else ""
        typ = "Доход" if ("+" in amount or "Доход" in full) else "Расход" if "-" in amount else ""
        counterparty = ""
        contr = re.search(r"(?:ИП|ТОО|ООО|АО)\s+[A-Za-zА-Яа-я0-9 .\"']+", full)
        if contr:
            counterparty = contr.group(0)
        comment = full
        results.append({
            "ДатаОперации": date,
            "Тип": typ,
            "Контрагент": counterparty,
            "Сумма": amount,
            "Комментарий": comment,
            "Банк": bank_name
        })
    return results


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
