-- Простой скрипт для создания таблицы employees
-- Выполните этот скрипт в SQL Editor Supabase

-- 1. Создание таблицы
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

-- 2. Включение RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 3. Создание политики для анонимного доступа
CREATE POLICY "Enable all operations for anonymous users" ON employees
FOR ALL USING (true) WITH CHECK (true);

-- 4. Вставка тестовых данных
INSERT INTO employees (name, position, salary, email, phone, status, work_schedule, hire_date) VALUES
('Айгуль Нурланова', 'Главный бухгалтер', 500000, 'aigul@company.kz', '+7 777 123 4567', 'active', 'full-time', '2023-01-15'),
('Ерлан Сапаров', 'Финансовый директор', 600000, 'erlan@company.kz', '+7 777 234 5678', 'active', 'full-time', '2022-11-20'),
('Динара Касымова', 'Бухгалтер', 350000, 'dinara@company.kz', '+7 777 345 6789', 'active', 'full-time', '2023-03-10');
