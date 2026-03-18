'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/* ── Tipos ─────────────────────────────────────────────── */

type QType = 'text' | 'single' | 'multi'

interface Question {
  id: string
  label: string
  type: QType
  placeholder?: string
  options?: string[]
  optional?: boolean
}

/* ── 7 Perguntas v2.5 ───────────────────────────────────── */

const QUESTIONS: Question[] = [
  {
    id: 'ideia',
    label: 'Qual é a tua ideia de negócio?',
    type: 'text',
    placeholder: 'Descreve a tua ideia com as tuas palavras…',
  },
  {
    id: 'sector',
    label: 'Em que sector se enquadra?',
    type: 'single',
    options: [
      'Retalho / Comércio',
      'Alimentação & Bebidas',
      'Saúde & Bem-estar',
      'Educação & Formação',
      'Tecnologia & Digital',
      'Turismo & Alojamento',
      'Serviços Profissionais',
      'Outro',
    ],
  },
  {
    id: 'publico',
    label: 'Quem é o teu cliente principal?',
    type: 'single',
    options: [
      'Consumidores finais (B2C)',
      'Empresas e profissionais (B2B)',
      'Ambos',
    ],
  },
  {
    id: 'localizacao',
    label: 'Onde vais operar?',
    type: 'single',
    options: [
      'Espaço físico local',
      'Online / Nacional',
      'Online / Internacional',
      'Físico + Online',
    ],
  },
  {
    id: 'investimento',
    label: 'Qual o investimento inicial previsto?',
    type: 'single',
    options: [
      'Menos de 5 000 €',
      '5 000 – 25 000 €',
      '25 000 – 100 000 €',
      'Mais de 100 000 €',
      'Ainda não sei',
    ],
  },
  {
    id: 'diferencial',
    label: 'O que te distingue da concorrência?',
    type: 'text',
    placeholder: 'Preço, qualidade, experiência, comodidade, inovação…',
  },
  {
    id: 'objetivo',
    label: 'Qual é o teu principal objectivo com este negócio?',
    type: 'multi',
    options: [
      'Gerar rendimento principal',
      'Complementar o rendimento actual',
      'Criar algo com impacto social',
      'Escalar e internacionalizar',
      'Vender o negócio a médio prazo',
    ],
  },
]

/* ── Componente ─────────────────────────────────────────── */

