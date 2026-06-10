import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendPlanEmailParams {
  to: string
  nome: string | null
  job_id: string
  resumo: string | null
}

export async function sendPlanEmail({ to, nome, job_id, resumo }: SendPlanEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crowe-strategy-studio.vercel.app'
  const planUrl = appUrl + '/diagnostico/resultado/' + job_id
  const firstName = nome ? nome.split(' ')[0] : 'caro(a) cliente'

  const resumoHtml = resumo
    ? '<div style="background:#f5f7fa;border-left:4px solid #032a57;border-radius:4px;padding:20px 24px;margin:0 0 32px;"><p style="margin:0 0 8px;color:#002D62;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Resumo Executivo</p><p style="margin:0;color:#2d3748;font-size:14px;line-height:1.7;">' + resumo.substring(0, 400) + (resumo.length > 400 ? '...' : '') + '</p></div>'
    : ''

  const html = '<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>O seu Diagnóstico Estratégico está pronto</title></head><body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:40px 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#002D62 0%,#032a57 100%);padding:40px 48px;text-align:center;"><h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Crowe <span style="color:#FDB913;">Strategy Studio</span></h1><p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Crowe AI Consulting Unit · Diagnóstico Estratégico Preliminar</p></td></tr><tr><td style="padding:48px;"><p style="margin:0 0 24px;color:#1a1a2e;font-size:18px;font-weight:600;">Exmo.(a) ' + firstName + ',</p><p style="margin:0 0 24px;color:#4a4a6a;font-size:15px;line-height:1.6;">O diagnóstico estratégico preliminar da sua empresa está concluído. Foi preparado por um sistema de inteligência artificial da Crowe com base nas suas respostas e em fontes públicas, e será o ponto de partida para uma sessão de trabalho com a nossa equipa.</p>' + resumoHtml + '<div style="text-align:center;margin:32px 0;"><a href="' + planUrl + '" style="display:inline-block;background:#032a57;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:600;">Ver o meu Diagnóstico →</a></div><p style="margin:0;color:#8a8aaa;font-size:13px;line-height:1.6;">Guarde este email para aceder ao diagnóstico quando precisar. Este documento é preliminar e não dispensa a validação por um consultor Crowe.</p></td></tr><tr><td style="background:#f8f9fa;padding:24px 48px;border-top:1px solid #eaeaef;"><p style="margin:0;color:#9a9ab0;font-size:12px;text-align:center;">Crowe Strategy Studio · Crowe Advisory PT · <a href="' + appUrl + '" style="color:#032a57;text-decoration:none;">Smart decisions. Lasting value.</a></p></td></tr></table></td></tr></table></body></html>'

  try {
    const result = await resend.emails.send({
      from: 'Crowe Strategy Studio <noreply@miguelsilvalab.pt>',
      to: [to],
      subject: 'O seu Diagnóstico Estratégico Preliminar — Crowe Strategy Studio',
      html,
    })
    console.log('[sendPlanEmail] enviado:', result.data?.id)
    return { ok: true, id: result.data?.id }
  } catch (err) {
    console.error('[sendPlanEmail] erro:', err)
    return { ok: false, error: err }
  }
}
