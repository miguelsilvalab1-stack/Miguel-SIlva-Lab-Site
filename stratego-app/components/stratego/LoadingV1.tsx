'use client'

import { useEffect, useState } from 'react'

/**
 * LoadingV1 — écran de "análise inicial"
 * Mostrado imediatamente após o questionário, antes de a API devolver job_id.
 * Dura ~2s com frases rotativas de análise.
 */

const PHRASES = [
  'A analisar a tua ideia…',
  'A estudar o mercado…',
  'A identificar oportunidades…',
  'A construir a estratégia…',
]

interface Props {
  ideia?: string
}

export default function LoadingV1({ ideia }: Props) {
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    const interval = setInterval(() => {
      setPhraseIdx(i => (i + 1) % PHRASES.length)
    }, 1400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="relative z-10 flex flex-col items-center justify-center min-h-screen px-5 text-center"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
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

      {/* Anel animado */}
      <div className="relative mb-10">
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="4"
          />
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="url(#ring-gradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="80 134"
            style={{ animation: 'spin 1.8s linear infinite' }}
          />
          <defs>
            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--accent2)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Ícone central */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ color: 'var(--accent)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fill="rgba(232,67,45,0.15)"
            />
          </svg>
        </div>
      </div>

      {/* Frase rotativa */}
      <p
        key={phraseIdx}
        className="mb-3 animate-slide-up"
        style={{
          fontFamily: 'var(--font-syne)',
          fontWeight: 600,
          fontSize: '1.25rem',
          color: 'var(--white)',
        }}
      >
        {PHRASES[phraseIdx]}
      </p>

      {/* Ideia em destaque */}
      {ideia && (
        <p
          className="mb-8 px-4 py-2 rounded-full text-sm"
          style={{
            fontFamily: 'var(--font-dm-sans)',
            color: 'var(--w50)',
            background: 'var(--w05)',
            border: '1px solid var(--w08)',
            maxWidth: 340,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {ideia}
        </p>
      )}

      {/* Três pontos pulsantes */}
      <div className="flex gap-2 mt-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="loading-dot w-2 h-2 rounded-full"
            style={{
              background: 'var(--accent)',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
