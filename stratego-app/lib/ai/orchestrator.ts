import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/db/supabase'
import {
  SYSTEM_ANALYST, buildAnalystUserMessage
} from '@/lib/ai/prompts/analyst'
import {
  SYSTEM_STRATEGIST_PART1, SYSTEM_STRATEGIST_PART2,
  buildStrategistPart1Message, buildStrategistPart2Message
} from '@/lib/ai/prompts/strategist'
import {
  SYSTEM_REVIEWER, buildReviewerUserMessage
} from '@/lib/ai/prompts/reviewer'
import {
  SYSTEM_FINALIZER, buildFinalizerUserMessage
} from '@/lib/ai/prompts/finalizer'
import type {
  QuestionnairePayload, AnalystBrief, ReviewOutput, PlanStatus
} from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

// ─── Actualizar status no Supabase ────────────────────────────────────────────

async function updatePlanStatus(
  planId: string,
  status: PlanStatus,
  extra: Record<string, unknown> = {}
) {
  await supabaseAdmin
    .from('plans')
    .update({ status, ...extra })
    .eq('id', planId)
}

// ─── Etapa 2: GPT-4o Analista ────────────────────────────────────────────────

async function runAnalyst(
  planId: string,
  questionario: QuestionnairePayload
): Promise<AnalystBrief> {
  const start = Date.now()
  await updatePlanStatus(planId, 'analysing')

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_ANALYST },
        { role: 'user', content: buildAnalystUserMessage(questionario) }
      ]
    })

    const brief = JSON.parse(response.choices[0].message.content!) as AnalystBrief
    const durationMs = Date.now() - start

    await supabaseAdmin.from('api_logs').insert({
      plan_id: planId, etapa: 2, modelo: 'gpt-4o',
      tokens_input: response.usage?.prompt_tokens,
      tokens_output: response.usage?.completion_tokens,
      custo_eur: (response.usage?.prompt_tokens || 0) * 0.0000025 +
                 (response.usage?.completion_tokens || 0) * 0.00001,
      duracao_ms: durationMs, fallback: false
    })

    await updatePlanStatus(planId, 'analysing', { analyst_brief_json: brief })
    return brief

  } catch (err: unknown) {
    const error = err as Error
    console.error('[Etapa 2] Erro GPT-4o, a usar fallback Claude:', error.message)
    return await runAnalystFallback(planId, questionario)
  }
}

async function runAnalystFallback(
  planId: string,
  questionario: QuestionnairePayload
): Promise<AnalystBrief> {
  const start = Date.now()

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    system: SYSTEM_ANALYST + '\n\nIMPORTANTE: Responde APENAS com JSON válido.',
    messages: [{ role: 'user', content: buildAnalystUserMessage(questionario) }]
  })

  const text = (response.content[0] as { text: string }).text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const brief = JSON.parse(jsonMatch![0]) as AnalystBrief

  await supabaseAdmin.from('api_logs').insert({
    plan_id: planId, etapa: 2, modelo: 'claude-sonnet-4-5-20250929 (fallback)',
    tokens_input: response.usage.input_tokens,
    tokens_output: response.usage.output_tokens,
    duracao_ms: Date.now() - start, fallback: true
  })

  await updatePlanStatus(planId, 'analysing', { analyst_brief_json: brief })
  return brief
}

// ─── Etapa 3: Claude Estratega ────────────────────────────────────────────────

async function runStrategist(
  planId: string,
  questionario: QuestionnairePayload,
  brief: AnalystBrief
): Promise<string> {
  const start = Date.now()
  await updatePlanStatus(planId, 'generating')

  // Gerar em duas partes para evitar truncamento por limite de tokens
  const [part1Response, part2Response] = await Promise.all([
    anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      temperature: 0.5,
      system: SYSTEM_STRATEGIST_PART1,
      messages: [{ role: 'user', content: buildStrategistPart1Message(questionario, brief) }]
    }),
    anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      temperature: 0.5,
      system: SYSTEM_STRATEGIST_PART2,
      messages: [{ role: 'user', content: buildStrategistPart2Message(questionario, brief) }]
    })
  ])

  const part1 = (part1Response.content[0] as { text: string }).text
  const part2 = (part2Response.content[0] as { text: string }).text
  const fullPlan = part1 + '\n\n' + part2

  const totalInputTokens = part1Response.usage.input_tokens + part2Response.usage.input_tokens
  const totalOutputTokens = part1Response.usage.output_tokens + part2Response.usage.output_tokens

  await supabaseAdmin.from('api_logs').insert({
    plan_id: planId, etapa: 3, modelo: 'claude-sonnet-4-5-20250929',
    tokens_input: totalInputTokens, tokens_output: totalOutputTokens,
    custo_eur: totalInputTokens * 0.000003 + totalOutputTokens * 0.000015,
    duracao_ms: Date.now() - start, fallback: false
  })

  await updatePlanStatus(planId, 'generating')
  return fullPlan
}

// ─── Etapa 4: GPT-4o Revisor ─────────────────────────────────────────────────

