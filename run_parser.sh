#!/bin/bash

# Добавляем pip в PATH
export PATH="$HOME/.local/bin:$PATH"

# Запускаем парсер
python3 pdf_parser.py
