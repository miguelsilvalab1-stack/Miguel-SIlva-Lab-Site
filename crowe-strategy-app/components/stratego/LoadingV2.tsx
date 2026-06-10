'use client'

import { useEffect, useState } from 'react'

/**
 * LoadingV2 — écran de geração em progresso
 * Mostrado após a API devolver job_id, enquanto o pipeline multi-agente corre.
 * Mostra as etapas do pipeline com estado de progresso.
 * Recebe `progress` (0-100) e `currentStep` do componente pai.
 */

interface Step {
  id: number
  label: string
  sublabel: string
}

const STEPS: Step[] = [
  { id: 1, label: 'Análise setorial', sublabel: 'A IA a estudar o sector' },
  { id: 2, label: 'Posicionamento estratégico', sublabel: 'A estruturar a estratégia' },
  { id: 3, label: 'Análise financeira', sublabel: 'A calcular cenários' },
  { id: 4, label: 'Validação e refinamento', sublabel: 'A IA a rever e melhorar' },
  { id: 5, label: 'Diagnóstico final', sublabel: 'A compilar o diagnóstico…' },
]

type StepStatus = 'pending' | 'active' | 'done'

interface Props {
  progress: number        // 0–100
  currentStep: number    // 1–5 (step activo)
  ideia?: string
}

export default function LoadingV2({ progress, currentStep, ideia }: Props) {
  const [visible, setVisible] = useState(false)
  const [displayedProgress, setDisplayedProgress] = useState(0)

  useEffect(() => {
    setVisible(true)
  }, [])

  // Anima o número de progresso suavemente
  useEffect(() => {
    const target = progress
    const start = displayedProgress
    if (start === target) return
    const step = (target - start) / 20
    let current = start
    const interval = setInterval(() => {
      current += step
      if (
        (step > 0 && current >= target) ||
        (step < 0 && current <= target)
      ) {
        setDisplayedProgress(target)
        clearInterval(interval)
      } else {
        setDisplayedProgress(Math.round(current))
      }
    }, 30)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  function getStatus(step: Step): StepStatus {
    if (step.id < currentStep) return 'done'
    if (step.id === currentStep) return 'active'
    return 'pending'
  }

  return (
    <div
      className="relative z-10 flex flex-col items-center justify-center min-h-screen px-5"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
    >
      {/* Logo */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-20">
        <span
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--w50)' }}
        >
          <img src="/crowe-logo.svg" alt="Crowe" style={{ height: 22, width: 'auto', display: 'inline-block', verticalAlign: 'middle' }} /><span style={{ marginLeft: 10, paddingLeft: 10, borderLeft: '1px solid #D5DBE7', color: '#002D62', verticalAlign: 'middle' }}>Strategy Studio</span>
        </span>
      </div>

      <div className="w-full max-w-sm">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h2
            className="mb-1"
            style={{
              fontFamily: 'var(--font-syne)',
              fontWeight: 700,
              fontSize: '1.5rem',
              color: 'var(--white)',
            }}
          >
            A preparar o seu diagnóstico
          </h2>
          {ideia && (
            <p
              className="text-sm"
              style={{
                fontFamily: 'var(--font-dm-sans)',
                color: 'var(--w50)',
              }}
            >
              {ideia.length > 50 ? ideia.slice(0, 50) + '…' : ideia}
            </p>
          )}
        </div>

        {/* Barra de progresso global */}
        <div
          className="mb-8 rounded-full overflow-hidden"
          style={{ height: 4, background: 'var(--w08)' }}
        >
          <div
            className="prog-fill h-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Percentagem */}
        <div className="text-center mb-8">
          <span
            style={{
              fontFamily: 'var(--font-syne)',
              fontWeight: 800,
              fontSize: '2.5rem',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {displayedProgress}%
          </span>
        </div>

        {/* Lista de etapas */}
        <div className="flex flex-col gap-3">
          {STEPS.map(step => {
            const status = getStatus(step)
            return (
              <div
                key={step.id}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300"
                style={{
                  background:
                    status === 'active'
                      ? 'var(--r-accent)'
                      : status === 'done'
                      ? 'rgba(255,255,255,0.03)'
                      : 'transparent',
                  border:
                    status === 'active'
                      ? '1px solid rgba(0,45,98,0.3)'
                      : '1px solid transparent',
                  opacity: status === 'pending' ? 0.35 : 1,
                }}
              >
                {/* Ícone de estado */}
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      status === 'done'
                        ? 'rgba(34,197,94,0.15)'
                        : status === 'active'
                        ? 'rgba(0,45,98,0.15)'
                        : 'var(--w05)',
                  }}
                >
                  {status === 'done' && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2.5 7.5 5.5 10.5 11.5 4"
                        stroke="#22c55e"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {status === 'active' && (
                    <div
                      className="w-3 h-3 rounded-full animate-pulse-slow"
                      style={{ background: 'var(--accent)' }}
                    />
                  )}
                  {status === 'pending' && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: 'var(--w30)' }}
                    />
                  )}
                </div>

                {/* Texto */}
                <div>
                  <p
                    className="text-sm font-medium leading-tight"
                    style={{
                      fontFamily: 'var(--font-dm-sans)',
                      color:
                        status === 'active'
                          ? 'var(--white)'
                          : status === 'done'
                          ? 'var(--w80)'
                          : 'var(--w50)',
                    }}
                  >
                    {step.label}
                  </p>
                  {status === 'active' && (
                    <p
                      className="text-xs mt-0.5 animate-slide-up"
                      style={{
                        color: 'var(--accent2)',
                        fontFamily: 'var(--font-dm-sans)',
                      }}
                    >
                      {step.sublabel}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Nota inferior */}
        <p
          className="text-center mt-8 text-xs"
          style={{
            fontFamily: 'var(--font-dm-sans)',
            color: 'var(--w30)',
          }}
        >
          Pode demorar até 3 minutos · Não feche esta janela
        </p>
      </div>
    </div>
  )
}
