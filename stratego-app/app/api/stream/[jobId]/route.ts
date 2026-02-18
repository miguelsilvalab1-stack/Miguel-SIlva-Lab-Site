import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/db/supabase'
import type { PlanStatus } from '@/types'

const STATUS_MESSAGES: Record<PlanStatus, { etapa: number; modelo: string; mensagem: string }> = {
  pending:     { etapa: 1, modelo: '', mensagem: 'A preparar o teu plano...' },
  analysing:   { etapa: 2, modelo: 'GPT-4o', mensagem: 'O analista está a pesquisar o teu setor e concorrência...' },
  generating:  { etapa: 3, modelo: 'Claude', mensagem: 'O estratega está a construir o teu plano de marketing...' },
  reviewing:   { etapa: 4, modelo: 'GPT-4o', mensagem: 'O revisor está a verificar a qualidade e coerência...' },
  finalising:  { etapa: 5, modelo: 'Claude', mensagem: 'A finalizar e polir o teu plano...' },
  completed:   { etapa: 5, modelo: '', mensagem: 'Plano concluído!' },
  failed:      { etapa: 0, modelo: '', mensagem: 'Ocorreu um erro. Por favor tenta novamente.' }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: object) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(payload))
      }

      let lastStatus: PlanStatus | null = null
      let attempts = 0
      const maxAttempts = 120 // 4 minutos (polling cada 2 seg)

      const poll = async () => {
        attempts++

        if (attempts > maxAttempts) {
          send('error', { error: 'Timeout: a geração excedeu o tempo máximo.' })
          controller.close()
          return
        }

        const { data: plan } = await supabaseAdmin
          .from('plans')
          .select('status, final_markdown, error_message')
          .eq('id', jobId)
          .single()

        if (!plan) {
          send('error', { error: 'Plano não encontrado.' })
          controller.close()
          return
        }

        const currentStatus = plan.status as PlanStatus

        // Enviar actualização se o status mudou
        if (currentStatus !== lastStatus) {
          lastStatus = currentStatus
          const info = STATUS_MESSAGES[currentStatus]

          if (currentStatus === 'completed') {
            send('complete', {
              plan_id: jobId,
              pdf_url: `/stratego/resultado/${jobId}`,
              mensagem: info.mensagem
            })
            controller.close()
            return
          }

          if (currentStatus === 'failed') {
            send('error', { error: plan.error_message || info.mensagem })
            controller.close()
            return
          }

          send('status', {
            etapa: info.etapa,
            modelo: info.modelo,
            mensagem: info.mensagem
          })
        }

        // Continuar a fazer polling
        setTimeout(poll, 2000)
      }

      // Enviar evento inicial
      send('status', { etapa: 0, modelo: '', mensagem: 'A ligar ao servidor...' })

      // Iniciar polling
      setTimeout(poll, 1000)
    }
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
