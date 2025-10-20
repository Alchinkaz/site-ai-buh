import io
import re
import json
import pdfplumber
from typing import List, Dict, Optional
from abc import ABC, abstractmethod

class BankParser(ABC):
    """Базовый класс для парсинга банковских выписок"""
    
    @abstractmethod
    def parse(self, text: str) -> List[Dict[str, str]]:
        """Парсит текст выписки и возвращает список операций"""
        pass
    
    def clean_text(self, text: str) -> str:
        """Очищает текст от лишних символов"""
        text = text.replace("\xa0", " ")
        text = re.sub(r"[ \t]{2,}", " ", text)
        return text.strip()
    
    def extract_date(self, text: str) -> str:
        """Извлекает дату из текста"""
        date_patterns = [
            r"\d{1,2}[./-]\d{1,2}[./-]\d{2,4}",
            r"\d{4}[./-]\d{1,2}[./-]\d{1,2}",
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0)
        return ""
    
    def extract_amounts(self, text: str) -> tuple[str, str]:
        """Извлекает суммы дебета и кредита"""
        # Исключаем номера документов, даты, ИИН из поиска сумм
        exclude_patterns = [
            r"\d{12}",  # ИИН
            r"\d{4,6}",  # Номера документов
            r"\d{1,2}[./-]\d{1,2}[./-]\d{2,4}",  # Даты
        ]
        
        text_for_amounts = text
        for pattern in exclude_patterns:
            text_for_amounts = re.sub(pattern, "", text_for_amounts)
        
        # Ищем суммы в формате с копейками
        amount_pattern = r"\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?"
        amounts = re.findall(amount_pattern, text_for_amounts)
        
        # Фильтруем суммы по разумным пределам
        valid_amounts = []
        for amount in amounts:
            try:
                clean_amount = amount.replace(",", ".").replace(" ", "")
                value = float(clean_amount)
                if 0 < value < 10000000:  # От 0 до 10 миллионов
                    valid_amounts.append(amount)
            except:
                continue
        
        # Определяем дебет и кредит
        if len(valid_amounts) >= 2:
            amounts_clean = [amt.replace(" ", "").replace(",", ".") for amt in valid_amounts]
            amounts_clean.sort(key=lambda x: float(x), reverse=True)
            return amounts_clean[1], amounts_clean[0]  # Меньшая сумма - дебет, большая - кредит
        elif len(valid_amounts) == 1:
            amount = valid_amounts[0].replace(" ", "").replace(",", ".")
            # Определяем по контексту
            if any(word in text.lower() for word in ["дебет", "расход", "списание", "оплата", "платеж"]):
                return amount, ""
            elif any(word in text.lower() for word in ["кредит", "доход", "поступление", "зачисление"]):
                return "", amount
            else:
                return amount, ""  # По умолчанию считаем расходом
        
        return "", ""
    
    def extract_counterparty(self, text: str) -> str:
        """Извлекает название контрагента"""
        # Улучшенные паттерны для поиска контрагентов
        counterparty_patterns = [
            # Юридические лица
            r"(?:ИП|ТОО|ООО|АО|АООТ|ТДО|КХ|ПК|КП|СПК|ЧП|ФЛ)\s+[A-Za-zА-Яа-я0-9 .\"'«»-]{3,50}",
            # Физические лица (ФИО)
            r"[А-Яа-я]{2,}\s+[А-Яа-я]{2,}(?:\s+[А-Яа-я]{2,})?",
            # Названия компаний без формы
            r"[A-Za-zА-Яа-я]{3,}\s+[A-Za-zА-Яа-я]{3,}(?:\s+[A-Za-zА-Яа-я]{3,})*",
        ]
        
        for pattern in counterparty_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                counterparty = match.strip()
                # Очищаем от лишних символов
                counterparty = re.sub(r'[^\w\sА-Яа-я«»""\'-]', '', counterparty)
                if len(counterparty) > 3 and len(counterparty) < 100:
                    return counterparty
        
        return ""
    
    def extract_document_number(self, text: str) -> str:
        """Извлекает номер документа"""
        doc_patterns = [
            r"(?:док|документ|№|#)\s*(\d+)",
            r"№\s*(\d+)",
            r"док\s*(\d+)",
        ]
        
        for pattern in doc_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return ""

