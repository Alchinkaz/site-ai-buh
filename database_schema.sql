-- SQL схема для AI Accountant
-- Выполните эти команды в Supabase SQL Editor

-- 1. Создание таблицы компаний
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bin_iin VARCHAR(20) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Создание таблицы счетов
CREATE TABLE IF NOT EXISTS accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    account_number VARCHAR(50) NOT NULL,
    bank_name VARCHAR(255),
    account_type VARCHAR(50) DEFAULT 'current',
    is_our_account BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, account_number)
);

-- 3. Создание таблицы категорий
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Создание таблицы транзакций
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Основная информация о транзакции
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer')),
    operation_date DATE NOT NULL,
    document_date DATE,
    document_number VARCHAR(100),
    document_type VARCHAR(100),
    
    -- Суммы
    amount_expense DECIMAL(15,2) DEFAULT 0,
    amount_income DECIMAL(15,2) DEFAULT 0,
    amount_total DECIMAL(15,2) GENERATED ALWAYS AS (amount_expense + amount_income) STORED,
    
    -- Счета
    payer_account VARCHAR(50),
    receiver_account VARCHAR(50),
    from_account VARCHAR(50),
    to_account VARCHAR(50),
    
    -- Контрагенты
    payer_name VARCHAR(500),
    receiver_name VARCHAR(500),
    payer_bin_iin VARCHAR(20),
    receiver_bin_iin VARCHAR(20),
    
    -- Дополнительная информация
    payment_purpose TEXT,
    payment_code VARCHAR(100),
    counterparty VARCHAR(500),
    category VARCHAR(100),
    
    -- Связи с другими таблицами
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    from_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    
    -- Метаданные
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Индексы для быстрого поиска
    CONSTRAINT valid_amounts CHECK (
        (transaction_type = 'expense' AND amount_expense > 0 AND amount_income = 0) OR
        (transaction_type = 'income' AND amount_income > 0 AND amount_expense = 0) OR
        (transaction_type = 'transfer' AND (amount_expense > 0 OR amount_income > 0))
    )
);

-- 5. Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_operation_date ON transactions(operation_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_amounts ON transactions(amount_expense, amount_income);
CREATE INDEX IF NOT EXISTS idx_transactions_accounts ON transactions(payer_account, receiver_account);
CREATE INDEX IF NOT EXISTS idx_transactions_counterparty ON transactions(counterparty);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- 6. Создание индексов для счетов
CREATE INDEX IF NOT EXISTS idx_accounts_company_id ON accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_number ON accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_accounts_our_accounts ON accounts(is_our_account) WHERE is_our_account = true;

-- 7. Создание триггеров для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Вставка базовых данных
-- Добавляем нашу компанию
INSERT INTO companies (name, bin_iin) 
VALUES ('ALCHIN', NULL)
ON CONFLICT (bin_iin) DO NOTHING;

-- Добавляем наши счета
INSERT INTO accounts (company_id, account_number, bank_name, is_our_account)
SELECT 
    c.id,
    account_data.account_number,
    account_data.bank_name,
    true
FROM companies c
CROSS JOIN (VALUES 
    ('KZ87722C000022014099', 'Kaspi Bank'),
    ('KZ88722S000040014444', 'Kaspi Pay'),
    ('KZ9496511F0008314291', 'ForteBank')
) AS account_data(account_number, bank_name)
WHERE c.name = 'ALCHIN'
ON CONFLICT (company_id, account_number) DO NOTHING;

-- Добавляем базовые категории
INSERT INTO categories (name, type, color) VALUES
    ('Доходы', 'income', '#10B981'),
    ('Расходы', 'expense', '#EF4444'),
    ('Переводы', 'transfer', '#3B82F6'),
    ('Зарплата', 'income', '#10B981'),
    ('Продажи', 'income', '#10B981'),
    ('Закупки', 'expense', '#EF4444'),
    ('Аренда', 'expense', '#EF4444'),
    ('Коммунальные услуги', 'expense', '#EF4444'),
    ('Налоги', 'expense', '#EF4444'),
    ('Перевод между счетами', 'transfer', '#3B82F6')
ON CONFLICT DO NOTHING;

-- 9. Создание представлений для аналитики
CREATE OR REPLACE VIEW transaction_summary AS
SELECT 
    t.id,
    t.operation_date,
    t.transaction_type,
    t.amount_expense,
    t.amount_income,
    t.amount_total,
    t.counterparty,
    t.category,
    t.payment_purpose,
    c.name as company_name,
    cat.name as category_name,
    cat.color as category_color
FROM transactions t
LEFT JOIN companies c ON t.company_id = c.id
LEFT JOIN categories cat ON t.category_id = cat.id
ORDER BY t.operation_date DESC;

-- 10. Создание функции для получения статистики
CREATE OR REPLACE FUNCTION get_transaction_stats(
    company_uuid UUID DEFAULT NULL,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_income DECIMAL(15,2),
    total_expense DECIMAL(15,2),
    net_amount DECIMAL(15,2),
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount_income ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount_expense ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount_income ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount_expense ELSE 0 END), 0) as net_amount,
        COUNT(*) as transaction_count
    FROM transactions t
    WHERE 
        (company_uuid IS NULL OR t.company_id = company_uuid)
        AND (start_date IS NULL OR t.operation_date >= start_date)
        AND (end_date IS NULL OR t.operation_date <= end_date);
END;
$$ LANGUAGE plpgsql;

-- 11. Настройка Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Политики безопасности (для анонимного доступа - можно изменить позже)
CREATE POLICY "Allow all operations for anonymous users" ON companies
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for anonymous users" ON accounts
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for anonymous users" ON categories
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for anonymous users" ON transactions
    FOR ALL USING (true);

-- 12. Комментарии к таблицам
COMMENT ON TABLE companies IS 'Таблица компаний';
COMMENT ON TABLE accounts IS 'Таблица банковских счетов';
COMMENT ON TABLE categories IS 'Таблица категорий транзакций';
COMMENT ON TABLE transactions IS 'Основная таблица транзакций';

COMMENT ON COLUMN transactions.transaction_type IS 'Тип транзакции: income, expense, transfer';
COMMENT ON COLUMN transactions.amount_total IS 'Общая сумма (вычисляемое поле)';
COMMENT ON COLUMN transactions.counterparty IS 'Контрагент по сделке';
COMMENT ON COLUMN transactions.category IS 'Категория транзакции (строка)';

-- 13. Идемпотентная настройка синхронизации: transaction_hash и уникальный индекс
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'transactions' AND column_name = 'transaction_hash'
    ) THEN
        ALTER TABLE transactions ADD COLUMN transaction_hash TEXT;
    END IF;
END $$;

DROP INDEX IF EXISTS ux_transactions_company_hash;
CREATE UNIQUE INDEX IF NOT EXISTS ux_transactions_company_hash
    ON transactions (company_id, transaction_hash);

-- 14. Регистрация псевдо-счета кассы (CASH)
INSERT INTO accounts (company_id, account_number, bank_name, account_type, is_our_account)
SELECT c.id, 'CASH', 'Cash Desk', 'cash', TRUE
FROM companies c
WHERE c.name = 'ALCHIN'
ON CONFLICT (company_id, account_number) DO NOTHING;
