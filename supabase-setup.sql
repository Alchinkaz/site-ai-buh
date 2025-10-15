-- Создание таблицы employees
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  salary INTEGER NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT,
  social_media TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive', 'dismissed')),
  work_schedule VARCHAR(100),
  hire_date DATE,
  dismiss_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

-- Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггера для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Вставка начальных данных
-- Таблица посещаемости: часы по дням месяца
CREATE TABLE IF NOT EXISTS attendance (
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL, -- 1-12
  hours JSONB NOT NULL DEFAULT '{}'::jsonb, -- {"1":"8","2":"Н","3":"0", ...}
  PRIMARY KEY (employee_id, year, month)
);

-- Метаданные посещаемости: произвольные нерабочие дни месяца
CREATE TABLE IF NOT EXISTS attendance_meta (
  year INTEGER NOT NULL,
  month INTEGER NOT NULL, -- 1-12
  non_working_days JSONB NOT NULL DEFAULT '[]'::jsonb, -- [1,2,3]
  PRIMARY KEY (year, month)
);

INSERT INTO employees (name, position, salary, email, phone, address, social_media, status, work_schedule, hire_date) VALUES
('Айгуль Нурланова', 'Главный бухгалтер', 500000, 'aigul@company.kz', '+7 777 123 4567', NULL, NULL, 'active', 'full-time', '2023-01-15'),
('Ерлан Сапаров', 'Финансовый директор', 600000, 'erlan@company.kz', '+7 777 234 5678', NULL, NULL, 'active', 'full-time', '2022-11-20'),
('Динара Касымова', 'Бухгалтер', 350000, 'dinara@company.kz', '+7 777 345 6789', NULL, NULL, 'active', 'full-time', '2023-03-10'),
('Асель Токтарова', 'Помощник бухгалтера', 280000, 'asel@company.kz', '+7 777 456 7890', NULL, NULL, 'pending', 'part-time', '2024-01-05'),
('Нурлан Абдуллаев', 'Аудитор', 450000, 'nurlan@company.kz', '+7 777 567 8901', NULL, NULL, 'active', 'flexible', '2023-08-15'),
('Гульнара Смагулова', 'Экономист', 400000, 'gulnara@company.kz', '+7 777 678 9012', NULL, NULL, 'active', 'full-time', '2023-06-20')
ON CONFLICT (id) DO NOTHING;

-- Настройка RLS (Row Level Security) - разрешаем все операции для анонимных пользователей
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Создание политики для анонимного доступа (для демонстрации)
CREATE POLICY "Allow all operations for anonymous users" ON employees
FOR ALL USING (true) WITH CHECK (true);
