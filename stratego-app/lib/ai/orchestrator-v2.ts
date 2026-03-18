/**
 * Stratego.AI — Orchestrator v2
 * Pipeline multi-agente para geracao de planos de NEGOCIO estruturados.
 * Substitui o orchestrator v1 (planos de marketing).
 *
 * Pipeline:
 *   Etapa 1 - Preparacao do contexto
 *   Etapa 2 - GPT-4o: Analista (pesquisa de mercado + benchmarks)
 *   Etapa 3 - Claude Sonnet x2 paralelo: Estratega A + Estratega B
 *   Etapa 4 - GPT-4o: Revisor (sintese critica dos dois estrategas)
 *   Etapa 5 - Claude Haiku x2 paralelo: Finalizador (linguagem + formatacao)
 *   Etapa 6 - Composicao do JSON final com 7 seccoes
 *
 * Sprint 2: sem envio de email (previsto para Sprint 3).
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

/* -- Clientes ------------------------------------------------------- */

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

/* -- Tipos ----------------------------------------------------------- */

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

/* -- Helpers --------------------------------------------------------- */

function buildContexto(input: BusinessPlanInput): string {
  return (
    'IDEIA DE NEGOCIO: ' + input.ideia + '\n' +
    'SECTOR: ' + input.sector + '\n' +
    'CLIENTE PRINCIPAL: ' + input.publico + '\n' +
    'LOCALIZACAO / MODELO: ' + input.localizacao + '\n' +
    'INVESTIMENTO INICIAL: ' + input.investimento + '\n' +
    'DIFERENCIAL: ' + input.diferencial + '\n' +
    'OBJECTIVO PRINCIPAL: ' + input.objetivo
  ).trim()
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

/* -- Etapa 2: Analista (GPT-4o) ------------------------------------- */

async function runAnalista(contexto: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.4,
    max_tokens: 1800,
    messages: [
      {
        role: 'system',
        content:
          'Es um analista de negocios experiente especializado no mercado portugues e europeu.\n' +
          'Analisas ideias de negocio com rigor, identificando oportunidades, riscos e benchmarks reais.\n' +
          'Respondes sempre em Portugues de Portugal, com linguagem clara e profissional.\n' +
          'O teu output e usado por estrategas de negocio - se preciso, denso em informacao, sem floreados.',
      },
      {
        role: 'user',
        content:
          'Analisa a seguinte ideia de negocio e fornece:\n' +
          '1. Panorama do mercado em Portugal (dimensao, tendencias, crescimento previsto)\n' +
          '2. Principais concorrentes directos e indirectos\n' +
          '3. Perfil detalhado do cliente-alvo (comportamento, necessidades, poder de compra)\n' +
          '4. Oportunidades nao exploradas neste sector\n' +
          '5. Principais riscos e barreiras a entrada\n' +
          '6. Benchmarks financeiros tipicos do sector (margens, ticket medio, break-even tipico)\n\n' +
          'CONTEXTO DO NEGOCIO:\n' +
          contexto + '\n\n' +
          'Se especifico para Portugal. Inclui dados e referencias concretas onde possivel.',
      },
    ],
  })
  return res.choices[0].message.content ?? ''
}

