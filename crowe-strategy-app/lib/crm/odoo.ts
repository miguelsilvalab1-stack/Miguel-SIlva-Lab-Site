/**
 * Integração Odoo CRM — Crowe Strategy Studio
 *
 * Cria um lead em `crm.lead` via API JSON-RPC do Odoo quando um gestor
 * completa o diagnóstico. INATIVA até serem definidas as variáveis de
 * ambiente (não tem qualquer efeito sem elas):
 *
 *   ODOO_URL      ex.: https://crowe-pt.odoo.com   (instância Odoo)
 *   ODOO_DB       nome da base de dados Odoo
 *   ODOO_LOGIN    utilizador de integração (criar utilizador dedicado, ex.: integracao.studio@crowe.pt)
 *   ODOO_API_KEY  chave API do utilizador (Definições → Segurança → API Keys)
 *
 * Compatível com Odoo 14+ (online ou on-premise). Sem dependências externas.
 */

interface OdooLead {
  nome: string
  email: string
  empresa: string
  cargo: string
  telefone: string
  consent: boolean
  job_id: string
  resumo: string | null
}

const ODOO_URL = process.env.ODOO_URL
const ODOO_DB = process.env.ODOO_DB
const ODOO_LOGIN = process.env.ODOO_LOGIN
const ODOO_API_KEY = process.env.ODOO_API_KEY

export function odooConfigured(): boolean {
  return !!(ODOO_URL && ODOO_DB && ODOO_LOGIN && ODOO_API_KEY)
}

/* Chamada JSON-RPC genérica ao Odoo */
async function odooRpc(service: string, method: string, args: unknown[]): Promise<unknown> {
  const res = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { service, method, args },
      id: Date.now(),
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error('[odoo] ' + JSON.stringify(data.error.data?.message ?? data.error))
  return data.result
}

/**
 * Cria o lead no pipeline do CRM.
 * Mapeamento Studio → crm.lead:
 *   nome do contacto  → contact_name
 *   empresa           → partner_name (e no name do lead)
 *   cargo             → function
 *   email             → email_from
 *   telefone          → phone
 *   diagnóstico       → description (resumo + link)
 *   origem            → referred = 'Crowe Strategy Studio'
 */
export async function createOdooLead(lead: OdooLead): Promise<number | null> {
  if (!odooConfigured()) return null
  try {
    // 1. autenticação → uid
    const uid = await odooRpc('common', 'authenticate', [ODOO_DB, ODOO_LOGIN, ODOO_API_KEY, {}])
    if (!uid) throw new Error('[odoo] autenticação falhou')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crowe-strategy-studio.vercel.app'
    const descricao =
      `Lead gerado pelo Crowe Strategy Studio (AI Consulting Unit).\n\n` +
      `Diagnóstico: ${appUrl}/diagnostico/resultado/${lead.job_id}\n` +
      `Consentimento marketing: ${lead.consent ? 'Sim' : 'Não'}\n\n` +
      (lead.resumo ? `Sumário executivo:\n${lead.resumo.slice(0, 1500)}` : '')

    // 2. criar o lead
    const leadId = await odooRpc('object', 'execute_kw', [
      ODOO_DB, uid, ODOO_API_KEY,
      'crm.lead', 'create',
      [{
        name: `[Strategy Studio] ${lead.empresa || lead.nome}`,
        contact_name: lead.nome,
        partner_name: lead.empresa,
        function: lead.cargo,
        email_from: lead.email,
        phone: lead.telefone,
        description: descricao,
        referred: 'Crowe Strategy Studio',
        type: 'lead',
      }],
    ])
    console.log('[odoo] lead criado com id', leadId)
    return leadId as number
  } catch (err) {
    // Nunca bloquear o fluxo do utilizador por causa do CRM
    console.error('[odoo] falha ao criar lead (a continuar):', err instanceof Error ? err.message : err)
    return null
  }
}
