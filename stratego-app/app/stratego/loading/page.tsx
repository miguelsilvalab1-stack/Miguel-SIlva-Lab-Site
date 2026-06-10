'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StarfieldCanvas from '@/components/ui/StarfieldCanvas'
import LoadingV1 from '@/components/stratego/LoadingV1'
import LoadingV2 from '@/components/stratego/LoadingV2'

type Phase = 'analysing' | 'generating'

function LoadingInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [phase, setPhase] = useState<Phase>('analysing')
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const called = useRef(false)
  const jobIdRef = useRef<string | null>(null)
  const ideia = searchParams.get('ideia') ?? ''

  useEffect(() => {
    if (called.current) return
    called.current = true

    async function generate() {
      try {
        await new Promise(r => setTimeout(r, 1500))

        const payload = {
          ideia:        searchParams.get('ideia')        ?? '',
          sector:       searchParams.get('sector')       ?? '',
          publico:      searchParams.get('publico')      ?? '',
          localizacao:  searchParams.get('localizacao')  ?? '',
          investimento: searchParams.get('investimento') ?? '',
          diferencial:  searchParams.get('diferencial')  ?? '',
          objetivo:     searchParams.get('objetivo')     ?? '',
        }

        const res = await fetch('/api/orchestrator-v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? `Erro ${res.status}`)
        }

        const { job_id } = await res.json()
        jobIdRef.current = job_id
        setPhase('generating')

        let prog = 5
        const STEPS = [
          { at: 12, step: 1 }, { at: 28, step: 2 }, { at: 48, step: 3 },
          { at: 70, step: 4 }, { at: 88, step: 5 },
        ]

        const FAIL_MSG =
          'A geração do plano falhou. Tenta novamente dentro de alguns minutos.'

        const interval = setInterval(async () => {
          const inc = prog < 50 ? Math.random() * 3 + 1 : Math.random() * 1.5 + 0.5
          prog = Math.min(prog + inc, 95)
          setProgress(Math.round(prog))
          for (const { at, step } of STEPS) { if (prog >= at) setCurrentStep(step) }

          if (jobIdRef.current) {
            try {
              const check = await fetch(`/api/orchestrator-v2/status?job_id=${jobIdRef.current}`)
              if (check.ok) {
                const { ready, state } = await check.json()
                if (state === 'error') {
                  clearInterval(interval)
                  setError(FAIL_MSG)
                  return
                }
                if (ready) {
                  clearInterval(interval)
                  setProgress(100)
                  setCurrentStep(5)
                  await new Promise(r => setTimeout(r, 800))
                  router.push(`/stratego/resultado/${jobIdRef.current}`)
                }
              }
            } catch { /* ignora */ }
          }
        }, 1400)

        setTimeout(async () => {
          clearInterval(interval)
          if (!jobIdRef.current) return
          // Só redirecciona se o plano estiver mesmo pronto; caso contrário mostra erro
          try {
            const check = await fetch(`/api/orchestrator-v2/status?job_id=${jobIdRef.current}`)
            const { ready } = check.ok ? await check.json() : { ready: false }
            if (ready) {
              router.push(`/stratego/resultado/${jobIdRef.current}`)
            } else {
              setError(FAIL_MSG)
            }
          } catch {
            setError(FAIL_MSG)
          }
        }, 240_000)

      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      }
    }

    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-5 text-center">
        <div className="rounded-3xl p-8 max-w-sm w-full"
          style={{ background: 'rgba(232,67,45,0.08)', border: '1px solid rgba(232,67,45,0.2)' }}>
          <p className="text-lg font-semibold mb-2"
            style={{ color: 'var(--white)', fontFamily: 'var(--font-syne)' }}>
            Algo correu mal
          </p>
          <p className="text-sm mb-6"
            style={{ color: 'var(--w50)', fontFamily: 'var(--font-dm-sans)' }}>
            {error}
          </p>
          <button onClick={() => router.push('/stratego')}
            className="w-full py-3 rounded-2xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              color: 'white', fontFamily: 'var(--font-dm-sans)' }}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return phase === 'analysing'
    ? <LoadingV1 ideia={ideia} />
    : <LoadingV2 progress={progress} currentStep={currentStep} ideia={ideia} />
}

export default function LoadingPage() {
  return (
    <main className="stratego-hero" style={{ minHeight: '100dvh', position: 'relative' }}>
      <StarfieldCanvas />
      <Suspense>
        <LoadingInner />
      </Suspense>
    </main>
  )
}