/* -- Etapa 3: Estrategas (Claude Sonnet x2) ------------------------- */

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
        content:
          'Es um estratega de negocios focado em crescimento sustentavel e rentabilidade.\n\n' +
          'Com base na analise de mercado abaixo, desenvolve a ESTRATEGIA COMERCIAL e o PLANO FINANCEIRO para este negocio.\n\n' +
          'ANALISE DE MERCADO:\n' + analise + '\n\n' +
          'CONTEXTO DO NEGOCIO:\n' + contexto + '\n\n' +
          'Desenvolve:\n\n' +
          '## ESTRATEGIA COMERCIAL\n' +
          '- Posicionamento e proposta de valor unica\n' +
          '- Modelo de receita detalhado (fontes de receita, estrutura de precos)\n' +
          '- Estrategia de captacao dos primeiros 100 clientes\n' +
          '- Canais de distribuicao e parcerias estrategicas\n' +
          '- Vantagem competitiva sustentavel\n\n' +
          '## PLANO FINANCEIRO\n' +
          '- Investimento inicial discriminado por categoria\n' +
          '- Estrutura de custos fixos e variaveis mensais\n' +
          '- Proieccao de receitas (cenario conservador / realista / optimista) para 12 meses\n' +
          '- Ponto de equilibrio (break-even) em meses\n' +
          '- Necessidades de financiamento e fontes sugeridas (capital proprio, BPI, IAPMEI, etc.)\n\n' +
          'Usa tabelas em markdown quando ajudar a clareza. Se conservador nas proieccoes financeiras.',
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
        content:
          'Es um estratega de negocios especializado em operacoes e marketing digital.\n\n' +
          'Com base na analise de mercado abaixo, desenvolve o PLANO OPERACIONAL e o PLANO DE MARKETING para este negocio.\n\n' +
          'ANALISE DE MERCADO:\n' + analise + '\n\n' +
          'CONTEXTO DO NEGOCIO:\n' + contexto + '\n\n' +
          'Desenvolve:\n\n' +
          '## PLANO OPERACIONAL\n' +
          '- Estrutura organizacional inicial (funcoes, responsabilidades)\n' +
          '- Processos-chave do negocio (do lead ao cliente fidelizado)\n' +
          '- Tecnologia e ferramentas necessarias\n' +
          '- Fornecedores e parcerias operacionais\n' +
          '- Metricas de operacao (KPIs) para acompanhar semanalmente\n\n' +
          '## MARKETING E COMUNICACAO\n' +
          '- Identidade de marca e mensagem central\n' +
          '- Mix de marketing para os primeiros 6 meses\n' +
          '- Presenca digital (website, redes sociais, SEO)\n' +
          '- Estrategia de conteudo e calendario editorial\n' +
          '- Budget de marketing sugerido (percentagem da receita prevista)\n' +
          '- Accoes de lancamento para os primeiros 30 dias\n\n' +
          'Se pratico e accionavel. Foca-te no que pode ser feito com recursos limitados.',
      },
    ],
  })
  const block = msg.content[0]
  return block.type === 'text' ? block.text : ''
}

/* -- Etapa 4: Revisor (GPT-4o) -------------------------------------- */

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
        content:
          'Es um revisor senior de planos de negocio com 20 anos de experiencia.\n' +
          'Recebes dois contributos de estrategas diferentes e sintetizas o melhor de cada um,\n' +
          'eliminando contradicoes, reforcando os pontos mais fortes e identificando lacunas.\n' +
          'O resultado final deve ser coerente, profissional e imediatamente accionavel.\n' +
          'Respondes sempre em Portugues de Portugal.',
      },
      {
        role: 'user',
        content:
          'Sintetiza os dois contributos dos estrategas num plano de negocio coerente.\n\n' +
          'CONTEXTO DO NEGOCIO:\n' + contexto + '\n\n' +
          'ANALISE DE MERCADO (Etapa 2):\n' + analise + '\n\n' +
          'ESTRATEGA A - Estrategia Comercial + Financeiro:\n' + estrategiaA + '\n\n' +
          'ESTRATEGA B - Operacional + Marketing:\n' + estrategiaB + '\n\n' +
          'Produz uma sintese coerente que:\n' +
          '1. Mantem os melhores elementos de cada estratega\n' +
          '2. Resolve contradicoes (ex: se os financeiros sao diferentes, usa o mais conservador)\n' +
          '3. Assegura consistencia entre a estrategia comercial, financeira, operacional e de marketing\n' +
          '4. Adiciona um RESUMO EXECUTIVO de 3-4 paragrafos no inicio\n' +
          '5. Adiciona PROXIMOS PASSOS com as 10 accoes concretas para os proximos 90 dias\n\n' +
          'Estrutura o output com seccoes claras em markdown.',
      },
    ],
  })
  return res.choices[0].message.content ?? ''
}

/* -- Etapa 5: Finalizadores (Claude Haiku x2) ----------------------- */

