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

// ─── Envio de email via Brevo ─────────────────────────────────────────────────

async function sendPlanEmail(
  planId: string,
  email: string,
  nome: string,
  nomeNegocio: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stratego.miguelsilvalab.pt'
  const planUrl = `${appUrl}/stratego/resultado/${planId}`
  const primeiroNome = (nome || 'empreendedor').split(' ')[0]

  const htmlContent = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>O teu plano de marketing está pronto</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#0a0a0a;padding:28px 40px;text-align:center;">
            <span style="font-size:22px;font-weight:bold;color:#c1694f;letter-spacing:-0.5px;">Stratego</span>
            <span style="font-size:11px;color:#c1694f;border:1px solid #c1694f;padding:2px 8px;border-radius:20px;margin-left:6px;vertical-align:middle;">AI</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="font-size:16px;color:#1a1a1a;margin:0 0 8px;">Olá, <strong>${primeiroNome}</strong>! 👋</p>
            <h1 style="font-size:24px;color:#1a1a1a;margin:0 0 16px;font-weight:700;line-height:1.3;">
              O teu plano de marketing está pronto 🎯
            </h1>
            <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 24px;">
              Gerámos um plano de marketing estratégico personalizado para <strong>${nomeNegocio}</strong>.
              Inclui análise de mercado, estratégia de conteúdo, canais prioritários e um plano de ação para os próximos 6 meses.
            </p>
            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td style="background:#c1694f;border-radius:8px;padding:14px 28px;">
                  <a href="${planUrl}" style="color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;">
                    Ver o meu plano de marketing →
                  </a>
                </td>
              </tr>
            </table>
            <p style="font-size:13px;color:#888;margin:0 0 8px;">
              Ou copia este link para o teu browser:<br>
              <a href="${planUrl}" style="color:#c1694f;word-break:break-all;">${planUrl}</a>
            </p>
          </td>
        </tr>
        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <hr style="border:none;border-top:1px solid #eee;margin:0;">
          </td>
        </tr>
        <!-- Features -->
        <tr>
          <td style="padding:24px 40px;">
            <p style="font-size:13px;color:#888;margin:0 0 12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">O que encontras no teu plano</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:50%;padding-right:12px;vertical-align:top;">
                  <p style="font-size:14px;color:#333;margin:0 0 8px;">📊 <strong>Análise de mercado</strong></p>
                  <p style="font-size:13px;color:#777;margin:0 0 16px;">Concorrência, tendências e oportunidades do teu setor.</p>
                  <p style="font-size:14px;color:#333;margin:0 0 8px;">🎯 <strong>Estratégia de posicionamento</strong></p>
                  <p style="font-size:13px;color:#777;margin:0;">Diferenciação e proposta de valor única.</p>
                </td>
                <td style="width:50%;padding-left:12px;vertical-align:top;">
                  <p style="font-size:14px;color:#333;margin:0 0 8px;">📱 <strong>Plano de conteúdo</strong></p>
                  <p style="font-size:13px;color:#777;margin:0 0 16px;">Canais prioritários e ideias concretas de publicações.</p>
                  <p style="font-size:14px;color:#333;margin:0 0 8px;">🗓️ <strong>Plano de ação 6 meses</strong></p>
                  <p style="font-size:13px;color:#777;margin:0;">Passos práticos com prioridades claras.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="font-size:12px;color:#aaa;margin:0;">
              Gerado por <strong>Stratego.AI</strong> — Miguel Silva Lab<br>
              <a href="${appUrl}" style="color:#c1694f;text-decoration:none;">${appUrl.replace('https://', '')}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: { name: 'Stratego.AI', email: 'noreply@miguelsilvalab.pt' },
      to: [{ email, name: nome || primeiroNome }],
      subject: `O teu plano de marketing para ${nomeNegocio} está pronto! 🎯`,
      htmlContent,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Brevo API ${response.status}: ${body}`)
  }
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

    // Enviar email com o plano completo (falha silenciosa — não bloqueia o plano)
    try {
      const { data: planData } = await supabaseAdmin
        .from('plans')
        .select('lead_id, questionnaire_json')
        .eq('id', planId)
        .single()

      if (planData?.lead_id) {
        const { data: lead } = await supabaseAdmin
          .from('leads')
          .select('email, nome')
          .eq('id', planData.lead_id)
          .single()

        if (lead?.email) {
          const nomeNegocio = planData.questionnaire_json?.respostas?.['1_nome'] || 'o teu negócio'
          await sendPlanEmail(planId, lead.email, lead.nome || '', nomeNegocio)
          console.log(`[Orchestrator] Email enviado para ${lead.email}`)
        }
      }
    } catch (emailErr) {
      console.error('[Orchestrator] Erro ao enviar email (não fatal):', emailErr)
    }

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
