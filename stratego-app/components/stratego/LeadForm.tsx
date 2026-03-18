'use client'

import { useState } from 'react'

/**
 * LeadForm — captura email (e nome opcional) antes de mostrar o plano.
 * Mostrado sobre o resultado assim que o pipeline termina.
 * O email é usado para enviar uma cópia do plano por Resend.
 */

interface Props {
  ideia?: string
  onSubmit: (email: string, nome: string) => void
  onSkip: () => void
}

export default function LeadForm({ ideia, onSubmit, onSkip }: Props) {
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidEmail) {
      setError('Introduz um email válido.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSubmit(email.trim(), nome.trim())
    } catch {
      setError('Algo correu mal. Tenta novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: 'rgba(5,8,16,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 text-center animate-screen-enter"
        style={{
          background: 'linear-gradient(135deg, rgba(10,15,30,0.95), rgba(5,8,16,0.98))',
          border: '1px solid rgba(232,67,45,0.2)',
          boxShadow: '0 0 60px rgba(232,67,45,0.08)',
        }}
      >
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6"
          style={{
            background: 'var(--r-accent)',
            border: '1px solid rgba(232,67,45,0.3)',
            color: 'var(--accent2)',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
          Plano gerado com sucesso
        </div>

        {/* Título */}
        <h2
          className="mb-2"
          style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: 800,
            fontSize: '1.6rem',
            color: 'var(--white)',
          }}
        >
          O teu plano está pronto
        </h2>

        {/* Ideia */}
        {ideia && (
          <p
            className="mb-6 text-sm"
            style={{
              color: 'var(--w50)',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            {ideia.length > 60 ? ideia.slice(0, 60) + '…' : ideia}
          </p>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--w50)', fontFamily: 'var(--font-dm-sans)' }}
            >
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="o.teu@email.com"
              autoFocus
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: 'var(--w05)',
                border: `1px solid ${error ? 'rgba(232,67,45,0.5)' : 'var(--w15)'}`,
                color: 'var(--white)',
                fontFamily: 'var(--font-dm-sans)',
              }}
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--w50)', fontFamily: 'var(--font-dm-sans)' }}
            >
              Nome (opcional)
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="O teu nome"
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: 'var(--w05)',
                border: '1px solid var(--w15)',
                color: 'var(--white)',
                fontFamily: 'var(--font-dm-sans)',
              }}
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: 'var(--accent)', fontFamily: 'var(--font-dm-sans)' }}>
              {error}
            </p>
          )}

          {/* Nota de privacidade */}
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--w30)', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.5 }}
          >
            Usamos o teu email para enviar uma cópia do plano.
            Sem spam, sem subscrições automáticas.
          </p>

          {/* Botões */}
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="mt-2 w-full py-4 rounded-2xl text-sm font-semibold transition-all"
            style={{
              background: loading || !email.trim()
                ? 'var(--w08)'
                : 'linear-gradient(135deg, var(--accent), var(--accent2))',
              color: 'white',
              fontFamily: 'var(--font-dm-sans)',
              cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'A guardar…' : 'Ver o meu plano →'}
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="text-xs py-2 transition-opacity hover:opacity-80"
            style={{ color: 'var(--w30)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Continuar sem email
          </button>
        </form>
      </div>
    </div>
  )
}
