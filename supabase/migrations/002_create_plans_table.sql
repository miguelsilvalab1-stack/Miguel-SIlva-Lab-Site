-- ===========================================
-- Tabela: plans (Stratego.AI v2)
-- Documenta o schema usado em produção pelo orchestrator-v2.
-- A tabela já existe em produção (criada manualmente);
-- este ficheiro serve de referência e para recriar o ambiente.
-- ===========================================

CREATE TABLE IF NOT EXISTS public.plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    -- pending | analysing | strategising | reviewing | finalising | done | error
    content TEXT,                -- JSON com as 7 secções (BusinessPlanOutput)
    lead_email TEXT,             -- email associado após captura de lead
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plans_job_id_idx ON public.plans (job_id);
CREATE INDEX IF NOT EXISTS plans_status_idx ON public.plans (status);
CREATE INDEX IF NOT EXISTS plans_created_at_idx ON public.plans (created_at DESC);

-- Row Level Security: apenas o service_role (server-side) acede.
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role full access"
    ON public.plans
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE public.plans IS 'Planos de negócio gerados pela Stratego.AI (pipeline orchestrator-v2)';

-- ===========================================
-- Coluna updated_at na tabela leads (usada pelos upserts da app)
-- ===========================================
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS name TEXT;
