/**
 * Stratego.AI — Orchestrator v2
 * Pipeline multi-agente para planos de negócio estruturados.
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase  = createClient(
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
  return [
    'IDEIA: ' + input.ideia,
    'SECTOR: ' + input.sector,
    'CLIENTE: ' + input.publico,
    'LOCALIZAÇÃO: ' + input.localizacao,
    'INVESTIMENTO: ' + input.investimento,
    'DIFERENCIAL: ' + input.diferencial,
    'OBJECTIVO: ' + input.objetivo,
  ].join('\n')
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
        content: 'És um analista de negócios especializado no mercado português. Respondes em Português de Portugal com linguagem clara e profissional.',
      },
      {
        role: 'user',
        content: 'Analisa esta ideia de negócio:\n\n' + contexto + '\n\nFornece:\n1. Panorama do mercado em Portugal\n2. Principais concorrentes directos e indirectos\n3. Perfil do cliente-alvo\n4. Oportunidades não exploradas\n5. Riscos e barreiras à entrada\n6. Benchmarks financeiros típicos do sector',
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
      content: 'Com base na análise abaixo, desenvolve a ESTRATÉGIA COMERCIAL e o PLANO FINANCEIRO.\n\nANÁLISE:\n' + analise + '\n\nCONTEXTO:\n' + contexto + '\n\n## ESTRATÉGIA COMERCIAL\n- Posicionamento e proposta de valor\n- Modelo de receita e preços\n- Estratégia para os primeiros 100 clientes\n- Canais de distribuição\n\n## PLANO FINANCEIRO\n- Investimento inicial discriminado\n- Custos fixos e variáveis mensais\n- Projecção de receitas 12 meses (conservador/realista/optimista)\n- Break-even estimado\n- Fontes de financiamento (capital próprio, BPI, IAPMEI)',
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
      content: 'Com base na análise abaixo, desenvolve o PLANO OPERACIONAL e o PLANO DE MARKETING.\n\nANÁLISE:\n' + analise + '\n\nCONTEXTO:\n' + contexto + '\n\n## PLANO OPERACIONAL\n- Estrutura organizacional inicial\n- Processos-chave do negócio\n- Tecnologia e ferramentas necessárias\n- KPIs operacionais\n\n## MARKETING E COMUNICAÇÃO\n- Identidade de marca e mensagem central\n- Mix de marketing para os primeiros 6 meses\n- Presença digital (website, redes sociais, SEO)\n- Acções de lançamento nos primeiros 30 dias\n- Budget de marketing sugerido',
    }],
  })
  const block = msg.content[0]
  return block.type === 'text' ? block.text : ''
}

async function runRevisor(contexto: string, analise: string, a: string, b: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 2500,
    messages: [
      {
        role: 'system',
        content: 'És um revisor sénior de planos de negócio. Sintetizas contributos eliminando contradições. Respondes em Português de Portugal.',
      },
      {
        role: 'user',
        content: 'Sintetiza os dois contributos num plano coerente.\n\nCONTEXTO:\n' + contexto + '\n\nANÁLISE:\n' + analise + '\n\nESTRATEGA A:\n' + a + '\n\nESTRATEGA B:\n' + b + '\n\nProduz:\n1. RESUMO EXECUTIVO (3-4 parágrafos)\n2. Síntese coerente de todas as secções\n3. PRÓXIMOS PASSOS com 10 acções concretas para 90 dias\n\nUsa secções claras em markdown.',
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
      content: 'Da síntese abaixo, extrai e melhora 4 secções.\n\nSÍNTESE:\n' + sintese + '\n\nMelhora a fluidez e clareza em Português de Portugal. Usa markdown correctamente.\n\nDevolve APENAS JSON com estas chaves exactas:\n{"resumo_executivo": "...", "analise_mercado": "...", "estrategia_comercial": "...", "plano_financeiro": "..."}',
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
      content: 'Da síntese abaixo, extrai e melhora 3 secções.\n\nSÍNTESE:\n' + sintese + '\n\nPara "proximos_passos": lista numerada de 10 acções com prazo (Semana 1, Mês 1, Mês 2-3).\n\nDevolve APENAS JSON com estas chaves exactas:\n{"plano_operacional": "...", "marketing_comunicacao": "...", "proximos_passos": "..."}',
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
    const resendPkg = await import('resend').catch(() => null)
    if (!resendPkg || !process.env.RESEND_API_KEY) return
    const { Resend } = resendPkg
    const resend = new Resend(process.env.RESEND_API_KEY)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stratego.miguelsilvalab.pt'
    const greeting = nome ? ('Ola ' + nome + ',') : 'Ola,'
    const planUrl = appUrl + '/stratego/resultado/' + job_id
    await resend.emails.send({
      from: 'Stratego.AI <noreply@stratego-ai.com>',
      to: email,
      subject: 'O teu plano de negocio esta pronto — ' + ideia.slice(0, 50),
      html: '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">'
        + '<h1 style="color:#e8432d">O teu plano de negocio esta pronto</h1>'
        + '<p>' + greeting + '</p>'
        + '<p>O teu plano para <strong>' + ideia + '</strong> foi gerado.</p>'
        + '<a href="' + planUrl + '" style="display:inline-block;background:#e8432d;color:white;'
        + 'padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;margin:24px 0">'
        + 'Ver o meu plano</a>'
        + '<p style="color:#999;font-size:13px">Stratego.AI</p>'
        + '</div>',
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
      resumo_executivo:      g1.resumo_executivo      ?? extrairSeccao(sintese, 'resumo'),
      analise_mercado:       g1.analise_mercado       ?? analise,
      estrategia_comercial:  g1.estrategia_comercial  ?? estrategiaA,
      plano_financeiro:      g1.plano_financeiro      ?? '',
      plano_operacional:     g2.plano_operacional     ?? estrategiaB,
      marketing_comunicacao: g2.marketing_comunicacao ?? '',
      proximos_passos:       g2.proximos_passos       ?? '',
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
