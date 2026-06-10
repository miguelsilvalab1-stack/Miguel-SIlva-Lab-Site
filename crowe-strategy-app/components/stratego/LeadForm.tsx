'use client'

import { useState } from 'react'

/**
 * LeadForm — Crowe Strategy Studio
 * Captura dados empresariais antes de mostrar o diagnóstico.
 * Email e empresa obrigatórios; o diagnóstico é enviado por email.
 */

interface Props {
  ideia?: string
  onSubmit: (dados: {
    email: string
    nome: string
    empresa: string
    cargo: string
    telefone: string
    consent: boolean
  }) => void
}

const inputStyle = (error?: boolean) => ({
  background: 'var(--w05)',
  border: `1px solid ${error ? '#c0392b' : 'var(--w15)'}`,
  color: 'var(--white)',
  fontFamily: 'var(--font-dm-sans)',
})

export default function LeadForm({ ideia, onSubmit }: Props) {
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [cargo, setCargo] = useState('')
  const [telefone, setTelefone] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const podeSubmeter = isValidEmail && nome.trim() && empresa.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidEmail) { setError('Introduza um email profissional válido.'); return }
    if (!nome.trim() || !empresa.trim()) { setError('Preencha o nome e a empresa.'); return }
    setLoading(true)
    setError('')
    try {
      await onSubmit({
        email: email.trim(), nome: nome.trim(), empresa: empresa.trim(),
        cargo: cargo.trim(), telefone: telefone.trim(), consent,
      })
    } catch {
      setError('Ocorreu um problema. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5 overflow-y-auto"
      style={{ background: 'rgba(0,45,98,0.45)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center animate-screen-enter my-8"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E0E5EE',
          boxShadow: '0 12px 48px rgba(0,45,98,0.18)',
        }}
      >
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-5"
          style={{
            background: 'var(--r-accent)',
            border: '1px solid rgba(253,185,19,0.5)',
            color: 'var(--accent2)',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
          Diagnóstico concluído
        </div>

        <h2 className="mb-2" style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1.45rem', color: 'var(--white)' }}>
          O seu diagnóstico está pronto
        </h2>

        {ideia && (
          <p className="mb-5 text-sm" style={{ color: 'var(--w50)', fontFamily: 'var(--font-dm-sans)' }}>
            {ideia.length > 70 ? ideia.slice(0, 70) + '…' : ideia}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--w50)', fontFamily: 'var(--font-dm-sans)' }}>Nome *</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="O seu nome" autoFocus
                className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle()} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--w50)', fontFamily: 'var(--font-dm-sans)' }}>Cargo</label>
              <input type="text" value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Ex.: CEO, Diretor"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle()} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--w50)', fontFamily: 'var(--font-dm-sans)' }}>Empresa *</label>
            <input type="text" value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Nome da empresa"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle()} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--w50)', fontFamily: 'var(--font-dm-sans)' }}>Email profissional *</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }} placeholder="nome@empresa.pt"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle(!!error)} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--w50)', fontFamily: 'var(--font-dm-sans)' }}>Telefone</label>
            <input type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="+351"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle()} />
          </div>

          {error && (
            <p className="text-xs" style={{ color: 'var(--accent)', fontFamily: 'var(--font-dm-sans)' }}>{error}</p>
          )}

          <label className="flex items-start gap-2 mt-1 cursor-pointer select-none"
            style={{ color: 'var(--w30)', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.5 }}>
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 accent-blue-900" />
            <span className="text-xs">
              Autorizo a Crowe Advisory PT a contactar-me sobre serviços e conteúdos relevantes para a minha empresa (opcional).
            </span>
          </label>

          <p className="text-xs mt-1" style={{ color: 'var(--w30)', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.5 }}>
            Os seus dados são tratados com confidencialidade e usados para lhe enviar o diagnóstico
            e preparar um eventual contacto da nossa equipa. Consulte a{' '}
            <a href="/privacidade" target="_blank" style={{ color: 'var(--w50)', textDecoration: 'underline' }}>política de privacidade</a>.
          </p>

          <button type="submit" disabled={loading || !podeSubmeter}
            className="mt-2 w-full py-4 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: loading || !podeSubmeter ? 'var(--w08)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
              color: '#FFFFFF',
              fontFamily: 'var(--font-dm-sans)',
              cursor: loading || !podeSubmeter ? 'not-allowed' : 'pointer',
            }}>
            {loading ? 'A registar…' : 'Aceder ao diagnóstico →'}
          </button>
        </form>
      </div>
    </div>
  )
}
