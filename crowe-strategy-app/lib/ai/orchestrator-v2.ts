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
    'EMPRESA E DESAFIO ESTRATEGICO: ' + input.ideia + '\n' +
    'SETOR: ' + input.sector + '\n' +
    'CLIENTES PRINCIPAIS: ' + input.publico + '\n' +
    'AMBITO GEOGRAFICO: ' + input.localizacao + '\n' +
    'DIMENSAO (VOLUME DE NEGOCIOS): ' + input.investimento + '\n' +
    'DIFERENCIAL COMPETITIVO: ' + input.diferencial + '\n' +
    'PRIORIDADE ESTRATEGICA 12-24 MESES: ' + input.objetivo
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

const ANALISTA_SYSTEM =
  'Es um analista senior de uma consultora internacional (estilo Crowe), especializado no tecido empresarial portugues.\n' +
  'Produzes analises setoriais rigorosas para empresas estabelecidas: dimensao do setor, concorrencia, tendencias, benchmarks.\n' +
  'Privilegias fontes institucionais portuguesas: INE, Pordata, Banco de Portugal, GEE, associacoes setoriais.\n' +
  'Escreves em Portugues de Portugal (com acentuacao correcta), em registo formal e institucional.\n' +
  'O teu output alimenta um diagnostico estrategico preliminar - denso em informacao, sem floreados.'

function analistaUserPrompt(contexto: string): string {
  return (
    'Prepara a analise setorial para o diagnostico estrategico desta empresa, cobrindo:\n' +
    '1. Panorama do setor em Portugal (dimensao, evolucao recente, perspetivas)\n' +
    '2. Estrutura concorrencial e players relevantes (nomeia empresas reais quando possivel)\n' +
    '3. Tendencias que afetam o setor (procura, regulacao, tecnologia, custos)\n' +
    '4. Benchmarks financeiros do setor (margens tipicas, estrutura de custos, produtividade)\n' +
    '5. Grau de digitalizacao e adocao de IA no setor, e oportunidades concretas de IA aplicada\n' +
    '6. Riscos e fatores criticos de sucesso para uma empresa desta dimensao\n\n' +
    'CONTEXTO DA EMPRESA:\n' + contexto + '\n\n' +
    'Se especifico para Portugal e para a dimensao indicada. Inclui dados concretos e fontes.'
  )
}