async function runReviewer(
  planId: string,
  questionario: QuestionnairePayload,
  brief: AnalystBrief,
  plan: string
): Promise<ReviewOutput> {
  const start = Date.now()
  await updatePlanStatus(planId, 'reviewing')

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.4,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_REVIEWER },
        { role: 'user', content: buildReviewerUserMessage(questionario, brief, plan) }
      ]
    })

    const review = JSON.parse(response.choices[0].message.content!) as ReviewOutput

    await supabaseAdmin.from('api_logs').insert({
      plan_id: planId, etapa: 4, modelo: 'gpt-4o',
      tokens_input: response.usage?.prompt_tokens,
      tokens_output: response.usage?.completion_tokens,
      custo_eur: (response.usage?.prompt_tokens || 0) * 0.0000025 +
                 (response.usage?.completion_tokens || 0) * 0.00001,
      duracao_ms: Date.now() - start, fallback: false
    })

    await updatePlanStatus(planId, 'reviewing')
    return review

  } catch (err: unknown) {
    const error = err as Error
    console.error('[Etapa 4] Erro GPT-4o Revisor, a usar fallback Claude:', error.message)
    return await runReviewerFallback(planId, questionario, brief, plan)
  }
}

async function runReviewerFallback(
  planId: string,
  questionario: QuestionnairePayload,
  brief: AnalystBrief,
  plan: string
): Promise<ReviewOutput> {
  const start = Date.now()

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    system: SYSTEM_REVIEWER + '\n\nIMPORTANTE: Responde APENAS com JSON válido.',
    messages: [{ role: 'user', content: buildReviewerUserMessage(questionario, brief, plan) }]
  })

  const text = (response.content[0] as { text: string }).text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const review = JSON.parse(jsonMatch![0]) as ReviewOutput

  await supabaseAdmin.from('api_logs').insert({
    plan_id: planId, etapa: 4, modelo: 'claude-sonnet-4-5-20250929 (fallback)',
    tokens_input: response.usage.input_tokens,
    tokens_output: response.usage.output_tokens,
    duracao_ms: Date.now() - start, fallback: true
  })

  await updatePlanStatus(planId, 'reviewing')
  return review
}

// ─── Etapa 5: Claude Finalizador ─────────────────────────────────────────────

async function runFinalizer(
  planId: string,
  plan: string,
  review: ReviewOutput
): Promise<string> {
  const start = Date.now()
  await updatePlanStatus(planId, 'finalising')

  const [part1Response, part2Response] = await Promise.all([
    anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      temperature: 0.3,
      system: SYSTEM_FINALIZER + '\n\nGera as SECÇÕES 1 a 5 do plano final. Incorpora TODAS as melhorias identificadas na revisão.',
      messages: [{ role: 'user', content: buildFinalizerUserMessage(plan, review) + '\n\nGera apenas as Secções 1-5.' }]
    }),
    anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      temperature: 0.3,
      system: SYSTEM_FINALIZER + '\n\nGera as SECÇÕES 6 a 10 do plano final. Começa directamente em ## SECÇÃO 6.',
      messages: [{ role: 'user', content: buildFinalizerUserMessage(plan, review) + '\n\nGera apenas as Secções 6-10. Começa em ## SECÇÃO 6.' }]
    })
  ])

  const finalPart1 = (part1Response.content[0] as { text: string }).text
  const finalPart2 = (part2Response.content[0] as { text: string }).text
  const finalPlan = finalPart1 + '\n\n' + finalPart2

  const totalInputTokens = part1Response.usage.input_tokens + part2Response.usage.input_tokens
  const totalOutputTokens = part1Response.usage.output_tokens + part2Response.usage.output_tokens

  await supabaseAdmin.from('api_logs').insert({
    plan_id: planId, etapa: 5, modelo: 'claude-haiku-4-5-20251001',
    tokens_input: totalInputTokens, tokens_output: totalOutputTokens,
    custo_eur: totalInputTokens * 0.0000008 + totalOutputTokens * 0.000004,
    duracao_ms: Date.now() - start, fallback: false
  })

  await updatePlanStatus(planId, 'finalising', { final_markdown: finalPlan })
  return finalPlan
}

// ─── Orquestrador principal ───────────────────────────────────────────────────

export async function runOrchestrator(
  planId: string,
  questionario: QuestionnairePayload
): Promise<void> {
  const startTotal = Date.now()

  try {
    // Etapa 2: Analista
    const brief = await runAnalyst(planId, questionario)

    // Etapa 3: Estratega (duas partes em paralelo)
    const plan = await runStrategist(planId, questionario, brief)

    // Etapa 4: Revisor
    const review = await runReviewer(planId, questionario, brief, plan)

    // Etapa 5: Finalizador (duas partes em paralelo)
    const finalPlan = await runFinalizer(planId, plan, review)

    // Calcular custo total
    const { data: logs } = await supabaseAdmin
      .from('api_logs')
      .select('custo_eur')
      .eq('plan_id', planId)

    const totalCost = logs?.reduce((sum, l) => sum + (l.custo_eur || 0), 0) ?? 0
    const totalSeconds = Math.round((Date.now() - startTotal) / 1000)

    await updatePlanStatus(planId, 'completed', {
      custo_total_eur: totalCost,
      final_markdown: finalPlan
    })

  } catch (err: unknown) {
    const error = err as Error
    console.error('[Orchestrator] Erro fatal:', error)
    await supabaseAdmin
      .from('plans')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', planId)
  }
}