export default function QuestionnaireV1() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ideiaParam = searchParams.get('ideia') ?? ''

  // índice da pergunta actual (0-based)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [textVal, setTextVal] = useState('')
  const [exiting, setExiting] = useState(false)
  const [entering, setEntering] = useState(true)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  const q = QUESTIONS[current]
  const totalQ = QUESTIONS.length
  const progress = ((current) / totalQ) * 100

  /* pré-preenche a pergunta de ideia com o parâmetro da URL */
  useEffect(() => {
    if (q.id === 'ideia' && ideiaParam) {
      setTextVal(ideiaParam)
      setAnswers(prev => ({ ...prev, ideia: ideiaParam }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* foca o input nas perguntas de texto */
  useEffect(() => {
    if (q.type === 'text' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [current, q.type])

  /* animação de entrada */
  useEffect(() => {
    setEntering(true)
    const t = setTimeout(() => setEntering(false), 320)
    return () => clearTimeout(t)
  }, [current])

  /* ── Navegar para a pergunta seguinte ── */
  function advance(updatedAnswers: Record<string, string | string[]>) {
    if (current < totalQ - 1) {
      setExiting(true)
      setTimeout(() => {
        setExiting(false)
        setTextVal('')
        setCurrent(c => c + 1)
      }, 250)
    } else {
      // última pergunta — submeter
      submitForm(updatedAnswers)
    }
  }

  function goBack() {
    if (current === 0) {
      router.push('/stratego')
      return
    }
    setExiting(true)
    setTimeout(() => {
      setExiting(false)
      setCurrent(c => c - 1)
      // repõe o texto se for pergunta de texto
      const prevQ = QUESTIONS[current - 1]
      if (prevQ.type === 'text') {
        setTextVal((answers[prevQ.id] as string) ?? '')
      }
    }, 250)
  }

  /* ── Lógica de resposta ── */

  function handleSingleSelect(option: string) {
    const updated = { ...answers, [q.id]: option }
    setAnswers(updated)
    // auto-avança após selecção única com um pequeno delay visual
    setTimeout(() => advance(updated), 180)
  }

  function handleMultiToggle(option: string) {
    const current_sel = (answers[q.id] as string[]) ?? []
    const updated_sel = current_sel.includes(option)
      ? current_sel.filter(o => o !== option)
      : [...current_sel, option]
    setAnswers(prev => ({ ...prev, [q.id]: updated_sel }))
  }

  function handleTextChange(val: string) {
    setTextVal(val)
    setAnswers(prev => ({ ...prev, [q.id]: val }))
  }

  function handleTextNext() {
    if (!textVal.trim() && !q.optional) return
    advance({ ...answers, [q.id]: textVal.trim() })
  }

  function handleMultiNext() {
    const sel = (answers[q.id] as string[]) ?? []
    if (sel.length === 0 && !q.optional) return
    advance(answers)
  }

  /* ── Submissão ── */

  function submitForm(finalAnswers: Record<string, string | string[]>) {
    const params = new URLSearchParams()
    for (const [key, val] of Object.entries(finalAnswers)) {
      params.set(key, Array.isArray(val) ? val.join(', ') : val)
    }
    router.push(`/stratego/loading?${params.toString()}`)
  }

  /* ── Render helpers ── */

  const animClass = exiting
    ? 'animate-screen-exit'
    : entering
    ? 'animate-screen-enter'
    : ''

  const canContinue =
    q.type === 'text'
      ? textVal.trim().length > 0 || !!q.optional
      : q.type === 'multi'
      ? ((answers[q.id] as string[]) ?? []).length > 0 || !!q.optional
      : false // single avança automaticamente

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-5">

      {/* Barra de progresso */}
      <div
        className="fixed top-0 left-0 right-0 z-30"
        style={{ height: 3, background: 'var(--w08)' }}
      >
        <div className="prog-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Logo + contador */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        <span
          className="text-sm font-semibold tracking-widest uppercase"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--w50)' }}
        >
          Stratego<span style={{ color: 'var(--accent)' }}>.AI</span>
        </span>
        <span
          className="text-xs tabular-nums"
          style={{ color: 'var(--w30)', fontFamily: 'var(--font-dm-sans)' }}
        >
          {current + 1} / {totalQ}
        </span>
      </div>

      {/* Botão Voltar */}
      <button
        onClick={goBack}
        className="fixed top-5 left-5 z-20 flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
        style={{ color: 'var(--w30)', fontFamily: 'var(--font-dm-sans)' }}
        aria-label="Voltar"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 3 5.5 8 10 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Voltar
      </button>

      {/* Card da pergunta */}
      <div
        className={`w-full max-w-lg text-center ${animClass}`}
      >
        {/* Número da pergunta */}
        <p
          className="mb-3 text-xs font-medium tracking-widest uppercase"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-dm-sans)' }}
        >
          Pergunta {current + 1}
        </p>

        {/* Enunciado */}
        <h2
          className="mb-8"
          style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: 700,
            fontSize: 'clamp(1.4rem, 3.5vw, 2rem)',
            color: 'var(--white)',
            lineHeight: 1.25,
          }}
        >
          {q.label}
        </h2>

        {/* ── Tipo: texto ── */}
        {q.type === 'text' && (
          <div className="flex flex-col gap-4">
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={textVal}
              onChange={e => handleTextChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleTextNext()
                }
              }}
              placeholder={q.placeholder}
              rows={3}
              className="w-full rounded-2xl px-5 py-4 text-sm resize-none outline-none transition-all duration-300"
              style={{
                background: 'var(--w05)',
                border: '1px solid var(--w15)',
                color: 'var(--white)',
                fontFamily: 'var(--font-dm-sans)',
                lineHeight: 1.6,
                boxShadow: textVal ? '0 0 0 3px rgba(232,67,45,0.08)' : 'none',
              }}
            />
            <BtnNext disabled={!canContinue} onClick={handleTextNext} />
          </div>
        )}

        {/* ── Tipo: selecção única ── */}
        {q.type === 'single' && (
          <div className="flex flex-col gap-3">
            {q.options!.map(opt => (
              <button
                key={opt}
                className="q-opt"
                onClick={() => handleSingleSelect(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* ── Tipo: selecção múltipla ── */}
        {q.type === 'multi' && (
          <div className="flex flex-col gap-3">
            {q.options!.map(opt => {
              const sel = ((answers[q.id] as string[]) ?? []).includes(opt)
              return (
                <button
                  key={opt}
                  className={`q-opt${sel ? ' sel' : ''}`}
                  onClick={() => handleMultiToggle(opt)}
                >
                  {opt}
                </button>
              )
            })}
            <BtnNext disabled={!canContinue} onClick={handleMultiNext} label="Continuar" />
          </div>
        )}

        {/* Hint de teclado para texto */}
        {q.type === 'text' && (
          <p
            className="mt-3 text-xs"
            style={{ color: 'var(--w30)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Enter para avançar · Shift+Enter para nova linha
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Botão "Avançar" reutilizável ──────────────────────── */

function BtnNext({
  disabled,
  onClick,
  label = 'Avançar',
}: {
  disabled: boolean
  onClick: () => void
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-2 w-full py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 disabled:opacity-30"
      style={{
        fontFamily: 'var(--font-dm-sans)',
        background: disabled
          ? 'var(--w08)'
          : 'linear-gradient(135deg, var(--accent), var(--accent2))',
        color: 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {label}
    </button>
  )
}
