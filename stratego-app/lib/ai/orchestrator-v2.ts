/**
 * Stratego.AI — Orchestrator v2
 * Pipeline multi-agente para geracao de planos de NEGOCIO estruturados.
 *
 * Pipeline:
 *   Etapa 1 - Preparacao do contexto
 *   Etapa 2 - GPT-5.4-mini: Analista (analise de mercado)
 *   Etapa 3 - Claude Sonnet 4.6 x2 paralelo: Estrategas A (comercial+financeiro) + B (operacional+marketing)
 *   Etapa 4 - GPT-5.4-mini: Revisor — produz as 7 seccoes finais com marcadores ===SECCAO:key===
 *   Etapa 5 - Composicao do JSON final (parse dos marcadores + fallbacks robustos, nunca vazios)
 *
 * Nota modelos (jun/2026):
 *   - GPT-5.4-mini e modelo de raciocinio de baixa latencia: usa `max_completion_tokens`
 *     (nao `max_tokens`) e NAO aceita `temperature`. `reasoning_effort:'none'` + maxRetries:1 (o mini nao aceita
 *     'minimal') mantem o pipeline rapido e dentro do limite serverless (~3 min).
 *     O GPT-5.5 com raciocinio era demasiado lento aqui.
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { sendPipelineAlert } from '@/lib/email/alert'

/* -- Modelos --------------------------------------------------------- */

const MODEL_ANALYST    = 'gpt-5.4-mini'
const MODEL_REVIEWER   = 'gpt-5.4-mini'
const MODEL_STRATEGIST = 'claude-sonnet-4-6'

/* -- Clientes AI (nao lancam erro em build time sem chaves) ---------- */

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/* -- Supabase: lazy, so instanciado quando necessario --------------- */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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
  const supabase = getSupabase()
  const update: Record<string, unknown> = { status }
  if (content) update.content = content
  await supabase.from('plans').update(update).eq('job_id', job_id)
}

/* -- Etapa 2: Analista (GPT-5.5) ------------------------------------ */

async function runAnalista(contexto: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: MODEL_ANALYST,
    max_completion_tokens: 4000,
    reasoning_effort: 'none',
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
          'CONTEXTO DO NEGOCIO:\n' + contexto + '\n\n' +
          'Se especifico para Portugal. Inclui dados e referencias concretas onde possivel.',
      },
    ],
  }, { timeout: 60_000, maxRetries: 1 })
  return res.choices[0].message.content ?? ''
}

/* -- Etapa 3: Estrategas (Claude Sonnet 4.6 x2) --------------------- */

async function runEstrategaA(contexto: string, analise: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: MODEL_STRATEGIST,
    max_tokens: 2400,
    temperature: 0.6,
    messages: [
      {
        role: 'user',
        content:
          'Es um estratega de negocios focado em crescimento sustentavel e rentabilidade.\n\n' +
          'Com base na analise de mercado abaixo, desenvolve a ESTRATEGIA COMERCIAL e o PLANO FINANCEIRO.\n\n' +
          'ANALISE DE MERCADO:\n' + analise + '\n\n' +
          'CONTEXTO DO NEGOCIO:\n' + contexto + '\n\n' +
          '## ESTRATEGIA COMERCIAL\n' +
          '- Posicionamento e proposta de valor unica\n' +
          '- Modelo de receita detalhado\n' +
          '- Estrategia de captacao dos primeiros 100 clientes\n' +
          '- Canais de distribuicao e parcerias estrategicas\n' +
          '- Vantagem competitiva sustentavel\n\n' +
          '## PLANO FINANCEIRO\n' +
          '- Investimento inicial discriminado\n' +
          '- Estrutura de custos fixos e variaveis mensais\n' +
          '- Projeccao de receitas para 12 meses (conservador / realista / optimista)\n' +
          '- Ponto de equilibrio em meses\n' +
          '- Necessidades de financiamento (capital proprio, BPI, IAPMEI, etc.)\n' +
          '- Analise de sensibilidade: impacto no break-even se o ticket medio variar -20% e +20%\n\n' +
          'Usa tabelas em markdown quando ajudar. Se conservador nas projeccoes.',
      },
    ],
  }, { timeout: 120_000 })
  const block = msg.content[0]
  return block.type === 'text' ? block.text : ''
}

