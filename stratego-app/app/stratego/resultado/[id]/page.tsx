/**
 * Stratego.AI — Página de resultado v2.5 (RSC)
 * Carrega o plano do Supabase e passa para ResultadoClientV2.
 * Substitui a página anterior (guardada em page.v1.tsx).
 */

import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import ResultadoClientV2 from './ResultadoClientV2'
import type { BusinessPlanOutput } from '@/lib/ai/orchestrator-v2'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ResultadoPage({ params }: PageProps) {
  const { id: jobId } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const { data, error } = await supabase
    .from('plans')
    .select('content, status, lead_email')
    .eq('job_id', jobId)
    .single()

  if (error || !data || data.status !== 'done' || !data.content) {
    // Se o plano ainda não está pronto ou não existe
    if (data?.status && data.status !== 'done' && data.status !== 'error') {
      // Redireciona para o loading
      return (
        <main
          className="stratego-hero flex items-center justify-center min-h-screen"
          style={{ background: 'var(--dark)' }}
        >
          <div className="text-center px-5">
            <p
              style={{
                fontFamily: 'var(--font-syne)',
                fontSize: '1.2rem',
                color: 'var(--white)',
              }}
            >
              O teu plano ainda está a ser gerado…
            </p>
            <p
              className="mt-2 text-sm"
              style={{ color: 'var(--w50)', fontFamily: 'var(--font-dm-sans)' }}
            >
              Aguarda um momento e actualiza a página.
            </p>
          </div>
        </main>
      )
    }
    return notFound()
  }

  // Tenta parsear como BusinessPlanOutput (JSON estruturado do orchestrator-v2)
  // Se falhar, trata como markdown antigo (orchestrator-v1)
  let plan: BusinessPlanOutput
  try {
    const parsed = JSON.parse(data.content)
    // Verifica se tem a estrutura esperada do v2
    if (parsed.resumo_executivo) {
      plan = parsed as BusinessPlanOutput
    } else {
      // Plano v1 (markdown puro) — converte para formato v2
      plan = convertV1ToV2(data.content)
    }
  } catch {
    plan = convertV1ToV2(data.content)
  }

  // Extrai a ideia do resumo (campo não guardado separadamente no v1)
  const ideia = extractIdeia(plan.resumo_executivo)

  return (
    <ResultadoClientV2
      plan={plan}
      jobId={jobId}
      ideia={ideia}
      leadEmail={data.lead_email ?? null}
    />
  )
}

/* ── Compatibilidade com planos v1 (markdown puro) ─────── */

function convertV1ToV2(markdown: string): BusinessPlanOutput {
  return {
    resumo_executivo:      extractSection(markdown, ['resumo', 'sumário']) || markdown.slice(0, 800),
    analise_mercado:       extractSection(markdown, ['mercado', 'análise']),
    estrategia_comercial:  extractSection(markdown, ['estratégia comercial', 'estratégia']),
    plano_financeiro:      extractSection(markdown, ['financeiro', 'finanças']),
    plano_operacional:     extractSection(markdown, ['operacional', 'operações']),
    marketing_comunicacao: extractSection(markdown, ['marketing', 'comunicação']),
    proximos_passos:       extractSection(markdown, ['próximos passos', 'acções', 'plano de acção']),
  }
}

function extractSection(text: string, keywords: string[]): string {
  for (const kw of keywords) {
    const regex = new RegExp(`##\\s*${kw}[^\\n]*\\n([\\s\\S]*?)(?=##|$)`, 'i')
    const match = text.match(regex)
    if (match?.[1]) return match[1].trim()
  }
  return ''
}

function extractIdeia(resumo: string): string {
  // Tenta extrair a ideia do resumo executivo
  const lines = resumo.split('\n').filter(l => l.trim())
  if (lines.length > 0) {
    // Primeira frase significativa
    const first = lines[0].replace(/^#+\s*/, '').replace(/\*\*/g, '').trim()
    return first.length > 80 ? first.slice(0, 80) + '…' : first
  }
  return ''
}

export async function generateMetadata({ params }: PageProps) {
  const { id: jobId } = await params
  return {
    title: `Plano de negócio — Stratego.AI`,
    description: `Plano de negócio gerado por IA. Job: ${jobId}`,
    robots: { index: false },
  }
}