class KaspiParser(BankParser):
    """Парсер для Kaspi Bank"""
    
    def parse(self, text: str) -> List[Dict[str, str]]:
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        if not lines:
            return []
        
        operations = []
        current_operation = []
        
        for line in lines:
            # Kaspi Bank часто использует дату как разделитель операций
            if re.match(r"\d{1,2}[./-]\d{1,2}[./-]\d{2,4}", line):
                if current_operation:
                    operations.append(current_operation)
                current_operation = [line]
            else:
                current_operation.append(line)
        
        if current_operation:
            operations.append(current_operation)
        
        results = []
        for op in operations:
            full_text = " ".join(op)
            
            date = self.extract_date(full_text)
            if not date:
                continue
            
            doc_number = self.extract_document_number(full_text)
            debit, credit = self.extract_amounts(full_text)
            counterparty = self.extract_counterparty(full_text)
            
            # Определяем тип операции
            operation_type = ""
            amount = ""
            
            if debit and not credit:
                operation_type = "Расход"
                amount = debit
            elif credit and not debit:
                operation_type = "Доход"
                amount = credit
            elif debit and credit:
                debit_val = float(debit) if debit else 0
                credit_val = float(credit) if credit else 0
                if debit_val > credit_val:
                    operation_type = "Расход"
                    amount = debit
                else:
                    operation_type = "Доход"
                    amount = credit
            else:
                continue  # Пропускаем операции без сумм
            
            # Формируем комментарий
            comment = full_text
            for field in [date, doc_number, counterparty, debit, credit]:
                if field:
                    comment = comment.replace(field, "").strip()
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
                "Банк": "Kaspi"
            })
        
        return results

class ForteParser(BankParser):
    """Парсер для Forte Bank"""
    
    def parse(self, text: str) -> List[Dict[str, str]]:
        # Forte Bank часто использует табличный формат
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        if not lines:
            return []
        
        operations = []
        current_operation = []
        
        for line in lines:
            # Forte Bank использует более сложные разделители
            if re.match(r"\d{1,2}[./-]\d{1,2}[./-]\d{2,4}", line) or "операция" in line.lower():
                if current_operation:
                    operations.append(current_operation)
                current_operation = [line]
            else:
                current_operation.append(line)
        
        if current_operation:
            operations.append(current_operation)
        
        results = []
        for op in operations:
            full_text = " ".join(op)
            
            date = self.extract_date(full_text)
            if not date:
                continue
            
            doc_number = self.extract_document_number(full_text)
            debit, credit = self.extract_amounts(full_text)
            counterparty = self.extract_counterparty(full_text)
            
            # Forte Bank часто указывает направление операции явно
            operation_type = ""
            amount = ""
            
            if "дебет" in full_text.lower() or "списание" in full_text.lower():
                operation_type = "Расход"
                amount = debit or credit
            elif "кредит" in full_text.lower() or "зачисление" in full_text.lower():
                operation_type = "Доход"
                amount = credit or debit
            elif debit and not credit:
                operation_type = "Расход"
                amount = debit
            elif credit and not debit:
                operation_type = "Доход"
                amount = credit
            elif debit and credit:
                debit_val = float(debit) if debit else 0
                credit_val = float(credit) if credit else 0
                if debit_val > credit_val:
                    operation_type = "Расход"
                    amount = debit
                else:
                    operation_type = "Доход"
                    amount = credit
            else:
                continue
            
            # Формируем комментарий
            comment = full_text
            for field in [date, doc_number, counterparty, debit, credit]:
                if field:
                    comment = comment.replace(field, "").strip()
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
                "Банк": "Forte"
            })
        
        return results

class HalykParser(BankParser):
    """Парсер для Halyk Bank"""
    
    def parse(self, text: str) -> List[Dict[str, str]]:
        # Halyk Bank часто использует табличный формат с фиксированными колонками
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        if not lines:
            return []
        
        operations = []
        current_operation = []
        
        for line in lines:
            # Halyk Bank использует дату или номер операции как разделитель
            if (re.match(r"\d{1,2}[./-]\d{1,2}[./-]\d{2,4}", line) or 
                re.match(r"\d{6,}", line)):  # Номер операции
                if current_operation:
                    operations.append(current_operation)
                current_operation = [line]
            else:
                current_operation.append(line)
        
        if current_operation:
            operations.append(current_operation)
        
        results = []
        for op in operations:
            full_text = " ".join(op)
            
            date = self.extract_date(full_text)
            if not date:
                continue
            
            doc_number = self.extract_document_number(full_text)
            debit, credit = self.extract_amounts(full_text)
            counterparty = self.extract_counterparty(full_text)
            
            # Halyk Bank часто указывает операции в табличном формате
            operation_type = ""
            amount = ""
            
            if debit and not credit:
                operation_type = "Расход"
                amount = debit
            elif credit and not debit:
                operation_type = "Доход"
                amount = credit
            elif debit and credit:
                debit_val = float(debit) if debit else 0
                credit_val = float(credit) if credit else 0
                if debit_val > credit_val:
                    operation_type = "Расход"
                    amount = debit
                else:
                    operation_type = "Доход"
                    amount = credit
            else:
                continue
            
            # Формируем комментарий
            comment = full_text
            for field in [date, doc_number, counterparty, debit, credit]:
                if field:
                    comment = comment.replace(field, "").strip()
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
                "Банк": "Halyk"
            })
        
        return results

