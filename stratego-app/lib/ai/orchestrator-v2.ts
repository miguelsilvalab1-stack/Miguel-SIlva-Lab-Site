/**
 * Stratego.AI — Orchestrator v2
 * Pipeline multi-agente para geração de planos de NEGÓCIO estruturados.
 * Substitui o orchestrator v1 (planos de marketing).
 *
 * Pipeline:
 *   Etapa 1 — Preparação do contexto
 *   Etapa 2 — GPT-4o: Analista (pesquisa de mercado + benchmarks)
 *   Etapa 3 — Claude Sonnet x2 paralelo: Estratega A + Estratega B
 *   Etapa 4 — GPT-4o: Revisor (síntese crítica dos dois estrategas)
 *   Etapa 5 — Claude Haiku x2 paralelo: Finalizador (linguagem + formatação)
 *   Etapa 6 — Composição do JSON final com 7 secções
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

/* ── Clientes ───────────────────────────────────────────── */

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

/* ── Tipos ──────────────────────────────────────────────── */

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

/* ── Helpers ────────────────────────────────────────────── */

function buildContexto(input: BusinessPlanInput): string {
  return `
IDEIA DE NEGÓCIO: ${input.ideia}
SECTOR: ${input.sector}
CLIENTE PRINCIPAL: ${input.publico}
LOCALIZAÇÃO / MODELO: ${input.localizacao}
INVESTIMENTO INICIAL: ${input.investimento}
DIFERENCIAL: ${input.diferencial}
OBJECTIVO PRINCIPAL: ${input.objetivo}
`.trim()
}

async function updatePlanStatus(
  job_id: string,
  status: string,
  content?: string
) {
  const update: Record<string, unknown> = { status }
  if (content) update.content = content
  await supabase.from('plans').update(update).eq('job_id', job_id)
}

/* ── Etapa 2: Analista (GPT-4o) ─────────────────────────── */

async function runAnalista(contexto: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.4,
    max_tokens: 1800,
    messages: [
      {
        role: 'system',
        content: `És um analista de negócios experiente especializado no mercado português e europeu.
Analisas ideias de negócio com rigor, identificando oportunidades, riscos e benchmarks reais.
Respondes sempre em Português de Portugal, com linguagem clara e profissional.
O teu output é usado por estrategas de negócio — sê preciso, denso em informação, sem floreados.`,
      },
      {
        role: 'user',
        content: `Analisa a seguinte ideia de negócio e fornece:
1. Panorama do mercado em Portugal (dimensão, tendências, crescimento previsto)
2. Principais concorrentes directos e indirectos
3. Perfil detalhado do cliente-alvo (comportamento, necessidades, poder de compra)
4. Oportunidades não exploradas neste sector
5. Principais riscos e barreiras à entrada
6. Benchmarks financeiros típicos do sector (margens, ticket médio, break-even típico)

CONTEXTO DO NEGÓCIO:
${contexto}

Sê específico para Portugal. Inclui dados e referências concretas onde possível.`,
      },
    ],
  })
  return res.choices[0].message.content ?? ''
}

/* ── Etapa 3: Estrategas (Claude Sonnet x2) ─────────────── */

async function runEstrategaA(
  contexto: string,
  analise: string
): Promise<string> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    temperature: 0.6,
    messages: [
      {
        role: 'user',
        content: `És um estratega de negócios focado em crescimento sustentável e rentabilidade.

Com base na análise de mercado abaixo, desenvolve a ESTRATÉGIA COMERCIAL e o PLANO FINANCEIRO para este negócio.

ANÁLISE DE MERCADO:
${analise}

CONTEXTO DO NEGÓCIO:
${contexto}

Desenvolve:

## ESTRATÉGIA COMERCIAL
- Posicionamento e proposta de valor única
- Modelo de receita detalhado (fontes de receita, estrutura de preços)
- Estratégia de captação dos primeiros 100 clientes
- Canais de distribuição e parcerias estratégicas
- Vantagem competitiva sustentável

## PLANO FINANCEIRO
- Investimento inicial discriminado por categoria
- Estrutura de custos fixos e variáveis mensais
- Projecção de receitas (cenário conservador / realista / optimista) para 12 meses
- Ponto de equilíbrio (break-even) em meses
- Necessidades de financiamento e fontes sugeridas (capital próprio, BPI, IAPMEI, etc.)

Usa tabelas em markdown quando ajudar à clareza. Sê conservador nas projecções financeiras.`,
      },
    ],
  })
  const block = msg.content[0]
  return block.type === 'text' ? block.text : ''
}

