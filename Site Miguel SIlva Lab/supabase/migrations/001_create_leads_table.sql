-- ===========================================
-- Tabela: leads
-- Armazena emails capturados pelo lead magnet
-- ===========================================

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    source TEXT DEFAULT 'lead_magnet_guide',
    created_at TIMESTAMPTZ DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT
);

-- Indice unico no email para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_unique ON public.leads (email);

-- Indice para ordenacao por data
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at DESC);

-- Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT via anon key (para o formulario do site)
CREATE POLICY "Allow anonymous insert"
    ON public.leads
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Apenas service_role pode SELECT (painel admin)
CREATE POLICY "Only service role can read"
    ON public.leads
    FOR SELECT
    TO service_role
    USING (true);

-- Comentario na tabela
COMMENT ON TABLE public.leads IS 'Leads capturados pelo lead magnet do site Miguel Silva Lab';
COMMENT ON COLUMN public.leads.source IS 'Origem do lead: lead_magnet_guide, newsletter, etc.';
