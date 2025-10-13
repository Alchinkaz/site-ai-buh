-- Schema for incomes/expenses (transactions) and categories

-- 1) Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'KZT',
  category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT,
  method TEXT, -- cash, bank, card, etc.
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT,         -- manual, chat, import, etc.
  source_ref TEXT      -- external reference (e.g., message id)
);

-- 3) Chat ingest queue for future auto-import from chat
CREATE TABLE IF NOT EXISTS public.chat_ingest_queue (
  id SERIAL PRIMARY KEY,
  message_text TEXT NOT NULL,
  parsed_json JSONB,          -- parsed extraction result
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processed','failed')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Function to keep updated_at current
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON public.transactions(occurred_at);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);

-- RLS enablement
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_ingest_queue ENABLE ROW LEVEL SECURITY;

-- Simple demo policies (adjust in production)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Allow all for anon'
  ) THEN
    CREATE POLICY "Allow all for anon" ON public.categories FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'Allow all for anon'
  ) THEN
    CREATE POLICY "Allow all for anon" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_ingest_queue' AND policyname = 'Allow all for anon'
  ) THEN
    CREATE POLICY "Allow all for anon" ON public.chat_ingest_queue FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Seed data
INSERT INTO public.categories (name, type)
VALUES
  ('Зарплата', 'income'),
  ('Продажи', 'income'),
  ('Транспорт', 'expense'),
  ('Аренда', 'expense'),
  ('Офис', 'expense')
ON CONFLICT DO NOTHING;