async function runEstrategaB(
  contexto: string,
  analise: string
): Promise<string> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    temperature: 0.6,
    messages: [
      {
        role: 'user',
        content: `És um estratega de negócios especializado em operações e marketing digital.

Com base na análise de mercado abaixo, desenvolve o PLANO OPERACIONAL e o PLANO DE MARKETING para este negócio.

ANÁLISE DE MERCADO:
${analise}

CONTEXTO DO NEGÓCIO:
${contexto}

Desenvolve:

## PLANO OPERACIONAL
- Estrutura organizacional inicial (funções, responsabilidades)
- Processos-chave do negócio (do lead ao cliente fidelizado)
- Tecnologia e ferramentas necessárias
- Fornecedores e parcerias operacionais
- Métricas de operação (KPIs) para acompanhar semanalmente

## MARKETING E COMUNICAÇÃO
- Identidade de marca e mensagem central
- Mix de marketing para os primeiros 6 meses
- Presença digital (website, redes sociais, SEO)
- Estratégia de conteúdo e calendário editorial
- Budget de marketing sugerido (% da receita prevista)
- Acções de lançamento para os primeiros 30 dias

Sê prático e accionável. Foca-te no que pode ser feito com recursos limitados.`,
      },
    ],
  })
  const block = msg.content[0]
  return block.type === 'text' ? block.text : ''
}

/* ── Etapa 4: Revisor (GPT-4o) ──────────────────────────── */

async function runRevisor(
  contexto: string,
  analise: string,
  estrategiaA: string,
  estrategiaB: string
): Promise<string> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 2500,
    messages: [
      {
        role: 'system',
        content: `És um revisor sénior de planos de negócio com 20 anos de experiência.
Recebes dois contributos de estrategas diferentes e sintetizas o melhor de cada um,
eliminando contradições, reforçando os pontos mais fortes e identificando lacunas.
O resultado final deve ser coerente, profissional e imediatamente accionável.
Respondes sempre em Português de Portugal.`,
      },
      {
        role: 'user',
        content: `Sintetiza os dois contributos dos estrategas num plano de negócio coerente.

CONTEXTO DO NEGÓCIO:
${contexto}

ANÁLISE DE MERCADO (Etapa 2):
${analise}

ESTRATEGA A — Estratégia Comercial + Financeiro:
${estrategiaA}

ESTRATEGA B — Operacional + Marketing:
${estrategiaB}

Produz uma síntese coerente que:
1. Mantém os melhores elementos de cada estratega
2. Resolve contradições (ex: se os financeiros são diferentes, usa o mais conservador)
3. Assegura consistência entre a estratégia comercial, financeira, operacional e de marketing
4. Adiciona um RESUMO EXECUTIVO de 3-4 parágrafos no início
5. Adiciona PRÓXIMOS PASSOS com as 10 acções concretas para os próximos 90 dias

Estrutura o output com secções claras em markdown.`,
      },
    ],
  })
  return res.choices[0].message.content ?? ''
}

/* ── Etapa 5: Finalizadores (Claude Haiku x2) ───────────── */

async function runFinalizadorSecoes(
  sintese: string,
  secoes: ('resumo' | 'mercado' | 'comercial' | 'financeiro')[]
): Promise<Record<string, string>> {
  const secaoLabels: Record<string, string> = {
    resumo: 'Resumo Executivo',
    mercado: 'Análise de Mercado',
    comercial: 'Estratégia Comercial e Plano Financeiro',
    financeiro: 'Plano Financeiro detalhado',
  }

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Refina e formata as seguintes secções do plano de negócio.

SÍNTESE COMPLETA:
${sintese}

Extrai e melhora estas secções: ${secoes.map(s => secaoLabels[s]).join(', ')}

Para cada secção:
- Mantém toda a informação substantiva
- Melhora a fluidez e clareza do português
- Garante que usa markdown correctamente (headers ##, listas, tabelas)
- Remove repetições e contradições
- Mantém um tom profissional mas acessível

Devolve um JSON válido com as chaves: ${secoes.map(s => `"${s}"`).join(', ')}
Apenas o JSON, sem mais nada.`,
      },
    ],
  })

  const block = msg.content[0]
  const text = block.type === 'text' ? block.text : '{}'
  try {
    // Extrai JSON mesmo que venha com texto à volta
    const match = text.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : {}
  } catch {
    return {}
  }
}

async function runFinalizadorSecoes2(
  sintese: string,
  secoes: ('operacional' | 'marketing' | 'proximos')[]
): Promise<Record<string, string>> {
  const secaoLabels: Record<string, string> = {
    operacional: 'Plano Operacional',
    marketing: 'Marketing e Comunicação',
    proximos: 'Próximos Passos',
  }

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Refina e formata as seguintes secções do plano de negócio.

SÍNTESE COMPLETA:
${sintese}

Extrai e melhora estas secções: ${secoes.map(s => secaoLabels[s]).join(', ')}

Para cada secção:
- Mantém toda a informação substantiva
- Melhora a fluidez e clareza do português
- Garante que usa markdown correctamente (headers ##, listas, tabelas)
- Remove repetições e contradições
- Mantém um tom profissional mas acessível

Para "proximos" cria uma lista numerada de 10 acções concretas com prazo (ex: "Semana 1", "Mês 1", "Mês 2-3").

Devolve um JSON válido com as chaves: ${secoes.map(s => `"${s}"`).join(', ')}
Apenas o JSON, sem mais nada.`,
      },
    ],
  })

  const block = msg.content[0]
  const text = block.type === 'text' ? block.text : '{}'
  try {
    const match = text.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : {}
  } catch {
    return {}
  }
}

