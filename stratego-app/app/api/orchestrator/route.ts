import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db/supabase'
import { checkRateLimit } from '@/lib/ratelimit'
import type { OrchestratorRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: OrchestratorRequest = await request.json()
    const { email, nome, consent_marketing, questionario } = body

    if (!email || !questionario) {
      return NextResponse.json({ error: 'email e questionario são obrigatórios' }, { status: 400 })
    }

    // SEC-02: Rate limiting por email e por IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '0.0.0.0'

    const rateLimit = await checkRateLimit(email, ip)
    if (rateLimit.limited) {
      const mensagem =
        rateLimit.reason === 'email'
          ? `Atingiste o limite de ${3} planos por dia para este e-mail. Tenta novamente amanhã.`
          : `Atingiste o limite de pedidos por endereço IP. Tenta novamente amanhã.`

      return NextResponse.json(
        { error: mensagem },
        {
          status: 429,
          headers: rateLimit.retryAfter
            ? { 'Retry-After': String(rateLimit.retryAfter) }
            : {},
        }
      )
    }

    // Criar ou obter lead
    const { data: existingLead } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    let leadId: string

    if (existingLead) {
      leadId = existingLead.id
      // Atualizar nome e consentimento caso o utilizador já exista (pode ter mudado)
      await supabaseAdmin
        .from('leads')
        .update({
          nome: nome?.trim() || null,
          consent_marketing: consent_marketing ?? false,
        })
        .eq('id', leadId)
    } else {
      // CQ-02 / CQ-03 / RGPD-02: guardar nome e consent_marketing no novo lead
      const { data: newLead, error: leadError } = await supabaseAdmin
        .from('leads')
        .insert({
          email: email.toLowerCase().trim(),
          nome: nome?.trim() || null,
          source: 'stratego',
          consent_marketing: consent_marketing ?? false,
        })
        .select('id')
        .single()

      if (leadError || !newLead) {
        throw new Error('Erro ao criar lead: ' + leadError?.message)
      }
      leadId = newLead.id
    }

    // Criar registo do plano
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .insert({
        lead_id: leadId,
        tipo: 'marketing',
        status: 'pending',
        questionnaire_json: questionario
      })
      .select('id')
      .single()

    if (planError || !plan) {
      throw new Error('Erro ao criar plano: ' + planError?.message)
    }

    const planId = plan.id

    // O orchestrator corre dentro do stream endpoint (/api/stream/[planId])
    // que mantém a função Vercel viva durante toda a geração.
    return NextResponse.json({
      job_id: planId,
      stream_url: `/api/stream/${planId}`
    })

  } catch (err: unknown) {
    const error = err as Error
    console.error('[POST /api/orchestrator]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}