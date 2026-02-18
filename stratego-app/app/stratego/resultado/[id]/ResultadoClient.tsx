'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Download, Share2, ArrowLeft } from 'lucide-react'

interface Props {
  markdown: string
  planId: string
  createdAt: string
}

export default function ResultadoClient({ markdown, planId, createdAt }: Props) {
  const [downloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const dataFormatada = new Date(createdAt).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  function handleDownloadPDF() {
    // Abre o HTML formatado numa nova tab com auto-print para guardar como PDF
    window.open(`/api/pdf/${planId}`, '_blank', 'noopener,noreferrer')
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5]">
      {/* Header fixo */}
      <header className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#27272a] px-6 py-3">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/stratego"
              className="flex items-center gap-1.5 text-sm text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors"
            >
              <ArrowLeft size={14} />
              Novo plano
            </a>
            <div className="h-4 w-px bg-[#27272a]" />
            <div className="flex items-center gap-2">
              <span className="text-[#c1694f] font-bold text-sm">Stratego</span>
              <span className="text-xs bg-[#c1694f]/10 text-[#c1694f] border border-[#c1694f]/20 px-1.5 py-0.5 rounded-full">AI</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-sm text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors px-3 py-1.5 rounded-lg border border-[#27272a] hover:border-[#3f3f46]"
            >
              <Share2 size={14} />
              {copied ? 'Copiado!' : 'Partilhar'}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-1.5 text-sm bg-[#c1694f] hover:bg-[#a0563f] text-white font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              {downloading ? 'A gerar…' : 'Descarregar PDF'}
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Metadados */}
        <div className="mb-8 bg-[#111111] border border-[#27272a] rounded-xl p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-xs text-green-400 font-medium">Plano concluído</span>
            </div>
            <h1 className="text-xl font-bold text-[#f4f4f5]">Plano de Marketing</h1>
            <p className="text-sm text-[#a1a1aa] mt-1">Gerado a {dataFormatada} · ID: {planId.slice(0, 8)}</p>
          </div>
          <div className="flex gap-1">
            {['GPT-4o', 'Claude'].map(m => (
              <span key={m} className="text-xs bg-[#1a1a1a] border border-[#27272a] text-[#71717a] px-2 py-1 rounded">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Plano em Markdown */}
        <div className="prose-dark">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {markdown}
          </ReactMarkdown>
        </div>

        {/* Rodapé */}
        <div className="mt-12 pt-8 border-t border-[#27272a] text-center">
          <p className="text-sm text-[#71717a] mb-4">
            Plano gerado por Stratego.AI — Miguel Silva Lab · {dataFormatada}
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="/stratego/questionario"
              className="text-sm bg-[#111111] border border-[#27272a] text-[#a1a1aa] hover:text-[#f4f4f5] px-4 py-2 rounded-lg transition-colors"
            >
              Criar outro plano
            </a>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="text-sm bg-[#c1694f] hover:bg-[#a0563f] text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {downloading ? 'A gerar…' : 'Descarregar PDF'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