async function runEstrategaB(contexto: string, analise: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: MODEL_STRATEGIST,
    max_tokens: 2400,
    temperature: 0.6,
    messages: [
      {
        role: 'user',
        content:
          'Es um estratega de negocios especializado em operacoes e marketing digital.\n\n' +
          'Com base na analise de mercado abaixo, desenvolve o PLANO OPERACIONAL e o PLANO DE MARKETING.\n\n' +
          'ANALISE DE MERCADO:\n' + analise + '\n\n' +
          'CONTEXTO DO NEGOCIO:\n' + contexto + '\n\n' +
          '## PLANO OPERACIONAL\n' +
          '- Estrutura organizacional inicial\n' +
          '- Processos-chave do negocio\n' +
          '- Tecnologia e ferramentas necessarias\n' +
          '- Fornecedores e parcerias operacionais\n' +
          '- KPIs para acompanhar semanalmente\n\n' +
          '## MARKETING E COMUNICACAO\n' +
          '- Identidade de marca e mensagem central\n' +
          '- Mix de marketing para os primeiros 6 meses\n' +
          '- Presenca digital (website, redes sociais, SEO)\n' +
          '- Budget de marketing sugerido\n' +
          '- Accoes de lancamento para os primeiros 30 dias\n\n' +
          'Se pratico e accionavel. Foca-te em recursos limitados.',
      },
    ],
  }, { timeout: 120_000 })
  const block = msg.content[0]
  return block.type === 'text' ? block.text : ''
}

/* -- Etapa 4: Revisor (GPT-5.5) — produz as 7 seccoes com marcadores - */

async function runRevisor(
  contexto: string,
  analise: string,
  estrategiaA: string,
  estrategiaB: string
): Promise<string> {
  const res = await openai.chat.completions.create({
    model: MODEL_REVIEWER,
    max_completion_tokens: 9000,
    reasoning_effort: 'none',
    messages: [
      {
        role: 'system',
        content:
          'Es um revisor senior de planos de negocio com 20 anos de experiencia.\n' +
          'Sintetizas os contributos dos analistas e estrategas num plano final coerente e accionavel.\n' +
          'Respondes sempre em Portugues de Portugal.',
      },
      {
        role: 'user',
        content:
          'Com base nos materiais abaixo, produz o PLANO DE NEGOCIO FINAL completo.\n\n' +
          'FORMATO OBRIGATORIO: divide o plano EXACTAMENTE nestas 7 seccoes, cada uma a comecar\n' +
          'com o seu marcador numa linha isolada, exactamente assim (sem alterar os marcadores):\n\n' +
          '===SECCAO:resumo===\n' +
          '===SECCAO:mercado===\n' +
          '===SECCAO:comercial===\n' +
          '===SECCAO:financeiro===\n' +
          '===SECCAO:operacional===\n' +
          '===SECCAO:marketing===\n' +
          '===SECCAO:proximos===\n\n' +
          'REGRAS:\n' +
          '- Escreve o conteudo de cada seccao LOGO A SEGUIR ao respectivo marcador.\n' +
          '- NAO escrevas texto nenhum fora das seccoes (nem introducao nem conclusao).\n' +
          '- Usa markdown dentro de cada seccao (titulos ##, listas, tabelas).\n' +
          '- "resumo": 3-4 paragrafos de resumo executivo.\n' +
          '- "mercado": sintese da analise de mercado.\n' +
          '- "comercial" e "financeiro": a partir do Estratega A. No "financeiro" inclui sempre uma tabela de sensibilidade do break-even ao ticket medio (-20%, cenario base, +20%).\n' +
          '- "operacional" e "marketing": a partir do Estratega B.\n' +
          '- "proximos": lista numerada de 10 accoes concretas para os proximos 90 dias, com prazo. Numera sequencialmente (1. a 10.) e escreve cada accao num UNICO paragrafo (titulo, prazo e descricao na mesma linha), sem linhas em branco entre itens.\n' +
          '- Resolve contradicoes e usa o cenario mais conservador nos numeros.\n' +
          '- NAO repitas o titulo da seccao como cabecalho dentro do conteudo; comeca directamente no texto ou em subtitulos mais especificos.\n' +
          '- Escreve em portugues europeu com ortografia e acentuacao CORRECTAS (ex.: "análise", "recuperação", "clínico", "estratégia"). Nunca omitas acentos.\n' +
          '- Usa apenas o alfabeto latino. Nunca uses caracteres cirilicos ou de outros alfabetos.\n' +
          '- Usa titulos markdown no maximo ate ### (nunca uses ####).\n' +
          '- Verifica que todos os totais e intervalos citados no texto coincidem exactamente com os valores das tabelas.\n' +
          '- Preenche TODAS as 7 seccoes com conteudo substantivo. Nenhuma pode ficar vazia.\n\n' +
          'CONTEXTO:\n' + contexto + '\n\n' +
          'ANALISE (mercado):\n' + analise + '\n\n' +
          'ESTRATEGA A (comercial + financeiro):\n' + estrategiaA + '\n\n' +
          'ESTRATEGA B (operacional + marketing):\n' + estrategiaB,
      },
    ],
  }, { timeout: 110_000, maxRetries: 1 })
  return res.choices[0].message.content ?? ''
}

