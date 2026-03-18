/**
 * POST /api/lead
 * Associa email/nome a um job_id existente no Supabase.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, nome, job_id } = await req.json()

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })
    }

    // Upsert lead
    await supabase.from('leads').upsert(
      {
        email: email.trim(),
        name: nome?.trim() ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )

    // Associa ao plano
    if (job_id) {
      await supabase
        .from('plans')
        .update({ lead_email: email.trim() })
        .eq('job_id', job_id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/lead]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
