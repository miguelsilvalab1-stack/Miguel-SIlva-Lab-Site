/**
 * Stratego.AI — API Route v2
 * POST /api/orchestrator-v2
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateBusinessPlan, type BusinessPlanInput } from '@/lib/ai/orchestrator-v2'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export async function POST(req: NextRequest) {
  // Supabase instanciado dentro da funcao (evita erro em build time)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await req.json()
    const {
      ideia, sector, publico, localizacao, investimento,
      diferencial, objetivo, email, nome,
    } = body

    if (!ideia?.trim()) {
      return NextResponse.json({ error: 'Ideia e obrigatoria.' }, { status: 400 })
    }

    /* Rate limiting — apenas se as variaveis Upstash estiverem definidas */
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

    const identifier = email?.trim() || req.headers.get('x-forwarded-for') || 'anon'
    if (ratelimit) {
      const { success } = await ratelimit.limit('orchestrator-v2:' + identifier)
      if (!success) {
        return NextResponse.json(
          { error: 'Limite de planos atingido. Tenta novamente amanha.' },
          { status: 429 }
        )
      }
    }

    /* Upsert lead */
    if (email?.trim()) {
      await supabase.from('leads').upsert(
        { email: email.trim(), name: nome?.trim() ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'email' }
      ).then(({ error }) => {
        if (error) console.warn('[orchestrator-v2] leads upsert warning:', error.message)
      })
    }

    /* Criar registo do plano */
    const job_id = crypto.randomUUID()
    const { error: insertError } = await supabase.from('plans').insert({
      job_id,
      status: 'pending',
      content: null,
    })

    if (insertError) {
      console.error('[orchestrator-v2] Erro ao criar plano:', insertError)
      return NextResponse.json(
        { error: 'Erro ao criar plano: ' + insertError.message },
        { status: 500 }
      )
    }

    /* Lanca pipeline em background */
    const input: BusinessPlanInput = {
      job_id, ideia, sector, publico, localizacao,
      investimento, diferencial, objetivo, email, nome,
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
