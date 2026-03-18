/**
 * Stratego.AI — Orchestrator v2
 * Pipeline multi-agente para planos de negócio estruturados.
 * Sprint 2 — email via dynamic import (opcional, não bloqueia build)
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export interface BusinessPlanInput {
  job_id: string
  ideia: string
  sector: string
  publico: string
  localizacao: string
  investimento: string
  diferencial: string
  objetivo: string
  email?: string
  nome?: string
}

export interface BusinessPlanOutput {
  resumo_executivo: string
  analise_mercado: string
  estrategia_comercial: string
  plano_financeiro: string
  plano_operacional: string
  marketing_comunicacao: string
  proximos_passos: string
}

function buildContexto(input: BusinessPlanInput): string {
  return `IDEIA: ${input.ideia}
SECTOR: ${input.sector}
CLIENTE: ${input.publico}
LOCALIZAÇÃO: ${input.localizacao}
INVESTIMENTO: ${input.investimento}
DIFERENCIAL: ${input.diferencial}
OBJECTIVO: ${input.objetivo}`.trim()
}

async function updatePlanStatus(job_id: string, status: string, content?: string) {
  const update: Record<string, unknown> = { status }
  if (content !== undefined) update.content = content
  await supabase.from('plans').update(update).eq('job_id', job_id)
}

async function runAnalista(contexto: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.4,
    max_tokens: 1800,
    messages: [
      {
        role: 'system',
        content: `És um analista de negócios experiente especializado no mercado português.
Respondes sempre em Português de Portugal, com linguagem clara e profissional.`,
      },
      {
        role: 'user',
        content: `Analisa esta ideia de negócio para o mercado português:

${contexto}

Fornece:
1. Panorama do mercado em Portugal (dimensão, tendências)
2. Principais concorrentes directos e indirectos
3. Perfil do cliente-alvo (comportamento, necessidades, poder de compra)
4. Oportunidades não exploradas neste sector
5. Principais riscos e barreiras à entrada
6. Benchmarks financeiros típicos (margens, ticket médio, break-even típico)

Sê específico e inclui dados concretos onde possível.`,
      },
    ],
  })
  return res.choices[0].message.content ?? ''
}

async function runEstrategaA(contexto: string, analise: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    temperature: 0.6 as never,
    messages: [{
      role: 'user',
      content: `Com base na análise de mercado abaixo, desenvolve a ESTRATÉGIA COMERCIAL e o PLANO FINANCEIRO.

ANÁLISE DE MERCADO:
${analise}

CONTEXTO:
${contexto}

## ESTRATÉGIA COMERCIAL
- Posicionamento e proposta de valor única
- Modelo de receita (fontes de receita, estrutura de preços)
- Estratégia para captar os primeiros 100 clientes
- Canais de distribuição e parcerias

## PLANO FINANCEIRO
- Investimento inicial discriminado
- Estrutura de custos fixos e variáveis mensais
- Projecção de receitas para 12 meses (conservador / realista / optimista)
- Break-even estimado em meses
- Fontes de financiamento sugeridas (capital próprio, BPI, IAPMEI, etc.)

Usa tabelas em markdown onde ajude. Sê conservador nas projecções.`,
    }],
  })
  const block = msg.content[0]
  return block.type === 'text' ? block.text : ''
}

async function runEstrategaB(contexto: string, analise: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    temperature: 0.6 as never,
    messages: [{
      role: 'user',
      content: `Com base na análise de mercado abaixo, desenvolve o PLANO OPERACIONAL e o PLANO DE MARKETING.

ANÁLISE DE MERCADO:
${analise}

CONTEXTO:
${contexto}

## PLANO OPERACIONAL
- Estrutura organizacional inicial
- Processos-chave do negócio
- Tecnologia e ferramentas necessárias
- KPIs operacionais semanais

## MARKETING E COMUNICAÇÃO
- Identidade de marca e mensagem central
- Mix de marketing para os primeiros 6 meses
- Presença digital (website, redes sociais, SEO)
- Acções de lançamento para os primeiros 30 dias
- Budget de marketing sugerido

Sê prático e accionável com recursos limitados.`,
    }],
  })
  const block = msg.content[0]
  return block.type === 'text' ? block.text : ''
}

async function runRevisor(
  contexto: string, analise: string,
  estrategiaA: string, estrategiaB: string
): Promise<string> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 2500,
    messages: [
      {
        role: 'system',
        content: `És um revisor sénior de planos de negócio. Sintetizas contributos de estrategas,
eliminando contradições e reforçando os pontos mais fortes. Respondes em Português de Portugal.`,
      },
      {
        role: 'user',
        content: `Sintetiza os dois contributos num plano de negócio coerente.

CONTEXTO: ${contexto}

ANÁLISE: ${analise}

ESTRATEGA A (Comercial + Financeiro): ${estrategiaA}

ESTRATEGA B (Operacional + Marketing): ${estrategiaB}

Produz uma síntese que:
1. Mantém os melhores elementos de cada estratega
2. Resolve contradições (usa sempre o cenário mais conservador para finanças)
3. Inclui RESUMO EXECUTIVO de 3-4 parágrafos no início
4. Inclui PRÓXIMOS PASSOS com 10 acções para os próximos 90 dias
5. Estrutura com secções claras em markdown`,
      },
    ],
  })
  return res.choices[0].message.content ?? ''
}

async function runFinalizador1(sintese: string): Promise<Record<string, string>> {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2500,
    messages: [{
      role: 'user',
      content: `Da seguinte síntese de plano de negócio, extrai e melhora estas 4 secções:
"resumo_executivo", "analise_mercado", "estrategia_comercial", "plano_financeiro"

SÍNTESE:
${sintese}

Para cada secção:
- Mantém toda a informação substantiva
- Melhora fluidez em Português de Portugal
- Usa markdown correctamente
- Tom profissional mas acessível

Devolve APENAS um JSON válido com exactamente estas chaves:
{"resumo_executivo": "...", "analise_mercado": "...", "estrategia_comercial": "...", "plano_financeiro": "..."}`,
    }],
  })
  const block = msg.content[0]
  const text = block.type === 'text' ? block.text : '{}'
  try {
    const match = text.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : {}
  } catch { return {} }
}

async function runFinalizador2(sintese: string): Promise<Record<string, string>> {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2500,
    messages: [{
      role: 'user',
      content: `Da seguinte síntese de plano de negócio, extrai e melhora estas 3 secções:
"plano_operacional", "marketing_comunicacao", "proximos_passos"

SÍNTESE:
${sintese}

Para "proximos_passos": lista numerada de 10 acções com prazo (Semana 1, Mês 1, Mês 2-3, etc.)

Devolve APENAS um JSON válido com exactamente estas chaves:
{"plano_operacional": "...", "marketing_comunicacao": "...", "proximos_passos": "..."}`,
    }],
  })
  const block = msg.content[0]
  const text = block.type === 'text' ? block.text : '{}'
  try {
    const match = text.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : {}
  } catch { return {} }
}

async function sendPlanEmail(email: string, nome: string, ideia: string, job_id: string) {
  try {
    // Dynamic import — não falha o build se resend não estiver instalado
    const resendPkg = await import('resend').catch(() => null)
    if (!resendPkg || !process.env.RESEND_API_KEY) return
    const { Resend } = resendPkg
    const resend = new Resend(process.env.RESEND_API_KEY)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stratego.miguelsilvalab.pt'
    await resend.emails.send({
      from: 'Stratego.AI <noreply@stratego-ai.com>',
      to: email,
      subject: `O teu plano de negócio está pronto — ${ideia.slice(0, 50)}`,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
        <h1 style="color:#e8432d">O teu plano de negócio está pronto 🚀</h1>
        <p>Olá${nome ? \` ${nome}\` : ''},</p>
        <p>O teu plano para <strong>${ideia}</strong> foi gerado com sucesso.</p>
        <a href="${appUrl}/stratego/resultado/${job_id}"
           style="display:inline-block;background:#e8432d;color:white;padding:14px 28px;
                  border-radius:12px;text-decoration:none;font-weight:600;margin:24px 0">
          Ver o meu plano →
        </a>
        <p style="color:#999;font-size:13px">Stratego.AI — De ideia a negócio em 2 minutos</p>
      </div>`,
    })
  } catch (err) {
    console.error('[orchestrator-v2] Email error:', err)
  }
}

export async function generateBusinessPlan(input: BusinessPlanInput): Promise<BusinessPlanOutput> {
  const { job_id } = input
  const contexto = buildContexto(input)

  try {
    await updatePlanStatus(job_id, 'analysing')
    const analise = await runAnalista(contexto)

    await updatePlanStatus(job_id, 'strategising')
    const [estrategiaA, estrategiaB] = await Promise.all([
      runEstrategaA(contexto, analise),
      runEstrategaB(contexto, analise),
    ])

    await updatePlanStatus(job_id, 'reviewing')
    const sintese = await runRevisor(contexto, analise, estrategiaA, estrategiaB)

    await updatePlanStatus(job_id, 'finalising')
    const [g1, g2] = await Promise.all([
      runFinalizador1(sintese),
      runFinalizador2(sintese),
    ])

    const output: BusinessPlanOutput = {
      resumo_executivo:     g1.resumo_executivo     || extrairSeccao(sintese, 'resumo'),
      analise_mercado:      g1.analise_mercado      || analise,
      estrategia_comercial: g1.estrategia_comercial || estrategiaA,
      plano_financeiro:     g1.plano_financeiro     || '',
      plano_operacional:    g2.plano_operacional    || estrategiaB,
      marketing_comunicacao:g2.marketing_comunicacao|| '',
      proximos_passos:      g2.proximos_passos      || '',
    }

    await updatePlanStatus(job_id, 'done', JSON.stringify(output))

    if (input.email) {
      sendPlanEmail(input.email, input.nome ?? '', input.ideia, job_id)
    }

    return output
  } catch (err) {
    console.error('[orchestrator-v2] Pipeline error:', err)
    await updatePlanStatus(job_id, 'error')
    throw err
  }
}

function extrairSeccao(texto: string, chave: string): string {
  const patterns: Record<string, RegExp> = {
    resumo: /##\s*resumo executivo([\s\S]*?)(?=##|$)/i,
    mercado: /##\s*an[aá]lise de mercado([\s\S]*?)(?=##|$)/i,
  }
  const match = texto.match(patterns[chave] ?? /$/i)
  return match?.[1]?.trim() ?? ''
}
