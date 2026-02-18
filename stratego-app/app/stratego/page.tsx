import Link from 'next/link'
import { ArrowRight, Zap, BarChart3, Target } from 'lucide-react'

export default function StrategoLanding() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5]">
      {/* Header */}
      <header className="border-b border-[#27272a] px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#c1694f] font-bold text-xl">Stratego</span>
            <span className="text-xs bg-[#c1694f]/10 text-[#c1694f] border border-[#c1694f]/20 px-2 py-0.5 rounded-full">AI</span>
          </div>
          <span className="text-sm text-[#a1a1aa]">by Miguel Silva Lab</span>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#c1694f]/10 border border-[#c1694f]/20 rounded-full px-4 py-1.5 text-sm text-[#c1694f] mb-6">
            <Zap size={14} />
            <span>Plano de marketing em menos de 3 minutos</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-[#f4f4f5] mb-6 leading-tight">
            O teu plano de marketing<br />
            <span className="text-[#c1694f]">gerado por IA</span>
          </h1>

          <p className="text-lg text-[#a1a1aa] max-w-2xl mx-auto mb-10">
            Responde a 15 perguntas sobre o teu negócio. A nossa equipa de IA — analista, estratega e revisor — cria um plano de marketing completo, acionável e personalizado para ti.
          </p>

          <Link
            href="/stratego/questionario"
            className="inline-flex items-center gap-2 bg-[#c1694f] hover:bg-[#a0563f] text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            Criar o meu plano gratuito
            <ArrowRight size={20} />
          </Link>

          <p className="text-sm text-[#71717a] mt-4">Gratuito · Sem cartão de crédito · Resultado em PDF</p>
        </div>

        {/* Como funciona */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <div className="bg-[#111111] border border-[#27272a] rounded-xl p-6">
            <div className="w-10 h-10 bg-[#c1694f]/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-[#c1694f] font-bold">1</span>
            </div>
            <h3 className="font-semibold text-[#f4f4f5] mb-2">Responde ao questionário</h3>
            <p className="text-sm text-[#a1a1aa]">15 perguntas sobre o teu negócio, mercado e objetivos. Demora 8 a 12 minutos.</p>
          </div>

          <div className="bg-[#111111] border border-[#27272a] rounded-xl p-6">
            <div className="w-10 h-10 bg-[#c1694f]/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-[#c1694f] font-bold">2</span>
            </div>
            <h3 className="font-semibold text-[#f4f4f5] mb-2">A IA analisa e gera</h3>
            <p className="text-sm text-[#a1a1aa]">GPT-4o pesquisa o teu setor. Claude cria a estratégia. GPT-4o revê a qualidade. Claude finaliza.</p>
          </div>

          <div className="bg-[#111111] border border-[#27272a] rounded-xl p-6">
            <div className="w-10 h-10 bg-[#c1694f]/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-[#c1694f] font-bold">3</span>
            </div>
            <h3 className="font-semibold text-[#f4f4f5] mb-2">Recebe o teu plano</h3>
            <p className="text-sm text-[#a1a1aa]">Plano completo em PDF com análise SWOT, personas, estratégias e plano de ações mês a mês.</p>
          </div>
        </div>

        {/* O que inclui */}
        <div className="bg-[#111111] border border-[#27272a] rounded-xl p-8 mb-20">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={20} className="text-[#c1694f]" />
            <h2 className="text-xl font-bold text-[#f4f4f5]">O que inclui o plano</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Sumário executivo e diagnóstico',
              'Análise SWOT detalhada',
              'Objetivos SMART para 6 meses',
              '2 personas de cliente definidas',
              'Posicionamento e proposta de valor',
              'Estratégia nos 7Ps do marketing',
              'Plano de ações mês a mês',
              'KPIs e métricas de sucesso',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-[#a1a1aa]">
                <div className="w-1.5 h-1.5 bg-[#c1694f] rounded-full flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target size={16} className="text-[#c1694f]" />
            <span className="text-sm text-[#a1a1aa]">Já mais de 100 planos gerados</span>
          </div>
          <Link
            href="/stratego/questionario"
            className="inline-flex items-center gap-2 bg-[#c1694f] hover:bg-[#a0563f] text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            Começar agora — é gratuito
            <ArrowRight size={20} />
          </Link>
        </div>
      </main>
    </div>
  )
}
