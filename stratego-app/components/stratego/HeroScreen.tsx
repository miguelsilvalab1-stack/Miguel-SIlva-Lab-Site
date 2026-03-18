'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const CHIPS = [
  'loja de roupa',
  'alojamento local',
  'infantário',
  'lar de idosos',
  'escola de música',
  'comida para cães',
]

/**
 * HeroScreen — écran inicial v2.5
 * Input pill centrado + chips de sugestão
 * Usa StarfieldCanvas como fundo (renderizado no page.tsx pai)
 */
export default function HeroScreen() {
  const router = useRouter()
  const [ideia, setIdeia] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // entrada suave
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  function handleSubmit(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    router.push(`/stratego/questionario?ideia=${encodeURIComponent(trimmed)}`)
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit(ideia)
  }

  return (
    <div
      className="relative z-10 flex flex-col items-center justify-center min-h-screen px-5 text-center"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      {/* Logo */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-20">
        <span
          className="text-sm font-semibold tracking-widest uppercase"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--w50)' }}
        >
          Stratego<span style={{ color: 'var(--accent)' }}>.AI</span>
        </span>
      </div>

      {/* Eyebrow badge */}
      <div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-medium tracking-wide"
        style={{
          background: 'var(--r-accent)',
          border: '1px solid rgba(232,67,45,0.3)',
          color: 'var(--accent2)',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse-slow"
          style={{ background: 'var(--accent)' }}
        />
        Plano de negócio gerado por IA em 2 minutos
      </div>

      {/* Título principal */}
      <h1
        className="mb-4 leading-tight"
        style={{
          fontFamily: 'var(--font-syne)',
          fontWeight: 800,
          fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
          color: 'var(--white)',
          letterSpacing: '-0.02em',
        }}
      >
        de ideia a{' '}
        <span
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          negócio
        </span>
      </h1>

      {/* Subtítulo */}
      <p
        className="mb-10 max-w-md"
        style={{
          fontFamily: 'var(--font-dm-sans)',
          fontWeight: 300,
          fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
          color: 'var(--w50)',
          lineHeight: 1.6,
        }}
      >
        Descreve a tua ideia. Em menos de 2 minutos tens um plano
        de negócio completo e profissional.
      </p>

      {/* Input pill */}
      <div className="input-pill" style={{ maxWidth: 540 }}>
        <input
          type="text"
          value={ideia}
          onChange={e => setIdeia(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ex: quero abrir uma barbearia no Porto…"
          autoFocus
          className="flex-1 bg-transparent outline-none text-sm"
          style={{
            fontFamily: 'var(--font-dm-sans)',
            color: 'var(--white)',
            fontSize: '0.95rem',
          }}
        />
        <button
          onClick={() => handleSubmit(ideia)}
          disabled={!ideia.trim()}
          aria-label="Avançar"
          className="ml-2 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 disabled:opacity-30"
          style={{
            background: ideia.trim()
              ? 'linear-gradient(135deg, var(--accent), var(--accent2))'
              : 'var(--w15)',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M3.75 9h10.5M9.75 4.5 14.25 9l-4.5 4.5"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Chips de sugestão */}
      <div className="flex flex-wrap justify-center gap-2 mt-5" style={{ maxWidth: 540 }}>
        {CHIPS.map(chip => (
          <button
            key={chip}
            className="chip"
            onClick={() => {
              setIdeia(chip)
              // pequena pausa para mostrar o chip seleccionado antes de avançar
              setTimeout(() => handleSubmit(chip), 150)
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Rodapé discreto */}
      <p
        className="absolute bottom-6 text-xs"
        style={{
          fontFamily: 'var(--font-dm-sans)',
          color: 'var(--w30)',
        }}
      >
        Gratuito · Sem subscrição · Feito em Portugal 🇵🇹
      </p>
    </div>
  )
}
