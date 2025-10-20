#!/usr/bin/env python3
"""
Тестовый скрипт для проверки улучшенного парсинга
"""

import os
import sys
import json
from typing import List, Dict

# Добавляем текущую директорию в путь для импорта
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from parser_improved import parse_1c_files_improved
    from pdf_parser_improved import parse_pdf_improved, get_parser
except ImportError as e:
    print(f"Ошибка импорта: {e}")
    print("Убедитесь, что файлы parser_improved.py и pdf_parser_improved.py находятся в той же директории")
    sys.exit(1)

def test_1c_parsing():
    """Тестирует парсинг 1C файлов"""
    print("🧪 Тестирование парсинга 1C файлов...")
    
    # Ищем txt файлы в текущей директории
    txt_files = [f for f in os.listdir('.') if f.endswith('.txt')]
    
    if not txt_files:
        print("❌ Не найдено txt файлов для тестирования")
        return []
    
    print(f"📁 Найдено файлов: {txt_files}")
    
    try:
        records = parse_1c_files_improved(txt_files)
        print(f"✅ Успешно обработано {len(records)} операций")
        
        # Показываем первые несколько записей
        for i, record in enumerate(records[:3]):
            print(f"\n📋 Операция {i+1}:")
            print(f"  Дата: {record.get('ДатаОперации', 'N/A')}")
            print(f"  Тип: {record.get('ТипТранзакции', 'N/A')}")
            print(f"  Контрагент: {record.get('Контрагент', 'N/A')}")
            print(f"  Сумма: {record.get('СуммаРасход', record.get('СуммаПриход', 'N/A'))}")
            print(f"  Назначение: {record.get('НазначениеПлатежа', 'N/A')}")
        
        return records
        
    except Exception as e:
        print(f"❌ Ошибка при парсинге 1C файлов: {e}")
        return []

def test_pdf_parsing():
    """Тестирует парсинг PDF файлов"""
    print("\n🧪 Тестирование парсинга PDF файлов...")
    
    # Ищем PDF файлы в текущей директории
    pdf_files = [f for f in os.listdir('.') if f.endswith('.pdf')]
    
    if not pdf_files:
        print("❌ Не найдено PDF файлов для тестирования")
        return []
    
    print(f"📁 Найдено PDF файлов: {pdf_files}")
    
    results = []
    
    for pdf_file in pdf_files[:2]:  # Тестируем первые 2 файла
        print(f"\n📄 Обработка файла: {pdf_file}")
        
        try:
            with open(pdf_file, 'rb') as f:
                pdf_bytes = f.read()
            
            # Тестируем разные банки
            banks = ['Kaspi', 'Forte', 'Halyk', 'Other']
            
            for bank in banks:
                print(f"  🏦 Тестирование парсера для {bank}...")
                try:
                    records = parse_pdf_improved(pdf_bytes, bank)
                    print(f"    ✅ Найдено {len(records)} операций")
                    
                    if records:
                        # Показываем первую операцию
                        record = records[0]
                        print(f"    📋 Пример операции:")
                        print(f"      Дата: {record.get('ДатаОперации', 'N/A')}")
                        print(f"      Тип: {record.get('Тип', 'N/A')}")
                        print(f"      Контрагент: {record.get('Контрагент', 'N/A')}")
                        print(f"      Сумма: {record.get('Сумма', 'N/A')}")
                    
                    results.extend(records)
                    
                except Exception as e:
                    print(f"    ❌ Ошибка для {bank}: {e}")
        
        except Exception as e:
            print(f"❌ Ошибка при чтении файла {pdf_file}: {e}")
    
    return results

def test_parser_selection():
    """Тестирует выбор парсера для разных банков"""
    print("\n🧪 Тестирование выбора парсера...")
    
    banks = ['Kaspi', 'Forte', 'Halyk', 'Jusan', 'Onlinebank', 'Other', 'Unknown']
    
    for bank in banks:
        parser = get_parser(bank)
        parser_name = parser.__class__.__name__
        print(f"  🏦 {bank} → {parser_name}")

