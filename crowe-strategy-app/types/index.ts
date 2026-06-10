// ─── Questionário ────────────────────────────────────────────────────────────

export interface QuestionnaireAnswers {
  '1_nome': string
  '2_setor': string
  '3_produto': string
  '4_cliente_ideal': string
  '5_problema_resolve': string
  '6_concorrentes': string
  '7_diferenciador': string
  '8_preco': string
  '9_canais': string[]
  '10_orcamento': string
  '11_objetivos': string[]
  '12_sazonalidade': string
  '13_forcas': string
  '14_fraquezas': string
  '15_localizacao': string
}

export interface QuestionnairePayload {
  tipo_plano: 'marketing'
  timestamp: string
  respostas: QuestionnaireAnswers
}

// ─── Plano ───────────────────────────────────────────────────────────────────

export type PlanStatus =
  | 'pending'
  | 'analysing'   // Etapa 2: GPT-4o Analista
  | 'generating'  // Etapa 3: Claude Estratega
  | 'reviewing'   // Etapa 4: GPT-4o Revisor
  | 'finalising'  // Etapa 5: Claude Final
  | 'completed'
  | 'failed'

export interface Plan {
  id: string
  lead_id: string | null
  tipo: 'marketing'
  status: PlanStatus
  questionnaire_json: QuestionnairePayload
  analyst_brief_json: AnalystBrief | null
  plan_markdown: string | null
  review_json: ReviewOutput | null
  final_markdown: string | null
  pdf_url: string | null
  cost_total: number | null
  generation_time_seconds: number | null
  created_at: string
  completed_at: string | null
  error_message: string | null
}

// ─── Analista (GPT-4o) ───────────────────────────────────────────────────────

export interface Competitor {
  nome: string
  descricao?: string
  pontos_fortes: string[] | string
  pontos_fracos: string[] | string
  preco_referencia?: string
  preco?: string
  posicionamento: string
}

export interface AnalystBrief {
  setor: {
    descricao: string
    dimensao_mercado?: string
    tendencias_principais?: string[]
    taxa_crescimento?: string
  }
  concorrentes: Competitor[]
  contexto_externo: {
    politico_legal?: string[]
    economico?: string[]
    sociocultural?: string[]
    tecnologico?: string[]
    ambiental?: string[]
  }
  oportunidades_mercado: string[]
  ameacas_mercado: string[]
  benchmarks_preco: {
    faixa_baixa?: string
    faixa_media?: string
    faixa_alta?: string
    posicao_utilizador?: string
  }
  dados_quantitativos?: {
    fonte?: string
    metricas?: string[]
  }
}

// ─── Revisor (GPT-4o) ─────────────────────────────────────────────────────────

export interface CriticalProblem {
  seccao: string
  problema: string
  sugestao_correcao: string
}

export interface Improvement {
  seccao: string
  melhoria: string
  prioridade: 'alta' | 'media' | 'baixa'
  texto_sugerido: string
}

export interface LanguageError {
  original: string
  correcao: string
  tipo: 'gerundio' | 'brasileirismo' | 'outro'
}

export interface ReviewOutput {
  avaliacao_global: {
    nota: number
    resumo: string
  }
  pontos_fortes: string[]
  problemas_criticos: CriticalProblem[]
  melhorias_recomendadas: Improvement[]
  inconsistencias: Array<{
    entre_seccoes: string
    descricao: string
    como_resolver: string
  }>
  erros_linguagem: LanguageError[]
  seccoes_em_falta: string[]
  dados_analista_nao_usados: string[]
}

// ─── SSE Events ──────────────────────────────────────────────────────────────

export type SSEEventType = 'status' | 'progress' | 'complete' | 'error'

export interface SSEEvent {
  type: SSEEventType
  etapa?: number
  modelo?: string
  mensagem?: string
  texto_parcial?: string
  plan_id?: string
  pdf_url?: string
  error?: string
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface OrchestratorRequest {
  email: string
  nome?: string
  consent_marketing: boolean
  questionario: QuestionnairePayload
}

export interface OrchestratorResponse {
  job_id: string
  stream_url: string
}