/* -- Parse das seccoes marcadas ------------------------------------- */

const MARKER_MAP: Record<string, keyof BusinessPlanOutput> = {
  resumo:      'resumo_executivo',
  mercado:     'analise_mercado',
  comercial:   'estrategia_comercial',
  financeiro:  'plano_financeiro',
  operacional: 'plano_operacional',
  marketing:   'marketing_comunicacao',
  proximos:    'proximos_passos',
}

function parseSeccoesMarcadas(texto: string): Partial<BusinessPlanOutput> {
  const out: Partial<BusinessPlanOutput> = {}
  if (!texto) return out
  // Divide em [pre, key1, body1, key2, body2, ...]
  const parts = texto.split(/===\s*SECCAO\s*:\s*([a-z]+)\s*===/i)
  for (let i = 1; i < parts.length; i += 2) {
    const key = (parts[i] || '').toLowerCase().trim()
    const body = (parts[i + 1] || '').trim()
    const field = MARKER_MAP[key]
    if (field && body) out[field] = body
  }
  return out
}

/* -- Extracao de seccao por titulo (fallback robusto) --------------- */

function extrairSeccao(texto: string, termos: string[]): string {
  if (!texto) return ''
  for (const termo of termos) {
    const re = new RegExp(
      '(?:^|\\n)#{1,4}\\s*[^\\n]*' + termo + '[^\\n]*\\n([\\s\\S]*?)(?=\\n#{1,4}\\s|$)',
      'i'
    )
    const m = texto.match(re)
    if (m && m[1] && m[1].trim().length > 20) return m[1].trim()
  }
  return ''
}


/* -- Saneamento do output ------------------------------------------- */

// Mapa de caracteres cirilicos (e homoglifos) para equivalentes latinos.
const CIRILICO: Record<string, string> = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'i',
  'к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f',
  'х':'x','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'ju','я':'ya',
  'і':'i','ї':'i','є':'e','ѕ':'s','ј':'j',
  'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ж':'Zh','З':'Z','И':'I','Й':'I',
  'К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R','С':'S','Т':'T','У':'U','Ф':'F',
  'Х':'X','Ц':'Ts','Ч':'Ch','Ш':'Sh','Щ':'Shch','Ы':'Y','Э':'E','Ю':'Ju','Я':'Ya',
}

function sanitizarLatim(texto: string): string {
  if (!/[\u0400-\u04FF]/.test(texto)) return texto
  console.warn('[orchestrator-v2] caracteres cirilicos detectados no output — a corrigir')
  return texto.replace(/[\u0400-\u04FF]/g, ch => CIRILICO[ch] ?? '')
}