async function runAnalista(contexto: string): Promise<string> {
  /* Tentativa 1: Responses API com pesquisa web — dados reais e fontes citadas */
  try {
    const res = await openai.responses.create({
      model: MODEL_ANALYST,
      tools: [{ type: 'web_search' }],
      reasoning: { effort: 'none' },
      max_output_tokens: 5500,
      instructions:
        ANALISTA_SYSTEM + '\n' +
        'Usa a pesquisa web para confirmar dados reais do mercado portugues (dimensao, precos praticados, ' +
        'rendas, salarios, tendencias). Baseia os numeros em fontes verificaveis.\n' +
        'No FIM da analise inclui uma seccao "### Fontes consultadas" com 3 a 6 fontes reais, ' +
        'cada uma numa linha no formato "- Nome da fonte — URL".',
      input: analistaUserPrompt(contexto),
    }, { timeout: 150_000, maxRetries: 1 })
    const texto = res.output_text?.trim()
    if (texto) return texto
    console.warn('[orchestrator-v2] analista com pesquisa devolveu vazio — fallback sem pesquisa')
  } catch (err) {
    console.warn(
      '[orchestrator-v2] pesquisa web indisponivel — fallback sem pesquisa:',
      err instanceof Error ? err.message : err
    )
  }

  /* Fallback: chat completions sem pesquisa (comportamento anterior) */
  const res = await openai.chat.completions.create({
    model: MODEL_ANALYST,
    max_completion_tokens: 4000,
    reasoning_effort: 'none',
    messages: [
      { role: 'system', content: ANALISTA_SYSTEM },
      { role: 'user', content: analistaUserPrompt(contexto) },
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
          'Es um consultor estrategico senior de uma consultora internacional, em registo formal.\n\n' +
          'Com base na analise setorial abaixo, desenvolve o POSICIONAMENTO COMPETITIVO/ESTRATEGIA COMERCIAL ' +
          'e a ANALISE ECONOMICO-FINANCEIRA desta empresa estabelecida.\n\n' +
          'ANALISE SETORIAL:\n' + analise + '\n\n' +
          'CONTEXTO DA EMPRESA:\n' + contexto + '\n\n' +
          '## POSICIONAMENTO E ESTRATEGIA COMERCIAL\n' +
          '- Posicionamento competitivo atual e recomendado, com proposta de valor\n' +
          '- Segmentos de clientes prioritarios e abordagem comercial a cada um\n' +
          '- Alavancas de crescimento alinhadas com a prioridade estrategica declarada\n' +
          '- Parcerias e canais relevantes no setor\n\n' +
          '## ANALISE ECONOMICO-FINANCEIRA\n' +
          '- Leitura da posicao financeira provavel face aos benchmarks do setor\n' +
          '- Estrutura de custos tipica e principais alavancas de margem\n' +
          '- Cenarios a 12-24 meses (conservador / base / ambicioso) coerentes com a dimensao declarada\n' +
          '- Analise de sensibilidade das margens as variaveis criticas (-20% / +20%)\n' +
          '- Instrumentos de financiamento relevantes em Portugal (banca, PRR, Portugal 2030, IAPMEI)\n\n' +
          'Usa tabelas em markdown quando ajudar. Se prudente nos numeros e transparente nos pressupostos.',
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
          'Es um consultor de operacoes e transformacao digital de uma consultora internacional, em registo formal.\n\n' +
          'Com base na analise setorial abaixo, desenvolve o diagnostico de OPERACOES & ADOCAO DE IA ' +
          'e o plano de GO-TO-MARKET desta empresa estabelecida.\n\n' +
          'ANALISE SETORIAL:\n' + analise + '\n\n' +
          'CONTEXTO DA EMPRESA:\n' + contexto + '\n\n' +
          '## OPERACOES E ADOCAO DE IA\n' +
          '- Diagnostico provavel da eficiencia operacional face ao setor\n' +
          '- Processos com maior potencial de otimizacao\n' +
          '- Oportunidades concretas de digitalizacao e IA aplicada (3 a 5, com impacto estimado e complexidade)\n' +
          '- Riscos operacionais e de implementacao\n' +
          '- KPIs operacionais a acompanhar mensalmente\n\n' +
          '## GO-TO-MARKET E COMUNICACAO\n' +
          '- Mensagem central e ajuste do posicionamento de comunicacao, se necessario\n' +
          '- Canais prioritarios para os segmentos identificados (incluindo canais B2B se aplicavel)\n' +
          '- Accoes comerciais e de marketing para 6 meses, com esforco estimado\n' +
          '- Presenca digital e reputacao\n\n' +
          'Se pratico e accionavel, adequado a uma empresa em funcionamento.',
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
          'Es um partner de consultoria estrategica com 20 anos de experiencia em firmas internacionais.\n' +
          'Sintetizas os contributos dos analistas e consultores num DIAGNOSTICO ESTRATEGICO PRELIMINAR coerente e accionavel.\n' +
          'Escreves em Portugues de Portugal, em registo formal e institucional (tratas o leitor por "a empresa").',
      },
      {
        role: 'user',
        content:
          'Com base nos materiais abaixo, produz o DIAGNOSTICO ESTRATEGICO PRELIMINAR completo da empresa.\n\n' +
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
          '- "resumo": sumario executivo do diagnostico em 3-4 paragrafos, terminando com as 3 prioridades recomendadas.\n' +
          '- "mercado": sintese da analise setorial. Se a analise incluir uma seccao de fontes consultadas, preserva-a integralmente (com os URLs) no fim desta seccao, sob o subtitulo "### Fontes consultadas".\n' +
          '- "comercial": posicionamento competitivo e estrategia comercial, a partir do Estratega A.\n' +
          '- "financeiro": analise economico-financeira com cenarios, a partir do Estratega A. Inclui sempre uma tabela de sensibilidade das margens as variaveis criticas (-20%, base, +20%).\n' +
          '- "operacional": operacoes e oportunidades de IA aplicada, a partir do Estratega B.\n' +
          '- "marketing": go-to-market e comunicacao, a partir do Estratega B.\n' +
          '- "proximos": roteiro de 90 dias — lista numerada de 10 accoes concretas com prazo, comecando por 2-3 quick wins. Numera sequencialmente (1. a 10.) e escreve cada accao num UNICO paragrafo (titulo, prazo e descricao na mesma linha), sem linhas em branco entre itens. A ultima accao deve ser agendar a sessao de aprofundamento do diagnostico com a equipa da Crowe.\n' +
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
  resumo_executivo:      ['resumo executivo', 'resumo', 'sumario executivo', 'sumario'],
  analise_mercado:       ['analise de mercado', 'mercado', 'analise setorial', 'analise sectorial'],
  estrategia_comercial:  ['estrategia comercial', 'posicionamento e estrategia comercial', 'posicionamento competitivo', 'posicionamento'],
  plano_financeiro:      ['plano financeiro', 'analise financeira', 'analise economico-financeira'],
  plano_operacional:     ['plano operacional', 'operacoes e adocao de ia', 'operacoes e ia', 'operacoes'],
  marketing_comunicacao: ['marketing e comunicacao', 'plano de marketing', 'marketing', 'go-to-market', 'go-to-market e comunicacao'],
  proximos_passos:       ['proximos passos', 'proximos 90 dias', 'roteiro 90 dias', 'roteiro de 90 dias'],
}

function polirSeccao(body: string, key: keyof BusinessPlanOutput): string {
  return sanitizarLatim(tirarTituloRepetido(body, SINONIMOS_TITULO[key]))
}


/* -- Validador aritmético (QA automático pós-geração) ---------------- */

async function validarAritmetica(output: BusinessPlanOutput): Promise<BusinessPlanOutput> {
  try {
    const res = await openai.chat.completions.create({
      model: MODEL_REVIEWER,
      max_completion_tokens: 1500,
      reasoning_effort: 'none',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Es um auditor financeiro meticuloso. Verificas calculos e consistencia entre texto e tabelas. ' +
            'Respondes APENAS com JSON valido.',
        },
        {
          role: 'user',
          content:
            'Audita o plano financeiro abaixo. Verifica:\n' +
            '1. Somas de tabelas (totais correctos)\n' +
            '2. Calculos de break-even (divisoes e percentagens)\n' +
            '3. Coerencia entre numeros citados no texto e os das tabelas\n' +
            '4. Coerencia entre o resumo executivo e o plano financeiro\n\n' +
            'Devolve JSON no formato {"erros": ["descricao precisa do erro e correccao", ...]}. ' +
            'Array vazia se estiver tudo correcto. Ignora arredondamentos ate 1%.\n\n' +
            'RESUMO EXECUTIVO:\n' + output.resumo_executivo + '\n\n' +
            'PLANO FINANCEIRO:\n' + output.plano_financeiro,
        },
      ],
    }, { timeout: 60_000, maxRetries: 1 })

    const parsed = JSON.parse(res.choices[0].message.content ?? '{}')
    const erros: string[] = Array.isArray(parsed.erros) ? parsed.erros : []
    if (erros.length === 0) {
      console.log('[orchestrator-v2] validador aritmetico: OK, sem inconsistencias')
      return output
    }

    console.warn('[orchestrator-v2] validador aritmetico: ' + erros.length + ' problema(s) — a corrigir:', erros)
    const fix = await openai.chat.completions.create({
      model: MODEL_REVIEWER,
      max_completion_tokens: 6000,
      reasoning_effort: 'none',
      messages: [
        {
          role: 'system',
          content:
            'Es um editor financeiro rigoroso. Corriges apenas o que e pedido, mantendo todo o resto do texto ' +
            'e a formatacao markdown exactamente iguais. Escreves em Portugues de Portugal com acentuacao correcta.',
        },
        {
          role: 'user',
          content:
            'Corrige APENAS os seguintes problemas na seccao abaixo. Nao alteres mais nada.\n\n' +
            'PROBLEMAS:\n- ' + erros.join('\n- ') + '\n\n' +
            'SECCAO A CORRIGIR:\n' + output.plano_financeiro,
        },
      ],
    }, { timeout: 90_000, maxRetries: 1 })

    const corrigido = fix.choices[0].message.content?.trim()
    if (corrigido && corrigido.length > 200) {
      output.plano_financeiro = sanitizarLatim(corrigido)
      console.log('[orchestrator-v2] validador aritmetico: seccao financeira corrigida')
    }
    return output
  } catch (err) {
    console.warn('[orchestrator-v2] validador aritmetico falhou — a continuar sem correccao:',
      err instanceof Error ? err.message : err)
    return output
  }
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

    t = Date.now()
    const validado = await validarAritmetica(output)
    console.log(`[orchestrator-v2] validador aritmetico concluido em ${Date.now() - t}ms`)

    await updatePlanStatus(job_id, 'done', JSON.stringify(validado))
    return validado
  } catch (err) {
    console.error('[orchestrator-v2] Erro no pipeline:', err)
    await updatePlanStatus(job_id, 'error')
    await sendPipelineAlert(job_id, err)
    throw err
  }
}
