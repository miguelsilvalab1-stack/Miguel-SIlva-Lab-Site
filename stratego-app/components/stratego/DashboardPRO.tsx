'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { BusinessPlanOutput } from '@/lib/ai/orchestrator-v2'

/**
 * DashboardPRO — 7 separadores com o plano de negócio completo.
 * Separadores:
 *   1. Resumo Executivo
 *   2. Análise de Mercado
 *   3. Estratégia Comercial
 *   4. Plano Financeiro
 *   5. Plano Operacional
 *   6. Marketing & Comunicação
 *   7. Próximos Passos
 */

interface Tab {
  id: keyof BusinessPlanOutput
  label: string
  icon: string
  shortLabel: string
}

const TABS: Tab[] = [
  { id: 'resumo_executivo',      label: 'Resumo Executivo',       shortLabel: 'Resumo',     icon: '📋' },
  { id: 'analise_mercado',       label: 'Análise de Mercado',     shortLabel: 'Mercado',    icon: '📊' },
  { id: 'estrategia_comercial',  label: 'Estratégia Comercial',   shortLabel: 'Estratégia', icon: '🎯' },
  { id: 'plano_financeiro',      label: 'Plano Financeiro',       shortLabel: 'Finanças',   icon: '💰' },
  { id: 'plano_operacional',     label: 'Plano Operacional',      shortLabel: 'Operações',  icon: '⚙️' },
  { id: 'marketing_comunicacao', label: 'Marketing & Comunicação', shortLabel: 'Marketing',  icon: '📣' },
  { id: 'proximos_passos',       label: 'Próximos Passos',        shortLabel: 'Acções',     icon: '🚀' },
]

interface Props {
  plan: BusinessPlanOutput
  ideia?: string
  onDownload?: () => void
  onShare?: () => void
  onUpgrade?: () => void
}