// Remove o primeiro cabecalho do corpo se repetir o titulo da seccao
function tirarTituloRepetido(body: string, sinonimos: string[]): string {
  const norm = (t: string) =>
    t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
  const lines = body.split('\n')
  let i = 0
  while (i < lines.length && !lines[i].trim()) i++
  const m = lines[i]?.trim().match(/^#{1,4}\s+(.+)$/)
  if (m && sinonimos.some(sin => norm(m[1]) === norm(sin))) {
    lines.splice(i, 1)
    return lines.join('\n').trim()
  }
  return body
}

const SINONIMOS_TITULO: Record<keyof BusinessPlanOutput, string[]> = {
  resumo_executivo:      ['resumo executivo', 'resumo'],
  analise_mercado:       ['analise de mercado', 'mercado'],
  estrategia_comercial:  ['estrategia comercial'],
  plano_financeiro:      ['plano financeiro'],
  plano_operacional:     ['plano operacional'],
  marketing_comunicacao: ['marketing e comunicacao', 'plano de marketing', 'marketing'],
  proximos_passos:       ['proximos passos', 'proximos 90 dias', 'proximos passos 90 dias'],
}

function polirSeccao(body: string, key: keyof BusinessPlanOutput): string {
  return sanitizarLatim(tirarTituloRepetido(body, SINONIMOS_TITULO[key]))
}

/* -- Pipeline principal --------------------------------------------- */

export async function generateBusinessPlan(
  input: BusinessPlanInput
): Promise<BusinessPlanOutput> {
  const { job_id } = input
  const contexto = buildContexto(input)

  try {
    await updatePlanStatus(job_id, 'analysing')
    let t = Date.now()
    const analise = await runAnalista(contexto)
    console.log(`[orchestrator-v2] analista (${MODEL_ANALYST}) ok em ${Date.now() - t}ms`)

    await updatePlanStatus(job_id, 'strategising')
    t = Date.now()
    const [estrategiaA, estrategiaB] = await Promise.all([
      runEstrategaA(contexto, analise),
      runEstrategaB(contexto, analise),
    ])
    console.log(`[orchestrator-v2] estrategas (${MODEL_STRATEGIST} x2) ok em ${Date.now() - t}ms`)

    await updatePlanStatus(job_id, 'reviewing')
    t = Date.now()
    const sintese = await runRevisor(contexto, analise, estrategiaA, estrategiaB)
    console.log(`[orchestrator-v2] revisor (${MODEL_REVIEWER}) ok em ${Date.now() - t}ms`)

    await updatePlanStatus(job_id, 'finalising')
    const sec = parseSeccoesMarcadas(sintese)

    // Composicao com fallbacks que NUNCA ficam vazios:
    //   1) seccao marcada do revisor → 2) extracao por titulo da fonte → 3) texto bruto da fonte
    const output: BusinessPlanOutput = {
      resumo_executivo:
        sec.resumo_executivo ||
        extrairSeccao(sintese, ['resumo executivo', 'resumo', 'sumario']) ||
        sintese.slice(0, 1200) ||
        analise.slice(0, 800),
      analise_mercado:
        sec.analise_mercado ||
        extrairSeccao(sintese, ['analise de mercado', 'mercado']) ||
        analise,
      estrategia_comercial:
        sec.estrategia_comercial ||
        extrairSeccao(estrategiaA, ['estrategia comercial', 'comercial']) ||
        estrategiaA,
      plano_financeiro:
        sec.plano_financeiro ||
        extrairSeccao(estrategiaA, ['plano financeiro', 'financeiro']) ||
        estrategiaA,
      plano_operacional:
        sec.plano_operacional ||
        extrairSeccao(estrategiaB, ['plano operacional', 'operacional']) ||
        estrategiaB,
      marketing_comunicacao:
        sec.marketing_comunicacao ||
        extrairSeccao(estrategiaB, ['marketing', 'comunicacao']) ||
        estrategiaB,
      proximos_passos:
        sec.proximos_passos ||
        extrairSeccao(sintese, ['proximos passos', 'proximas accoes', 'plano de accao', 'accoes']) ||
        '',
    }

    for (const k of Object.keys(output) as Array<keyof BusinessPlanOutput>) {
      output[k] = polirSeccao(output[k], k)
    }

    await updatePlanStatus(job_id, 'done', JSON.stringify(output))
    return output
  } catch (err) {
    console.error('[orchestrator-v2] Erro no pipeline:', err)
    await updatePlanStatus(job_id, 'error')
    await sendPipelineAlert(job_id, err)
    throw err
  }
}