def compare_parsers():
    """Сравнивает старый и новый парсеры"""
    print("\n🧪 Сравнение парсеров...")
    
    # Ищем txt файлы
    txt_files = [f for f in os.listdir('.') if f.endswith('.txt')]
    
    if not txt_files:
        print("❌ Не найдено txt файлов для сравнения")
        return
    
    try:
        # Импортируем старый парсер
        from parser import parse_1c_files as parse_1c_files_old
        
        print("📊 Сравнение результатов:")
        
        # Старый парсер
        old_records = parse_1c_files_old(txt_files)
        print(f"  Старый парсер: {len(old_records)} операций")
        
        # Новый парсер
        new_records = parse_1c_files_improved(txt_files)
        print(f"  Новый парсер: {len(new_records)} операций")
        
        # Анализируем различия
        if len(new_records) > len(old_records):
            print(f"  ✅ Новый парсер нашел на {len(new_records) - len(old_records)} операций больше")
        elif len(new_records) < len(old_records):
            print(f"  ⚠️  Новый парсер нашел на {len(old_records) - len(new_records)} операций меньше")
        else:
            print(f"  ➡️  Количество операций одинаково")
        
        # Проверяем качество данных
        old_valid = sum(1 for r in old_records if r.get('ДатаОперации') and r.get('Контрагент'))
        new_valid = sum(1 for r in new_records if r.get('ДатаОперации') and r.get('Контрагент'))
        
        print(f"  Старый парсер: {old_valid}/{len(old_records)} записей с полными данными")
        print(f"  Новый парсер: {new_valid}/{len(new_records)} записей с полными данными")
        
    except ImportError:
        print("❌ Не удалось импортировать старый парсер для сравнения")

def generate_report(results_1c: List[Dict], results_pdf: List[Dict]):
    """Генерирует отчет о тестировании"""
    print("\n📊 ОТЧЕТ О ТЕСТИРОВАНИИ")
    print("=" * 50)
    
    print(f"1C файлы: {len(results_1c)} операций")
    print(f"PDF файлы: {len(results_pdf)} операций")
    print(f"Всего: {len(results_1c) + len(results_pdf)} операций")
    
    # Анализируем типы операций
    if results_1c:
        types_1c = {}
        for record in results_1c:
            t = record.get('ТипТранзакции', 'Unknown')
            types_1c[t] = types_1c.get(t, 0) + 1
        
        print(f"\nТипы операций в 1C файлах:")
        for t, count in types_1c.items():
            print(f"  {t}: {count}")
    
    if results_pdf:
        types_pdf = {}
        for record in results_pdf:
            t = record.get('Тип', 'Unknown')
            types_pdf[t] = types_pdf.get(t, 0) + 1
        
        print(f"\nТипы операций в PDF файлах:")
        for t, count in types_pdf.items():
            print(f"  {t}: {count}")
    
    # Сохраняем результаты в JSON
    all_results = {
        '1c_records': results_1c,
        'pdf_records': results_pdf,
        'summary': {
            'total_1c': len(results_1c),
            'total_pdf': len(results_pdf),
            'total_all': len(results_1c) + len(results_pdf)
        }
    }
    
    with open('test_results.json', 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Результаты сохранены в test_results.json")

def main():
    """Основная функция тестирования"""
    print("🚀 ТЕСТИРОВАНИЕ УЛУЧШЕННОГО ПАРСИНГА")
    print("=" * 50)
    
    # Тестируем выбор парсера
    test_parser_selection()
    
    # Тестируем парсинг 1C файлов
    results_1c = test_1c_parsing()
    
    # Тестируем парсинг PDF файлов
    results_pdf = test_pdf_parsing()
    
    # Сравниваем парсеры
    compare_parsers()
    
    # Генерируем отчет
    generate_report(results_1c, results_pdf)
    
    print("\n✅ Тестирование завершено!")

if __name__ == "__main__":
    main()


