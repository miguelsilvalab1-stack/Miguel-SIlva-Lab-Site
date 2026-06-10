import { Resend } from 'resend'

/**
 * Notificação interna à equipa Crowe quando um lead completa o diagnóstico.
 * O consultor recebe os dados da empresa e o link — chega à reunião preparado.
 */

const TEAM_TO = process.env.CROWE_LEAD_EMAIL || 'miguel.silva@crowe.pt'

interface LeadAlert {
  nome: string
  email: string
  empresa: string
  cargo: string
  telefone: string
  consent: boolean
  job_id: string
  resumo: string | null
}

export async function sendInternalLeadAlert(lead: LeadAlert) {
  if (!process.env.RESEND_API_KEY) return
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crowe-strategy-studio.vercel.app'
    const linha = (k: string, v: string) =>
      v ? `<tr><td style="padding:6px 12px;color:#666;font-size:13px;">${k}</td><td style="padding:6px 12px;color:#011E41;font-size:13px;font-weight:600;">${v}</td></tr>` : ''
    await resend.emails.send({
      from: 'Crowe Strategy Studio <noreply@miguelsilvalab.pt>',
      to: [TEAM_TO],
      subject: `🟡 Novo lead — ${lead.empresa || lead.nome} (Crowe Strategy Studio)`,
      html:
        '<div style="font-family:Arial,sans-serif;max-width:560px;">' +
        '<h2 style="color:#011E41;">Novo diagnóstico concluído</h2>' +
        '<table style="border-collapse:collapse;background:#f7f8fa;border-radius:8px;width:100%;">' +
        linha('Nome', lead.nome) + linha('Cargo', lead.cargo) + linha('Empresa', lead.empresa) +
        linha('Email', lead.email) + linha('Telefone', lead.telefone) +
        linha('Consentimento marketing', lead.consent ? 'Sim' : 'Não') +
        '</table>' +
        (lead.resumo ? '<p style="color:#444;font-size:13px;line-height:1.6;margin-top:16px;"><strong>Sumário:</strong> ' + lead.resumo.slice(0, 350) + '…</p>' : '') +
        `<p style="margin-top:20px;"><a href="${appUrl}/diagnostico/resultado/${lead.job_id}" style="background:#011E41;color:#F5A800;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Ver diagnóstico completo →</a></p>` +
        '<p style="color:#999;font-size:11px;margin-top:24px;">Crowe Strategy Studio · notificação interna automática</p></div>',
    })
  } catch (err) {
    console.error('[sendInternalLeadAlert] erro:', err)
  }
}
