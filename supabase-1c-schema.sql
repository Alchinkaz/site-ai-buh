-- SQL схема для интеграции с данными из 1C
-- Создание таблиц для хранения парсированных данных из файлов 1C

-- 1. Таблица для хранения информации о счетах компании
CREATE TABLE IF NOT EXISTS public.company_accounts (
  id SERIAL PRIMARY KEY,
  account_number VARCHAR(50) NOT NULL UNIQUE,
  bank_name VARCHAR(255),
  account_type VARCHAR(50), -- kaspi, forte, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Таблица для хранения контрагентов
CREATE TABLE IF NOT EXISTS public.counterparties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  bin_iin VARCHAR(20),
  account_number VARCHAR(50),
  is_our_company BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Основная таблица транзакций из 1C
CREATE TABLE IF NOT EXISTS public.transactions_1c (
  id SERIAL PRIMARY KEY,
  
  -- Основные поля из парсера
  payer_name VARCHAR(500),
  receiver_name VARCHAR(500),
  payer_bin_iin VARCHAR(20),
  receiver_bin_iin VARCHAR(20),
  payer_account VARCHAR(50),
  receiver_account VARCHAR(50),
  document_number VARCHAR(100),
  operation_date DATE,
  document_date DATE,
  expense_amount NUMERIC(14,2),
  income_amount NUMERIC(14,2),
  total_amount NUMERIC(14,2),
  payment_purpose TEXT,
  document_type VARCHAR(100),
  payment_code VARCHAR(50),
  
  -- Дополнительные поля из парсера
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer')),
  from_account VARCHAR(50),
  to_account VARCHAR(50),
  counterparty_name VARCHAR(500),
  category VARCHAR(100),
  
  -- Связи с другими таблицами
  payer_id INTEGER REFERENCES public.counterparties(id) ON DELETE SET NULL,
  receiver_id INTEGER REFERENCES public.counterparties(id) ON DELETE SET NULL,
  from_account_id INTEGER REFERENCES public.company_accounts(id) ON DELETE SET NULL,
  to_account_id INTEGER REFERENCES public.company_accounts(id) ON DELETE SET NULL,
  
  -- Метаданные
  source_file VARCHAR(255),
  import_batch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Таблица для отслеживания импортов
CREATE TABLE IF NOT EXISTS public.import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500),
  records_count INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 5. Таблица для категоризации транзакций
CREATE TABLE IF NOT EXISTS public.transaction_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  parent_id INTEGER REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Таблица для автоматической категоризации
CREATE TABLE IF NOT EXISTS public.category_rules (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES public.transaction_categories(id) ON DELETE CASCADE,
  rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('counterparty', 'purpose', 'amount')),
  rule_value TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_company_accounts_updated_at ON public.company_accounts;
CREATE TRIGGER update_company_accounts_updated_at
BEFORE UPDATE ON public.company_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_counterparties_updated_at ON public.counterparties;
CREATE TRIGGER update_counterparties_updated_at
BEFORE UPDATE ON public.counterparties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_1c_updated_at ON public.transactions_1c;
CREATE TRIGGER update_transactions_1c_updated_at
BEFORE UPDATE ON public.transactions_1c
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transaction_categories_updated_at ON public.transaction_categories;
CREATE TRIGGER update_transaction_categories_updated_at
BEFORE UPDATE ON public.transaction_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_transactions_1c_operation_date ON public.transactions_1c(operation_date);
CREATE INDEX IF NOT EXISTS idx_transactions_1c_transaction_type ON public.transactions_1c(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_1c_payer_account ON public.transactions_1c(payer_account);
CREATE INDEX IF NOT EXISTS idx_transactions_1c_receiver_account ON public.transactions_1c(receiver_account);
CREATE INDEX IF NOT EXISTS idx_transactions_1c_import_batch_id ON public.transactions_1c(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_1c_amount ON public.transactions_1c(expense_amount, income_amount);

CREATE INDEX IF NOT EXISTS idx_counterparties_bin_iin ON public.counterparties(bin_iin);
CREATE INDEX IF NOT EXISTS idx_counterparties_name ON public.counterparties(name);
CREATE INDEX IF NOT EXISTS idx_company_accounts_number ON public.company_accounts(account_number);

-- RLS (Row Level Security)
ALTER TABLE public.company_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions_1c ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_rules ENABLE ROW LEVEL SECURITY;

-- Политики для анонимного доступа (для демонстрации)
CREATE POLICY "Allow all for anon" ON public.company_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.counterparties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.transactions_1c FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.import_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.transaction_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.category_rules FOR ALL USING (true) WITH CHECK (true);

-- Вставка начальных данных
-- Счета компании ALCHIN
INSERT INTO public.company_accounts (account_number, bank_name, account_type) VALUES
('KZ87722C000022014099', 'Kaspi Bank', 'kaspi'),
('KZ88722S000040014444', 'Kaspi Pay', 'kaspi_pay'),
('KZ9496511F0008314291', 'ForteBank', 'forte')
ON CONFLICT (account_number) DO NOTHING;

-- Базовые категории
INSERT INTO public.transaction_categories (name, type) VALUES
('Зарплата', 'income'),
('Продажи', 'income'),
('Инвестиции', 'income'),
('Транспорт', 'expense'),
('Аренда', 'expense'),
('Офисные расходы', 'expense'),
('Коммунальные услуги', 'expense'),
('Перевод между счетами', 'transfer')
ON CONFLICT DO NOTHING;

-- Правила автоматической категоризации
INSERT INTO public.category_rules (category_id, rule_type, rule_value, priority) VALUES
((SELECT id FROM public.transaction_categories WHERE name = 'Зарплата'), 'purpose', 'зарплата', 10),
((SELECT id FROM public.transaction_categories WHERE name = 'Зарплата'), 'purpose', 'заработная плата', 10),
((SELECT id FROM public.transaction_categories WHERE name = 'Транспорт'), 'purpose', 'топливо', 5),
((SELECT id FROM public.transaction_categories WHERE name = 'Транспорт'), 'purpose', 'бензин', 5),
((SELECT id FROM public.transaction_categories WHERE name = 'Офисные расходы'), 'purpose', 'канцелярия', 5),
((SELECT id FROM public.transaction_categories WHERE name = 'Офисные расходы'), 'purpose', 'офис', 5)
ON CONFLICT DO NOTHING;