async function runFinalizadorSecoes(
  sintese: string,
  secoes: ('resumo' | 'mercado' | 'comercial' | 'financeiro')[]
): Promise<Record<string, string>> {
  const secaoLabels: Record<string, string> = {
    resumo: 'Resumo Executivo',
    mercado: 'Analise de Mercado',
    comercial: 'Estrategia Comercial e Plano Financeiro',
    financeiro: 'Plano Financeiro detalhado',
  }

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content:
          'Refina e formata as seguintes seccoes do plano de negocio.\n\n' +
          'SINTESE COMPLETA:\n' + sintese + '\n\n' +
          'Extrai e melhora estas seccoes: ' + secoes.map(function(s) { return secaoLabels[s] }).join(', ') + '\n\n' +
          'Para cada seccao:\n' +
          '- Mantem toda a informacao substantiva\n' +
          '- Melhora a fluidez e clareza do portugues\n' +
          '- Garante que usa markdown correctamente (headers ##, listas, tabelas)\n' +
          '- Remove repeticoes e contradicoes\n' +
          '- Mantem um tom profissional mas acessivel\n\n' +
          'Devolve um JSON valido com as chaves: ' + secoes.map(function(s) { return '"' + s + '"' }).join(', ') + '\n' +
          'Apenas o JSON, sem mais nada.',
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

async function runFinalizadorSecoes2(
  sintese: string,
  secoes: ('operacional' | 'marketing' | 'proximos')[]
): Promise<Record<string, string>> {
  const secaoLabels: Record<string, string> = {
    operacional: 'Plano Operacional',
    marketing: 'Marketing e Comunicacao',
    proximos: 'Proximos Passos',
  }

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content:
          'Refina e formata as seguintes seccoes do plano de negocio.\n\n' +
          'SINTESE COMPLETA:\n' + sintese + '\n\n' +
          'Extrai e melhora estas seccoes: ' + secoes.map(function(s) { return secaoLabels[s] }).join(', ') + '\n\n' +
          'Para cada seccao:\n' +
          '- Mantem toda a informacao substantiva\n' +
          '- Melhora a fluidez e clareza do portugues\n' +
          '- Garante que usa markdown correctamente (headers ##, listas, tabelas)\n' +
          '- Remove repeticoes e contradicoes\n' +
          '- Mantem um tom profissional mas acessivel\n\n' +
          'Para "proximos" cria uma lista numerada de 10 accoes concretas com prazo (ex: "Semana 1", "Mes 1", "Mes 2-3").\n\n' +
          'Devolve um JSON valido com as chaves: ' + secoes.map(function(s) { return '"' + s + '"' }).join(', ') + '\n' +
          'Apenas o JSON, sem mais nada.',
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

/* -- Pipeline principal --------------------------------------------- */

export async function generateBusinessPlan(
  input: BusinessPlanInput
): Promise<BusinessPlanOutput> {
  const { job_id } = input
  const contexto = buildContexto(input)

  try {
    // Etapa 2 - Analise
    await updatePlanStatus(job_id, 'analysing')
    const analise = await runAnalista(contexto)

    // Etapa 3 - Estrategas em paralelo
    await updatePlanStatus(job_id, 'strategising')
    const [estrategiaA, estrategiaB] = await Promise.all([
      runEstrategaA(contexto, analise),
      runEstrategaB(contexto, analise),
    ])

    // Etapa 4 - Revisao e sintese
    await updatePlanStatus(job_id, 'reviewing')
    const sintese = await runRevisor(contexto, analise, estrategiaA, estrategiaB)

    // Etapa 5 - Finalizacao em paralelo (2 grupos de seccoes)
    await updatePlanStatus(job_id, 'finalising')
    const [grupo1, grupo2] = await Promise.all([
      runFinalizadorSecoes(sintese, ['resumo', 'mercado', 'comercial', 'financeiro']),
      runFinalizadorSecoes2(sintese, ['operacional', 'marketing', 'proximos']),
    ])

    // Etapa 6 - Composicao do output final
    const output: BusinessPlanOutput = {
      resumo_executivo:      grupo1.resumo      ?? extrairSeccao(sintese, 'resumo'),
      analise_mercado:       grupo1.mercado     ?? analise,
      estrategia_comercial:  grupo1.comercial   ?? estrategiaA,
      plano_financeiro:      grupo1.financeiro  ?? '',
      plano_operacional:     grupo2.operacional ?? estrategiaB,
      marketing_comunicacao: grupo2.marketing   ?? '',
      proximos_passos:       grupo2.proximos    ?? '',
    }

    // Guarda em Supabase
    const content = JSON.stringify(output)
    await updatePlanStatus(job_id, 'done', content)

    return output
  } catch (err) {
    console.error('[orchestrator-v2] Erro no pipeline:', err)
    await updatePlanStatus(job_id, 'error')
    throw err
  }
}

/* -- Utilitario: extrai seccao do markdown -------------------------- */

function extrairSeccao(texto: string, chave: string): string {
  const patterns: Record<string, RegExp[]> = {
    resumo:      [/##\s*resumo executivo([\s\S]*?)(?=##|$)/i],
    mercado:     [/##\s*an[aá]lise de mercado([\s\S]*?)(?=##|$)/i],
    comercial:   [/##\s*estrat[eé]gia comercial([\s\S]*?)(?=##|$)/i],
    financeiro:  [/##\s*plano financeiro([\s\S]*?)(?=##|$)/i],
    operacional: [/##\s*plano operacional([\s\S]*?)(?=##|$)/i],
    marketing:   [/##\s*marketing([\s\S]*?)(?=##|$)/i],
    proximos:    [/##\s*pr[oó]ximos passos([\s\S]*?)(?=##|$)/i],
  }

  const pats = patterns[chave] ?? []
  for (const pat of pats) {
    const match = texto.match(pat)
    if (match?.[1]) return match[1].trim()
  }
  return texto
}