/* ── Email ──────────────────────────────────────────────── */

async function sendPlanEmail(
  email: string,
  nome: string,
  ideia: string,
  job_id: string
) {
  try {
    await resend.emails.send({
      from: 'Stratego.AI <noreply@stratego-ai.com>',
      to: email,
      subject: `O teu plano de negócio está pronto — ${ideia.slice(0, 50)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
          <h1 style="color: #e8432d; font-size: 24px; margin-bottom: 8px;">
            O teu plano de negócio está pronto 🚀
          </h1>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Olá${nome ? ` ${nome}` : ''},
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            O teu plano de negócio para <strong>${ideia}</strong> foi gerado com sucesso.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/stratego/resultado/${job_id}"
             style="display: inline-block; background: #e8432d; color: white;
                    padding: 14px 28px; border-radius: 12px; text-decoration: none;
                    font-weight: 600; margin: 24px 0;">
            Ver o meu plano →
          </a>
          <p style="color: #999; font-size: 13px;">
            Stratego.AI — De ideia a negócio em 2 minutos
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[orchestrator-v2] Erro ao enviar email:', err)
  }
}

/* ── Pipeline principal ─────────────────────────────────── */

export async function generateBusinessPlan(
  input: BusinessPlanInput
): Promise<BusinessPlanOutput> {
  const { job_id } = input
  const contexto = buildContexto(input)

  try {
    // Etapa 2 — Análise
    await updatePlanStatus(job_id, 'analysing')
    const analise = await runAnalista(contexto)

    // Etapa 3 — Estrategas em paralelo
    await updatePlanStatus(job_id, 'strategising')
    const [estrategiaA, estrategiaB] = await Promise.all([
      runEstrategaA(contexto, analise),
      runEstrategaB(contexto, analise),
    ])

    // Etapa 4 — Revisão e síntese
    await updatePlanStatus(job_id, 'reviewing')
    const sintese = await runRevisor(contexto, analise, estrategiaA, estrategiaB)

    // Etapa 5 — Finalização em paralelo (2 grupos de secções)
    await updatePlanStatus(job_id, 'finalising')
    const [grupo1, grupo2] = await Promise.all([
      runFinalizadorSecoes(sintese, ['resumo', 'mercado', 'comercial', 'financeiro']),
      runFinalizadorSecoes2(sintese, ['operacional', 'marketing', 'proximos']),
    ])

    // Etapa 6 — Composição do output final
    const output: BusinessPlanOutput = {
      resumo_executivo:     grupo1.resumo      ?? extrairSeccao(sintese, 'resumo'),
      analise_mercado:      grupo1.mercado     ?? analise,
      estrategia_comercial: grupo1.comercial   ?? estrategiaA,
      plano_financeiro:     grupo1.financeiro  ?? '',
      plano_operacional:    grupo2.operacional ?? estrategiaB,
      marketing_comunicacao:grupo2.marketing   ?? '',
      proximos_passos:      grupo2.proximos    ?? '',
    }

    // Guarda em Supabase
    const content = JSON.stringify(output)
    await updatePlanStatus(job_id, 'done', content)

    // Envia email (não bloqueia)
    if (input.email) {
      sendPlanEmail(input.email, input.nome ?? '', input.ideia, job_id)
    }

    return output
  } catch (err) {
    console.error('[orchestrator-v2] Erro no pipeline:', err)
    await updatePlanStatus(job_id, 'error')
    throw err
  }
}

/* ── Utilitário: extrai secção do markdown ──────────────── */

function extrairSeccao(texto: string, chave: string): string {
  const patterns: Record<string, RegExp[]> = {
    resumo: [/##\s*resumo executivo([\s\S]*?)(?=##|$)/i],
    mercado: [/##\s*an[aá]lise de mercado([\s\S]*?)(?=##|$)/i],
    comercial: [/##\s*estrat[eé]gia comercial([\s\S]*?)(?=##|$)/i],
    financeiro: [/##\s*plano financeiro([\s\S]*?)(?=##|$)/i],
    operacional: [/##\s*plano operacional([\s\S]*?)(?=##|$)/i],
    marketing: [/##\s*marketing([\s\S]*?)(?=##|$)/i],
    proximos: [/##\s*pr[oó]ximos passos([\s\S]*?)(?=##|$)/i],
  }

  const pats = patterns[chave] ?? []
  for (const pat of pats) {
    const match = texto.match(pat)
    if (match?.[1]) return match[1].trim()
  }
  return texto
}
