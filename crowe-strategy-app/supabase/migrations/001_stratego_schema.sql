-- =====================================================
-- STRATEGO.AI — Schema Supabase
-- Migração 001: plans + api_logs
-- =====================================================

-- Tipo enum para o estado do plano
CREATE TYPE plan_status AS ENUM (
  'pending',
  'analysing',
  'generating',
  'reviewing',
  'finalising',
  'completed',
  'failed'
);

-- =====================================================
-- Tabela: plans
-- =====================================================
CREATE TABLE IF NOT EXISTS plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tipo              TEXT NOT NULL DEFAULT 'marketing',
  status            plan_status NOT NULL DEFAULT 'pending',
  questionnaire_json JSONB,
  analyst_brief_json JSONB,
  final_markdown    TEXT,
  error_message     TEXT,
  custo_total_eur   NUMERIC(8, 4),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS plans_lead_id_idx ON plans(lead_id);
CREATE INDEX IF NOT EXISTS plans_status_idx ON plans(status);
CREATE INDEX IF NOT EXISTS plans_created_at_idx ON plans(created_at DESC);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Tabela: api_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS api_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  etapa           TEXT NOT NULL,        -- ex: 'analyst', 'strategist_p1', 'reviewer', 'finalizer_p2'
  modelo          TEXT NOT NULL,        -- ex: 'gpt-4o', 'claude-sonnet-4-5'
  tokens_input    INTEGER,
  tokens_output   INTEGER,
  custo_eur       NUMERIC(8, 6),
  duracao_ms      INTEGER,
  fallback        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_logs_plan_id_idx ON api_logs(plan_id);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- plans: apenas o service_role pode ler/escrever (frontend usa anon para SSE mas
-- o stream route usa supabaseAdmin)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on plans"
  ON plans FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Permitir SELECT público por UUID (para a página de resultado pública)
CREATE POLICY "Public read completed plans"
  ON plans FOR SELECT
  USING (status = 'completed');

-- api_logs: apenas service_role
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on api_logs"
  ON api_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- Leads: garantir que a tabela já existe (pode já existir)
-- Se não existir, criar estrutura mínima
-- =====================================================
CREATE TABLE IF NOT EXISTS leads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT NOT NULL UNIQUE,
  nome              TEXT,
  source            TEXT DEFAULT 'stratego',
  consent_marketing BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on leads"
  ON leads FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
