'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface StatusEvent {
  etapa: number
  modelo: string
  mensagem: string
}

interface Props {
  jobId: string
  streamUrl: string
}

const ETAPAS = [
  { label: 'Início', descricao: 'A ligar ao servidor…' },
  { label: 'Preparação', descricao: 'A preparar o teu plano…' },
  { label: 'Análise', descricao: 'A pesquisar o teu setor e concorrência…' },
  { label: 'Estratégia', descricao: 'A construir o teu plano de marketing…' },
  { label: 'Revisão', descricao: 'A verificar qualidade e coerência…' },
  { label: 'Finalização', descricao: 'A polir e finalizar o teu plano…' },
]

export default function ProgressTracker({ jobId, streamUrl }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<StatusEvent>({ etapa: 0, modelo: '', mensagem: 'A ligar ao servidor…' })
  const [done, setDone] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource(streamUrl)
    esRef.current = es

    es.addEventListener('status', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as StatusEvent
        setStatus(data)
      } catch {}
    })

    es.addEventListener('complete', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { pdf_url: string; mensagem: string }
        setDone(true)
        setStatus({ etapa: 5, modelo: '', mensagem: data.mensagem })
        es.close()
        // Navegar para a página de resultados após breve pausa
        setTimeout(() => {
          router.push(data.pdf_url)
        }, 1500)
      } catch {}
    })

    es.addEventListener('error', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { error: string }
        setErrorMsg(data.error)
      } catch {
        setErrorMsg('Ocorreu um erro inesperado. Por favor tenta novamente.')
      }
      es.close()
    })

    es.onerror = () => {
      if (!done) {
        setErrorMsg('A ligação foi interrompida. Por favor refresca a página.')
        es.close()
      }
    }

    return () => {
      es.close()
    }
  }, [streamUrl, done, router])

  const progressPercent = Math.round((status.etapa / 5) * 100)

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#111111] border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[#f4f4f5] mb-2">Ocorreu um erro</h2>
          <p className="text-sm text-[#a1a1aa] mb-6">{errorMsg}</p>
          <a
            href="/stratego/questionario"
            className="inline-flex items-center gap-2 bg-[#c1694f] hover:bg-[#a0563f] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            Tentar novamente
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center gap-2 justify-center mb-4">
            <span className="text-[#c1694f] font-bold text-xl">Stratego</span>
            <span className="text-xs bg-[#c1694f]/10 text-[#c1694f] border border-[#c1694f]/20 px-2 py-0.5 rounded-full">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-[#f4f4f5] mb-2">
            {done ? 'Plano pronto! ✨' : 'A gerar o teu plano…'}
          </h1>
          <p className="text-sm text-[#a1a1aa]">
            {done ? 'A redirecionar para o teu plano…' : 'Aguarda enquanto a nossa equipa de IA trabalha para ti.'}
          </p>
        </div>

        {/* Barra de progresso */}
        <div className="bg-[#111111] border border-[#27272a] rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#a1a1aa]">Progresso</span>
            <span className="text-sm font-bold text-[#c1694f]">{progressPercent}%</span>
          </div>
          <div className="w-full bg-[#1a1a1a] rounded-full h-2 mb-6">
            <div
              className="bg-[#c1694f] h-2 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Etapas */}
          <div className="space-y-3">
            {ETAPAS.map((etapa, idx) => {
              const etapaNum = idx
              const isActive = etapaNum === status.etapa
              const isDone = etapaNum < status.etapa
              const isFuture = etapaNum > status.etapa

              if (etapaNum === 0) return null // etapa 0 é só o início

              return (
                <div key={etapa.label} className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-all',
                  isActive && 'bg-[#c1694f]/5 border border-[#c1694f]/20',
                  isDone && 'opacity-60',
                  isFuture && 'opacity-30'
                )}>
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                    isDone ? 'bg-[#c1694f]' : isActive ? 'bg-[#c1694f]/20 border border-[#c1694f]' : 'bg-[#1a1a1a] border border-[#3f3f46]'
                  )}>
                    {isDone ? (
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span className={cn('text-xs font-bold', isActive ? 'text-[#c1694f]' : 'text-[#52525b]')}>{etapaNum}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-medium', isActive ? 'text-[#f4f4f5]' : 'text-[#a1a1aa]')}>{etapa.label}</span>
                      {isActive && status.modelo && (
                        <span className="text-xs bg-[#c1694f]/10 text-[#c1694f] border border-[#c1694f]/20 px-1.5 py-0.5 rounded">
                          {status.modelo}
                        </span>
                      )}
                      {isActive && !done && (
                        <span className="flex gap-0.5">
                          {[0, 1, 2].map(i => (
                            <span
                              key={i}
                              className="w-1 h-1 bg-[#c1694f] rounded-full animate-pulse-slow"
                              style={{ animationDelay: `${i * 0.3}s` }}
                            />
                          ))}
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <p className="text-xs text-[#71717a] mt-0.5 truncate">{status.mensagem}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Info */}
        {!done && (
          <div className="bg-[#111111] border border-[#27272a] rounded-xl p-4">
            <p className="text-xs text-[#71717a] text-center">
              O processo demora tipicamente 2 a 4 minutos. Não feches esta página.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