class UniversalParser(BankParser):
    """Универсальный парсер для неизвестных банков"""
    
    def parse(self, text: str) -> List[Dict[str, str]]:
        # Используем базовую логику из оригинального парсера
        text = self.clean_text(text)
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        
        if not lines:
            return []
        
        operations = []
        current_operation = []
        
        for line in lines:
            if re.match(r"\d{1,2}[./-]\d{1,2}[./-]\d{2,4}", line):
                if current_operation:
                    operations.append(current_operation)
                current_operation = []
            current_operation.append(line)
        
        if current_operation:
            operations.append(current_operation)
        
        results = []
        for op in operations:
            full_text = " ".join(op)
            
            date = self.extract_date(full_text)
            if not date:
                continue
            
            doc_number = self.extract_document_number(full_text)
            debit, credit = self.extract_amounts(full_text)
            counterparty = self.extract_counterparty(full_text)
            
            operation_type = ""
            amount = ""
            
            if debit and not credit:
                operation_type = "Расход"
                amount = debit
            elif credit and not debit:
                operation_type = "Доход"
                amount = credit
            elif debit and credit:
                debit_val = float(debit) if debit else 0
                credit_val = float(credit) if credit else 0
                if debit_val > credit_val:
                    operation_type = "Расход"
                    amount = debit
                else:
                    operation_type = "Доход"
                    amount = credit
            else:
                continue
            
            comment = full_text
            for field in [date, doc_number, counterparty, debit, credit]:
                if field:
                    comment = comment.replace(field, "").strip()
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
                "Банк": "Unknown"
            })
        
        return results

def get_parser(bank_name: str) -> BankParser:
    """Возвращает соответствующий парсер для банка"""
    parsers = {
        "Kaspi": KaspiParser(),
        "Forte": ForteParser(),
        "Halyk": HalykParser(),
        "Jusan": UniversalParser(),  # Пока используем универсальный
        "Onlinebank": UniversalParser(),
        "Other": UniversalParser(),
    }
    
    return parsers.get(bank_name, UniversalParser())

def parse_pdf_improved(file_bytes: bytes, bank_name: str) -> List[Dict[str, str]]:
    """Улучшенная функция парсинга PDF"""
    try:
        text = ""
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"
    except Exception as e:
        print(json.dumps({"error": f"Ошибка при открытии PDF: {str(e)}"}, ensure_ascii=False))
        return []

    if not text.strip():
        print(json.dumps({"error": "PDF файл не содержит текста или не может быть обработан"}, ensure_ascii=False))
        return []

    # Используем банк-специфичный парсер
    parser = get_parser(bank_name)
    return parser.parse(text)

# Обратная совместимость
def parse_pdf(file_bytes: bytes, bank_name: str):
    """Оригинальная функция для обратной совместимости"""
    return parse_pdf_improved(file_bytes, bank_name)

def parse_text_content(text: str, bank_name: str):
    """Парсинг текстового содержимого"""
    parser = get_parser(bank_name)
    return parser.parse(text)

# --------------------------
# Пример запуска
# --------------------------
if __name__ == "__main__":
    import os
    import sys
    import json

    if len(sys.argv) >= 3:
        pdf_path = sys.argv[1]
        bank_name = sys.argv[2]
        
        if not os.path.exists(pdf_path):
            print(json.dumps({"error": "Файл не найден"}, ensure_ascii=False))
            sys.exit(1)

        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        data = parse_pdf_improved(pdf_bytes, bank_name)
        print(json.dumps(data, ensure_ascii=False, indent=2))
        
    else:
        pdf_path = input("📄 Укажи путь к PDF-файлу: ").strip()
        bank_name = input("🏦 Укажи банк (Kaspi/Forte/Halyk/Jusan/Other): ").strip()

        if not os.path.exists(pdf_path):
            print("❌ Файл не найден.")
            exit()

        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        data = parse_pdf_improved(pdf_bytes, bank_name)
        print(f"\n✅ Найдено операций: {len(data)}\n")

        for d in data[:5]:  # Показываем первые 5 операций
            print(f"Дата: {d['ДатаОперации']}")
            print(f"Тип: {d['Тип']}")
            print(f"Контрагент: {d['Контрагент']}")
            print(f"Сумма: {d['Сумма']}")
            print(f"Комментарий: {d['Комментарий']}")
            print("-" * 50)


