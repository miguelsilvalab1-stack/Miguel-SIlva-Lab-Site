'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  // Se já temos email do Supabase, não mostra o form
  const [emailCapturado, setEmailCapturado] = useState(!!leadEmail)
  const [showForm, setShowForm] = useState(!leadEmail)

  async function handleLeadSubmit(email: string, nome: string) {
    try {
      // Actualiza o lead no Supabase via API
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nome, job_id: jobId }),
      })
    } catch {
      // Não bloqueia — email é opcional
    } finally {
      setEmailCapturado(true)
      setShowForm(false)
    }
  }

  function handleSkip() {
    setEmailCapturado(true)
    setShowForm(false)
  }

  function handleDownload() {
    // Sprint 3: PDF real com Puppeteer
    // Por agora: print da página
    window.print()
  }

  function handleUpgrade() {
    // Sprint 3: checkout Stripe / EasyPay
    router.push('/stratego/upgrade')
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
          onSkip={handleSkip}
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
