# 🚨 Быстрое исправление ошибки Supabase

## Проблема
```
❌ Ошибка: Connection error: Could not find the table 'public.employees' in the schema cache
```

## Решение (2 минуты)

### 1. Откройте Supabase Dashboard
- Перейдите на [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Войдите в ваш проект

### 2. Перейдите в SQL Editor
- В левом меню выберите **"SQL Editor"**
- Нажмите **"New query"**

### 3. Скопируйте и выполните этот SQL скрипт:

```sql
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  salary INTEGER NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT,
  social_media TEXT,
  status VARCHAR(20) DEFAULT 'active',
  work_schedule VARCHAR(100),
  hire_date DATE,
  dismiss_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for anonymous users" ON employees
FOR ALL USING (true) WITH CHECK (true);

INSERT INTO employees (name, position, salary, email, phone, status, work_schedule, hire_date) VALUES
('Айгуль Нурланова', 'Главный бухгалтер', 500000, 'aigul@company.kz', '+7 777 123 4567', 'active', 'full-time', '2023-01-15'),
('Ерлан Сапаров', 'Финансовый директор', 600000, 'erlan@company.kz', '+7 777 234 5678', 'active', 'full-time', '2022-11-20'),
('Динара Касымова', 'Бухгалтер', 350000, 'dinara@company.kz', '+7 777 345 6789', 'active', 'full-time', '2023-03-10');
```

### 4. Нажмите "Run"
- Скрипт создаст таблицу и вставит тестовые данные
- Вы увидите сообщение об успешном выполнении

### 5. Обновите страницу приложения
- Перезагрузите страницу в браузере
- Должен появиться зеленый индикатор "Синхронизация с Supabase"

## ✅ Результат
После выполнения этих шагов:
- 🟢 Зеленый индикатор "Синхронизация с Supabase"
- ✅ Все операции CRUD будут синхронизироваться
- 📊 Данные сохраняются в облачной базе данных
- 🔄 Автоматическая синхронизация между устройствами

## 🔧 Если проблема остается
1. Проверьте, что вы находитесь в правильном проекте Supabase
2. Убедитесь, что URL проекта: `aigrzflspieakaoaptml.supabase.co`
3. Проверьте, что у вас есть права на создание таблиц
4. Попробуйте выполнить скрипт по частям

## 📞 Поддержка
Если проблема не решается, проверьте:
- Консоль браузера (F12) для дополнительных ошибок
- Логи Supabase в Dashboard
- Настройки RLS политик
