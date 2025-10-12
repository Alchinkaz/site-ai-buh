# Настройка Supabase для AI Accountant

## Шаги настройки

### 1. Создание таблицы employees

Выполните SQL скрипт из файла `supabase-setup.sql` в SQL Editor вашего Supabase проекта:

```sql
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
```

### 2. Проверка подключения

После выполнения SQL скрипта:

1. Перейдите в раздел "Table Editor" в Supabase Dashboard
2. Убедитесь, что таблица `employees` создана
3. Проверьте, что в таблице есть начальные данные

### 3. Настройка RLS (Row Level Security)

Для продакшена рекомендуется настроить более строгие политики безопасности:

```sql
-- Удалить демо-политику
DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON employees;

-- Создать более безопасные политики (пример)
CREATE POLICY "Enable read access for all users" ON employees
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON employees
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON employees
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON employees
FOR DELETE USING (auth.role() = 'authenticated');
```

## Структура таблицы

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PRIMARY KEY | Уникальный идентификатор |
| name | VARCHAR(255) | ФИО сотрудника |
| position | VARCHAR(255) | Должность |
| salary | INTEGER | Зарплата в тенге |
| email | VARCHAR(255) | Email адрес |
| phone | VARCHAR(50) | Номер телефона |
| address | TEXT | Адрес (необязательно) |
| social_media | TEXT | Социальные сети (необязательно) |
| status | VARCHAR(20) | Статус: active, pending, inactive, dismissed |
| work_schedule | VARCHAR(100) | График работы |
| hire_date | DATE | Дата приема на работу |
| dismiss_date | DATE | Дата увольнения |
| created_at | TIMESTAMP | Дата создания записи |
| updated_at | TIMESTAMP | Дата последнего обновления |

## Функциональность

После настройки приложение будет:

- ✅ Автоматически загружать сотрудников из Supabase
- ✅ Синхронизировать все изменения (добавление, редактирование, удаление, увольнение)
- ✅ Показывать состояние загрузки
- ✅ Обрабатывать ошибки подключения
- ✅ Автоматически рассчитывать налоги при изменении зарплаты

## Безопасность

⚠️ **Важно**: Текущая настройка разрешает анонимный доступ ко всем операциям. Для продакшена обязательно настройте аутентификацию и более строгие политики RLS.
