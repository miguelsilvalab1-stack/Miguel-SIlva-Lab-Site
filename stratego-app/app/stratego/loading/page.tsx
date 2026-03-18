'use client'

/**
 * Stratego.AI — Écran de loading/geração v2.5
 * Lê os parâmetros do questionário via searchParams,
 * chama POST /api/orchestrator e mostra progresso real.
 */

import { Suspense, useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StarfieldCanvas from '@/components/ui/StarfieldCanvas'
import LoadingV1 from '@/components/stratego/LoadingV1'
import LoadingV2 from '@/components/stratego/LoadingV2'

/* Fase 1: análise (antes de ter job_id) */
/* Fase 2: geração (pipeline a correr) */
type Phase = 'analysing' | 'generating'

function LoadingInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [phase, setPhase] = useState<Phase>('analysing')
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const called = useRef(false)

  // Constrói o payload a partir dos searchParams do questionário
  function buildPayload() {
    return {
      ideia:        searchParams.get('ideia')        ?? '',
      sector:       searchParams.get('sector')       ?? '',
      publico:      searchParams.get('publico')      ?? '',
      localizacao:  searchParams.get('localizacao')  ?? '',
      investimento: searchParams.get('investimento') ?? '',
      diferencial:  searchParams.get('diferencial')  ?? '',
      objetivo:     searchParams.get('objetivo')     ?? '',
    }
  }

  useEffect(() => {
    if (called.current) return
    called.current = true

    async function generate() {
      try {
        const payload = buildPayload()

        // Mostra a fase de análise por ~1.5s antes de chamar a API
        await new Promise(r => setTimeout(r, 1500))

        const res = await fetch('/api/orchestrator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? `Erro ${res.status}`)
        }

        const { job_id } = await res.json()

        // Muda para a fase de geração
        setPhase('generating')

        // Simula progresso enquanto o job corre
        // O resultado real é buscado por polling ao resultado
        let prog = 5
        const steps = [
          { at: 10, step: 1 },
          { at: 30, step: 2 },
          { at: 50, step: 3 },
          { at: 70, step: 4 },
          { at: 88, step: 5 },
        ]

        const interval = setInterval(async () => {
          prog = Math.min(prog + Math.random() * 4 + 1, 95)
          setProgress(Math.round(prog))

          // Avança etapa conforme percentagem
          for (const s of steps) {
            if (prog >= s.at) setCurrentStep(s.step)
          }

          // Verifica se o job terminou
          if (prog >= 88) {
            try {
              const check = await fetch(`/api/orchestrator/status?job_id=${job_id}`)
              if (check.ok) {
                const status = await check.json()
                if (status.state === 'done') {
                  clearInterval(interval)
                  setProgress(100)
                  await new Promise(r => setTimeout(r, 600))
                  router.push(`/stratego/resultado/${job_id}`)
                }
              }
            } catch {
              // ignora erros de polling — continua a tentar
            }
          }
        }, 1200)

        // Timeout de segurança: redireciona após 3 min
        setTimeout(() => {
          clearInterval(interval)
          router.push(`/stratego/resultado/${job_id}`)
        }, 180_000)

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido'
        setError(msg)
      }
    }

    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-5 text-center">
        <div
          className="rounded-3xl p-8 max-w-sm w-full"
          style={{
            background: 'rgba(232,67,45,0.08)',
            border: '1px solid rgba(232,67,45,0.2)',
          }}
        >
          <p
            className="text-lg font-semibold mb-2"
            style={{ color: 'var(--white)', fontFamily: 'var(--font-syne)' }}
          >
            Algo correu mal
          </p>
          <p
            className="text-sm mb-6"
            style={{ color: 'var(--w50)', fontFamily: 'var(--font-dm-sans)' }}
          >
            {error}
          </p>
          <button
            onClick={() => router.push('/stratego')}
            className="w-full py-3 rounded-2xl text-sm font-semibold"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              color: 'white',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return phase === 'analysing' ? (
    <LoadingV1 ideia={searchParams.get('ideia') ?? ''} />
  ) : (
    <LoadingV2
      progress={progress}
      currentStep={currentStep}
      ideia={searchParams.get('ideia') ?? ''}
    />
  )
}

export default function LoadingPage() {
  return (
    <main
      className="stratego-hero"
      style={{ minHeight: '100dvh', position: 'relative' }}
    >
      <StarfieldCanvas />
      <Suspense>
        <LoadingInner />
      </Suspense>
    </main>
  )
}
