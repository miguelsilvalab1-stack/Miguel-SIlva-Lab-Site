'use client'

import { useState } from 'react'

import DashboardPRO from '@/components/stratego/DashboardPRO'
import LeadForm from '@/components/stratego/LeadForm'
import StarfieldCanvas from '@/components/ui/StarfieldCanvas'
import type { BusinessPlanOutput } from '@/lib/ai/orchestrator-v2'

/**
 * ResultadoClientV2 — página de resultados com dashboard v2.5.
 * Recebe o plano já carregado do servidor (RSC), mostra LeadForm
 * se ainda não houver email, e depois o DashboardPRO.
 */

interface Props {
  plan: BusinessPlanOutput
  jobId: string
  ideia?: string
  leadEmail?: string | null
}

export default function ResultadoClientV2({ plan, jobId, ideia, leadEmail }: Props) {
  // Se já temos email do Supabase, não mostra o form
  const [emailCapturado, setEmailCapturado] = useState(!!leadEmail)
  const [showForm, setShowForm] = useState(!leadEmail)

  async function handleLeadSubmit(email: string, nome: string, consent: boolean) {
    try {
      // Actualiza o lead no Supabase via API e envia cópia por email
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nome, consent, job_id: jobId }),
      })
    } catch {
      // Não bloqueia o acesso ao plano se a API falhar
    } finally {
      setEmailCapturado(true)
      setShowForm(false)
    }
  }

  function handleDownload() {
    // Abre a versão de impressão do plano (Guardar como PDF)
    window.open(`/api/pdf/${jobId}`, '_blank')
  }

  function handleUpgrade() {
    // Lead magnet: CTA de consultoria em vez de checkout
    window.location.href =
      'mailto:miguel.silva@crowe.pt?subject=' +
      encodeURIComponent('Stratego.AI — Apoio na implementação do meu plano') +
      '&body=' +
      encodeURIComponent('Olá Miguel,\n\nGerei um plano na Stratego.AI e gostava de apoio na implementação.\n\nLink do plano: https://stratego.miguelsilvalab.pt/stratego/resultado/' + jobId)
  }

  return (
    <main
      className="stratego-hero min-h-screen relative"
    >
      <StarfieldCanvas />

      {/* Lead form — modal sobre o conteúdo */}
      {showForm && !emailCapturado && (
        <LeadForm
          ideia={ideia}
          onSubmit={handleLeadSubmit}
        />
      )}

      {/* Dashboard — visível após email ou skip */}
      <div
        className="relative z-10 py-8"
        style={{
          opacity: emailCapturado || !showForm ? 1 : 0,
          transition: 'opacity 0.3s ease',
          filter: showForm ? 'blur(4px)' : 'none',
          pointerEvents: showForm ? 'none' : 'auto',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-2">
          <a
            href="/stratego"
            className="text-sm font-semibold tracking-widest uppercase"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--w50)' }}
          >
            Stratego<span style={{ color: 'var(--accent)' }}>.AI</span>
          </a>
        </div>

        <DashboardPRO
          plan={plan}
          ideia={ideia}
          onDownload={handleDownload}
          onUpgrade={handleUpgrade}
        />

        {/* Rodapé */}
        <div className="text-center mt-12 pb-8">
          <a
            href="/stratego"
            className="text-sm transition-opacity hover:opacity-80"
            style={{ color: 'var(--w30)', fontFamily: 'var(--font-dm-sans)' }}
          >
            ← Criar outro plano
          </a>
        </div>
      </div>
    </main>
  )
}