export default function DashboardPRO({
  plan,
  ideia,
  onDownload,
  onShare,
  onUpgrade,
}: Props) {
  const [activeTab, setActiveTab] = useState<keyof BusinessPlanOutput>('resumo_executivo')
  const [copied, setCopied] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)

  const currentTab = TABS.find(t => t.id === activeTab)!
  const content = plan[activeTab] ?? ''

  /* -- Detectar se existem setas de scroll -- */
  const checkScroll = useCallback(() => {
    const el = tabsRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    checkScroll()
    const el = tabsRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll])

  /* -- Scroll ao clicar na tab activa -- */
  useEffect(() => {
    const el = tabsRef.current
    if (!el) return
    const activeBtn = el.querySelector('[data-active="true"]') as HTMLElement | null
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      setTimeout(checkScroll, 350)
    }
  }, [activeTab, checkScroll])

  function scrollTabs(direction: 'left' | 'right') {
    const el = tabsRef.current
    if (!el) return
    const amount = el.clientWidth * 0.6
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
    setTimeout(checkScroll, 350)
  }

  async function handleShare() {
    if (onShare) { onShare(); return }
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">

      {/* Cabeçalho */}
      <div className="mb-8 text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
          style={{
            background: 'var(--r-accent)',
            border: '1px solid rgba(232,67,45,0.3)',
            color: 'var(--accent2)',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          Plano de negócio gerado com IA
        </div>

        <h1
          className="mb-2"
          style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: 800,
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            color: 'var(--white)',
            lineHeight: 1.2,
          }}
        >
          {ideia ?? 'O teu plano de negócio'}
        </h1>

        {/* Acções */}
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
            style={{
              background: 'var(--w08)',
              border: '1px solid var(--w15)',
              color: 'var(--w80)',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Descarregar PDF
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
            style={{
              background: 'var(--w08)',
              border: '1px solid var(--w15)',
              color: 'var(--w80)',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="11" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <circle cx="3" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <circle cx="11" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M4.4 6.2 9.6 3.3M4.4 7.8l5.2 2.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            {copied ? 'Copiado!' : 'Partilhar'}
          </button>
        </div>
      </div>

      {/* Separadores — scroll horizontal com setas */}
      <div className="relative mb-6">
        {/* Seta esquerda */}
        {canScrollLeft && (
          <button
            onClick={() => scrollTabs('left')}
            className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-1"
            style={{
              background: 'linear-gradient(to right, var(--bg, #0a0a0a) 60%, transparent)',
            }}
            aria-label="Scroll para a esquerda"
          >
            <span
              className="flex items-center justify-center w-7 h-7 rounded-full"
              style={{
                background: 'var(--w08)',
                border: '1px solid var(--w15)',
                color: 'var(--w80)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
        )}

        {/* Seta direita */}
        {canScrollRight && (
          <button
            onClick={() => scrollTabs('right')}
            className="absolute right-0 top-0 bottom-0 z-10 flex items-center px-1"
            style={{
              background: 'linear-gradient(to left, var(--bg, #0a0a0a) 60%, transparent)',
            }}
            aria-label="Scroll para a direita"
          >
            <span
              className="flex items-center justify-center w-7 h-7 rounded-full"
              style={{
                background: 'var(--w08)',
                border: '1px solid var(--w15)',
                color: 'var(--w80)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
        )}

        {/* Container das tabs */}
        <div
          ref={tabsRef}
          className="flex gap-1 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', scrollBehavior: 'smooth' }}
        >
          {TABS.map(tab => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="pro-tab flex-shrink-0"
                data-active={isActive}
                style={isActive ? {
                  background: 'var(--r-accent)',
                  border: '1px solid rgba(232,67,45,0.4)',
                  color: 'var(--white)',
                } : {}}
              >
                <span className="hidden sm:inline">{tab.icon} </span>
                <span className="sm:hidden">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-xs">{tab.shortLabel}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo da tab activa */}
      <div
        className="pro-block animate-screen-enter"
        key={activeTab}
      >
        {/* Título da secção */}
        <div
          className="flex items-center gap-3 mb-6 pb-4"
          style={{ borderBottom: '1px solid var(--w08)' }}
        >
          <span className="text-2xl">{currentTab.icon}</span>
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-syne)',
                fontWeight: 700,
                fontSize: '1.25rem',
                color: 'var(--white)',
              }}
            >
              {currentTab.label}
            </h2>
          </div>
        </div>

        {/* Conteúdo markdown */}
        {content ? (
          <div className="prose-dark">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-12" style={{ color: 'var(--w30)' }}>
            <p style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Esta secção não foi gerada. Tenta novamente.
            </p>
          </div>
        )}
      </div>

      {/* Banner de upgrade PRO */}
      <div className="premium-banner mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p
              className="font-semibold mb-1"
              style={{ fontFamily: 'var(--font-syne)', color: 'var(--white)', fontSize: '1rem' }}
            >
              Versão PRO — Plano completo com 15 perguntas
            </p>
            <p
              className="text-sm"
              style={{ color: 'var(--w50)', fontFamily: 'var(--font-dm-sans)' }}
            >
              Exportação em PDF, PPT e Word · Sem limite de planos · Acesso priority
            </p>
          </div>
          <button
            onClick={onUpgrade}
            className="flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-semibold transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              color: 'white',
              fontFamily: 'var(--font-dm-sans)',
              whiteSpace: 'nowrap',
            }}
          >
            Upgrade PRO — 49€
          </button>
        </div>
      </div>

      {/* Navegação entre tabs */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => {
            const idx = TABS.findIndex(t => t.id === activeTab)
            if (idx > 0) setActiveTab(TABS[idx - 1].id)
          }}
          disabled={TABS[0].id === activeTab}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all disabled:opacity-20"
          style={{
            color: 'var(--w50)',
            fontFamily: 'var(--font-dm-sans)',
            border: '1px solid var(--w15)',
          }}
        >
          ← Anterior
        </button>

        <span
          className="text-xs self-center tabular-nums"
          style={{ color: 'var(--w30)', fontFamily: 'var(--font-dm-sans)' }}
        >
          {TABS.findIndex(t => t.id === activeTab) + 1} / {TABS.length}
        </span>

        <button
          onClick={() => {
            const idx = TABS.findIndex(t => t.id === activeTab)
            if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id)
          }}
          disabled={TABS[TABS.length - 1].id === activeTab}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all disabled:opacity-20"
          style={{
            color: 'var(--w50)',
            fontFamily: 'var(--font-dm-sans)',
            border: '1px solid var(--w15)',
          }}
        >
          Próxima →
        </button>
      </div>
    </div>
  )
}
