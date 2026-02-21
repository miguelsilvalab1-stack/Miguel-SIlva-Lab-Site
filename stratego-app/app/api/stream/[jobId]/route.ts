import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/db/supabase'
import { runOrchestrator } from '@/lib/ai/orchestrator'
import type { PlanStatus, QuestionnairePayload } from '@/types'

const STATUS_MESSAGES: Record<PlanStatus, { etapa: number; modelo: string; mensagem: string }> = {
  pending:     { etapa: 1, modelo: '',       mensagem: 'A preparar o teu plano...' },
  analysing:   { etapa: 2, modelo: 'GPT-4o', mensagem: 'O analista está a pesquisar o teu setor e concorrência...' },
  generating:  { etapa: 3, modelo: 'Claude', mensagem: 'O estratega está a construir o teu plano de marketing...' },
  reviewing:   { etapa: 4, modelo: 'GPT-4o', mensagem: 'O revisor está a verificar a qualidade e coerência...' },
  finalising:  { etapa: 5, modelo: 'Claude', mensagem: 'A finalizar e polir o teu plano...' },
  completed:   { etapa: 5, modelo: '',       mensagem: 'Plano concluído!' },
  failed:      { etapa: 0, modelo: '',       mensagem: 'Ocorreu um erro. Por favor tenta novamente.' }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false

      function send(event: string, data: object) {
        if (closed) return
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      function close() {
        if (!closed) {
          closed = true
          controller.close()
        }
      }

      // Evento inicial
      send('status', { etapa: 0, modelo: '', mensagem: 'A ligar ao servidor...' })

      const { data: plan } = await supabaseAdmin
        .from('plans')
        .select('status, questionnaire_json, error_message')
        .eq('id', jobId)
        .single()

      if (!plan) {
        send('error', { error: 'Plano não encontrado.' })
        close()
        return
      }

      const currentStatus = plan.status as PlanStatus

      // Plano já concluído — enviar imediatamente
      if (currentStatus === 'completed') {
        send('complete', {
          plan_id: jobId,
          pdf_url: `/stratego/resultado/${jobId}`,
          mensagem: STATUS_MESSAGES.completed.mensagem,
        })
        close()
        return
      }

      // Plano falhou
      if (currentStatus === 'failed') {
        send('error', { error: plan.error_message || STATUS_MESSAGES.failed.mensagem })
        close()
        return
      }

      // — Plano pendente: correr o orchestrator INLINE nesta streaming connection —
      // A streaming response mantém a função Vercel viva durante todo o processo.
      if (currentStatus === 'pending') {
        send('status', STATUS_MESSAGES.pending)

        // Polling intermédio para enviar eventos SSE enquanto o orchestrator corre
        let lastPolledStatus: PlanStatus = 'pending'
        const pollInterval = setInterval(async () => {
          if (closed) { clearInterval(pollInterval); return }

          const { data: current } = await supabaseAdmin
            .from('plans')
            .select('status, error_message')
            .eq('id', jobId)
            .single()

          if (!current || closed) return
          const st = current.status as PlanStatus

          if (st !== lastPolledStatus) {
            lastPolledStatus = st
            if (st !== 'completed' && st !== 'failed') {
              send('status', STATUS_MESSAGES[st])
            }
          }
        }, 3000)

        try {
          await runOrchestrator(jobId, plan.questionnaire_json as QuestionnairePayload)
          clearInterval(pollInterval)
          send('complete', {
            plan_id: jobId,
            pdf_url: `/stratego/resultado/${jobId}`,
            mensagem: STATUS_MESSAGES.completed.mensagem,
          })
          close()
        } catch (err: unknown) {
          clearInterval(pollInterval)
          const error = err as Error
          console.error('[Stream] Erro no orchestrator:', error)
          send('error', { error: error.message || 'Ocorreu um erro inesperado.' })
          close()
        }
        return
      }

      // — Reconexão: plano em curso → fazer polling até completar —
      const info = STATUS_MESSAGES[currentStatus]
      send('status', { etapa: info.etapa, modelo: info.modelo, mensagem: info.mensagem })

      let lastStatus: PlanStatus = currentStatus
      let attempts = 0
      const maxAttempts = 140 // ~4 min 40s (polling cada 2 seg) — margem para pipeline longo, abaixo do maxDuration 300s

      const poll = async () => {
        attempts++

        if (attempts > maxAttempts || closed) {
          // SEC-03: marcar o plano como failed na DB para não ficar preso indefinidamente
          await supabaseAdmin
            .from('plans')
            .update({
              status: 'failed',
              error_message: 'Plano interrompido por timeout do servidor. Por favor gera um novo plano.'
            })
            .eq('id', jobId)
            .in('status', ['pending', 'analysing', 'generating', 'reviewing', 'finalising'])

          send('error', { error: 'Timeout: a geração excedeu o tempo máximo.' })
          close()
          return
        }

        const { data: current } = await supabaseAdmin
          .from('plans')
          .select('status, final_markdown, error_message')
          .eq('id', jobId)
          .single()

        if (!current) { send('error', { error: 'Plano não encontrado.' }); close(); return }

        const st = current.status as PlanStatus

        // Auto-recovery: se ficou em 'finalising' mas o markdown já foi guardado,
        // o orquestrador morreu entre runFinalizer e updatePlanStatus('completed').
        if (st === 'finalising' && current.final_markdown) {
          await supabaseAdmin
            .from('plans')
            .update({ status: 'completed' })
            .eq('id', jobId)

          send('complete', {
            plan_id: jobId,
            pdf_url: `/stratego/resultado/${jobId}`,
            mensagem: 'Plano concluído!'
          })
          close()
          return
        }

        if (st !== lastStatus) {
          lastStatus = st
          const msg = STATUS_MESSAGES[st]

          if (st === 'completed') {
            send('complete', { plan_id: jobId, pdf_url: `/stratego/resultado/${jobId}`, mensagem: msg.mensagem })
            close(); return
          }

          if (st === 'failed') {
            send('error', { error: current.error_message || msg.mensagem })
            close(); return
          }

          send('status', { etapa: msg.etapa, modelo: msg.modelo, mensagem: msg.mensagem })
        }

        setTimeout(poll, 2000)
      }

      setTimeout(poll, 1000)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
}
