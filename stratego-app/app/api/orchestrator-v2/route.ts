/**
 * Stratego.AI — API Route v2
 * POST /api/orchestrator-v2
 * Lança o pipeline de plano de negócio em background e devolve job_id.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateBusinessPlan, type BusinessPlanInput } from '@/lib/ai/orchestrator-v2'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

/* Rate limit: 3 planos por dia por email / IP */
let ratelimit: Ratelimit | null = null
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(3, '24 h'),
    analytics: true,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      ideia, sector, publico, localizacao,
      investimento, diferencial, objetivo,
      email, nome,
    } = body

    if (!ideia?.trim()) {
      return NextResponse.json({ error: 'Ideia é obrigatória.' }, { status: 400 })
    }

    /* ── Rate limiting ── */
    const identifier = email?.trim() || req.headers.get('x-forwarded-for') || 'anon'
    if (ratelimit) {
      const { success, remaining } = await ratelimit.limit(`orchestrator-v2:${identifier}`)
      if (!success) {
        return NextResponse.json(
          { error: 'Limite de planos atingido. Tenta novamente amanhã.' },
          { status: 429 }
        )
      }
      console.log(`[orchestrator-v2] Rate limit OK — ${remaining} restantes para ${identifier}`)
    }

    /* ── Criar/actualizar lead ── */
    if (email?.trim()) {
      await supabase.from('leads').upsert(
        { email: email.trim(), name: nome?.trim() ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'email' }
      )
    }

    /* ── Criar registo do plano ── */
    const job_id = crypto.randomUUID()
    await supabase.from('plans').insert({
      job_id,
      lead_email: email?.trim() ?? null,
      status: 'pending',
      content: null,
      created_at: new Date().toISOString(),
    })

    /* ── Lançar pipeline em background ── */
    const input: BusinessPlanInput = {
      job_id, ideia, sector, publico,
      localizacao, investimento, diferencial,
      objetivo, email, nome,
    }

    // Não aguarda — corre em background
    generateBusinessPlan(input).catch(err =>
      console.error('[orchestrator-v2] Pipeline error:', err)
    )

    return NextResponse.json({ job_id })

  } catch (err) {
    console.error('[orchestrator-v2] Erro na route POST:', err)
    return NextResponse.json({ error: 'Erro interno. Tenta novamente.' }, { status: 500 })
  }
}
