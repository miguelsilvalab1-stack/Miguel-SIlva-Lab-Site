/**
 * POST /api/lead
 * Associa email/nome a um job_id existente no Supabase.
 * Envia email com link para o plano após captura de lead.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPlanEmail } from '@/lib/email/send-plan'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { email, nome, consent, job_id } = await req.json()

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email obrigatorio' }, { status: 400 })
    }

    /* Upsert lead — source distingue opt-in de marketing (RGPD) */
    const { error: leadError } = await supabase.from('leads').upsert(
      {
        email: email.trim(),
        name: nome?.trim() ?? null,
        source: consent ? 'stratego_app_optin' : 'stratego_app',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )
    if (leadError) console.warn('[api/lead] upsert warning:', leadError.message)

    /* Associa ao plano */
    if (job_id) {
      await supabase
        .from('plans')
        .update({ lead_email: email.trim() })
        .eq('job_id', job_id)
    }

    /* Envia email com link para o plano */
    if (job_id && email?.trim()) {
      const { data: plan } = await supabase
        .from('plans')
        .select('content')
        .eq('job_id', job_id)
        .single()

      let resumo: string | null = null
      if (plan?.content) {
        try {
          const parsed = JSON.parse(plan.content)
          resumo = parsed?.resumo_executivo ?? null
        } catch {
          resumo = null
        }
      }

      await sendPlanEmail({
        to: email.trim(),
        nome: nome?.trim() ?? null,
        job_id,
        resumo,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/lead]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
