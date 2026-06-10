import { Resend } from 'resend'

/**
 * Alerta interno por email quando o pipeline falha em produção.
 * Sem isto, falhas passam despercebidas (já aconteceu).
 */

const ALERT_TO = process.env.ALERT_EMAIL || 'miguel.silva@crowe.pt'

export async function sendPipelineAlert(jobId: string, err: unknown) {
  if (!process.env.RESEND_API_KEY) return
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    await resend.emails.send({
      from: 'Crowe Strategy Studio <noreply@miguelsilvalab.pt>',
      to: [ALERT_TO],
      subject: `⚠️ [Crowe Strategy Studio] pipeline falhou (job ${jobId.slice(0, 8)})`,
      html:
        '<p><strong>O pipeline do Crowe Strategy Studio falhou em produção.</strong></p>' +
        `<p>Job: <code>${jobId}</code></p>` +
        `<p>Erro: <code>${detail.slice(0, 500)}</code></p>` +
        '<p>Logs: <a href="https://vercel.com/miguel-silvas-projects-642d5191/crowe-strategy-studio">Vercel → crowe-strategy-studio</a></p>',
    })
  } catch (alertErr) {
    console.error('[sendPipelineAlert] falhou o envio do alerta:', alertErr)
  }
}
