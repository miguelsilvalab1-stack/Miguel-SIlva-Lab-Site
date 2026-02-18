import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db/supabase'
import { runOrchestrator } from '@/lib/ai/orchestrator'
import type { OrchestratorRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: OrchestratorRequest = await request.json()
    const { email, nome, consent_marketing, questionario } = body

    if (!email || !questionario) {
      return NextResponse.json({ error: 'email e questionario são obrigatórios' }, { status: 400 })
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
    } else {
      const { data: newLead, error: leadError } = await supabaseAdmin
        .from('leads')
        .insert({
          email: email.toLowerCase().trim(),
          nome: nome || null,
          source: 'stratego',
          consent_marketing: consent_marketing || false
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

    // Iniciar orquestração em background (sem await para resposta imediata)
    runOrchestrator(planId, questionario).catch(err => {
      console.error('[API] Erro no orchestrator:', err)
    })

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
