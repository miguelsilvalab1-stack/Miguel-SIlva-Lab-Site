/**
 * Stratego.AI — API Route v2 (hotfix: sem lead_email no plans insert)
 * POST /api/orchestrator-v2
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

    /* Rate limiting */
    const identifier = email?.trim() || req.headers.get('x-forwarded-for') || 'anon'
    if (ratelimit) {
      const { success } = await ratelimit.limit(`orchestrator-v2:${identifier}`)
      if (!success) {
        return NextResponse.json(
          { error: 'Limite de planos atingido. Tenta novamente amanhã.' },
          { status: 429 }
        )
      }
    }

    /* Upsert lead (tabela separada) */
    if (email?.trim()) {
      await supabase.from('leads').upsert(
        { email: email.trim(), name: nome?.trim() ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'email' }
      ).then(({ error }) => {
        if (error) console.warn('[orchestrator-v2] leads upsert warning:', error.message)
      })
    }

    /* Criar registo do plano — apenas colunas garantidas do schema v1 */
    const job_id = crypto.randomUUID()
    const { error: insertError } = await supabase.from('plans').insert({
      job_id,
      status: 'pending',
      content: null,
    })

    if (insertError) {
      console.error('[orchestrator-v2] Erro ao criar plano:', insertError)
      return NextResponse.json({ error: 'Erro ao criar plano: ' + insertError.message }, { status: 500 })
    }

    /* Lançar pipeline em background */
    const input: BusinessPlanInput = {
      job_id, ideia, sector, publico,
      localizacao, investimento, diferencial,
      objetivo, email, nome,
    }

    generateBusinessPlan(input).catch(err =>
      console.error('[orchestrator-v2] Pipeline error:', err)
    )

    return NextResponse.json({ job_id })

  } catch (err) {
    console.error('[orchestrator-v2] Erro:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
