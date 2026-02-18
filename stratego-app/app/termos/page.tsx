import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Serviço — Stratego.AI',
  description: 'Condições de utilização do serviço Stratego.AI.',
}

export default function TermosServico() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5]">
      {/* Header */}
      <header className="border-b border-[#27272a] px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link href="/stratego" className="flex items-center gap-2">
            <span className="text-[#c1694f] font-bold text-xl">Stratego</span>
            <span className="text-xs bg-[#c1694f]/10 text-[#c1694f] border border-[#c1694f]/20 px-2 py-0.5 rounded-full">AI</span>
          </Link>
          <span className="text-sm text-[#a1a1aa]">by Miguel Silva Lab</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <p className="text-sm text-[#c1694f] mb-2">Última atualização: 18 de fevereiro de 2026</p>
          <h1 className="text-3xl font-bold text-[#f4f4f5] mb-4">Termos de Serviço</h1>
          <p className="text-[#a1a1aa]">
            Ao utilizar o Stratego.AI, aceita os presentes Termos de Serviço. Leia-os com atenção antes de prosseguir.
          </p>
        </div>

        <div className="space-y-10">

          {/* 1 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              1. Identificação do Prestador
            </h2>
            <div className="text-[#a1a1aa] text-sm leading-relaxed space-y-1">
              <p><strong className="text-[#f4f4f5]">Serviço:</strong> Stratego.AI</p>
              <p><strong className="text-[#f4f4f5]">Responsável:</strong> Miguel Silva Lab</p>
              <p><strong className="text-[#f4f4f5]">Website:</strong> stratego.miguelsilvalab.pt</p>
              <p><strong className="text-[#f4f4f5]">Contacto:</strong>{' '}
                <a href="mailto:privacidade@miguelsilvalab.pt" className="text-[#c1694f] hover:underline">
                  privacidade@miguelsilvalab.pt
                </a>
              </p>
            </div>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              2. Descrição do Serviço
            </h2>
            <p className="text-[#a1a1aa] text-sm leading-relaxed">
              O Stratego.AI é uma aplicação web que, com base nas respostas a um questionário sobre o negócio do utilizador, utiliza sistemas de inteligência artificial (OpenAI GPT-4o e Anthropic Claude) para gerar automaticamente um plano de marketing personalizado, entregue em formato PDF por e-mail e consultável online. O serviço é prestado de forma gratuita, sem garantia de disponibilidade permanente.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              3. Condições de Utilização
            </h2>
            <div className="text-[#a1a1aa] text-sm leading-relaxed space-y-3">
              <p>Para utilizar o Stratego.AI, o utilizador compromete-se a:</p>
              <div className="bg-[#111111] border border-[#27272a] rounded-xl p-4 space-y-2">
                <div className="flex gap-3">
                  <span className="text-[#c1694f] mt-0.5">•</span>
                  <span>Ter idade igual ou superior a 18 anos ou agir em representação de uma empresa.</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#c1694f] mt-0.5">•</span>
                  <span>Fornecer informações verdadeiras sobre o negócio no questionário.</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#c1694f] mt-0.5">•</span>
                  <span>Não utilizar o serviço para fins ilegais, fraudulentos ou que violem direitos de terceiros.</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#c1694f] mt-0.5">•</span>
                  <span>Não tentar contornar limitações técnicas do serviço, incluindo rate limiting ou autenticação.</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#c1694f] mt-0.5">•</span>
                  <span>Não realizar pedidos automatizados em massa (bots, scripts) que perturbem o funcionamento do serviço.</span>
                </div>
              </div>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              4. Conteúdo Gerado por Inteligência Artificial
            </h2>
            <div className="bg-[#111111] border border-[#c1694f]/20 rounded-xl p-5 text-sm text-[#a1a1aa] leading-relaxed space-y-3">
              <p className="text-[#f4f4f5] font-medium">⚠️ Declaração obrigatória — AI Act da UE (Regulamento UE 2024/1689)</p>
              <p>
                O plano de marketing entregue pelo Stratego.AI é <strong className="text-[#f4f4f5]">gerado automaticamente por sistemas de inteligência artificial</strong> e deve ser tratado como um instrumento de apoio à decisão, não como aconselhamento profissional vinculativo.
              </p>
              <p>
                O Miguel Silva Lab não garante a exatidão, completude ou adequação do conteúdo gerado à situação específica de cada negócio. Recomendamos que os planos gerados sejam validados por um profissional de gestão ou marketing antes de qualquer implementação.
              </p>
              <p>
                A responsabilidade por decisões tomadas com base no conteúdo gerado pela IA é exclusivamente do utilizador.
              </p>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              5. Propriedade Intelectual
            </h2>
            <div className="text-[#a1a1aa] text-sm leading-relaxed space-y-2">
              <p>
                O código-fonte, design, marca e elementos visuais do Stratego.AI são propriedade do Miguel Silva Lab e estão protegidos por direitos de autor.
              </p>
              <p>
                O plano de marketing gerado a partir das respostas do utilizador pertence ao utilizador. O Miguel Silva Lab pode utilizar dados anonimizados e agregados (sem identificação pessoal) para melhoria do serviço.
              </p>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              6. Limitação de Responsabilidade
            </h2>
            <div className="text-[#a1a1aa] text-sm leading-relaxed space-y-2">
              <p>Na máxima extensão permitida pela lei aplicável, o Miguel Silva Lab não é responsável por:</p>
              <div className="bg-[#111111] border border-[#27272a] rounded-xl p-4 space-y-2">
                <div className="flex gap-3">
                  <span className="text-[#c1694f] mt-0.5">•</span>
                  <span>Perdas de negócio, lucros cessantes ou danos indiretos decorrentes da utilização do serviço.</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#c1694f] mt-0.5">•</span>
                  <span>Inexatidões ou omissões no conteúdo gerado pela IA.</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#c1694f] mt-0.5">•</span>
                  <span>Interrupções ou indisponibilidade do serviço.</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#c1694f] mt-0.5">•</span>
                  <span>Decisões tomadas pelo utilizador com base no plano gerado.</span>
                </div>
              </div>
              <p>
                O serviço é fornecido &quot;tal como está&quot; (<em>as-is</em>), sem garantias de qualquer natureza.
              </p>
            </div>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              7. Disponibilidade e Alterações ao Serviço
            </h2>
            <p className="text-[#a1a1aa] text-sm leading-relaxed">
              O Miguel Silva Lab reserva-se o direito de alterar, suspender ou descontinuar o serviço a qualquer momento, sem aviso prévio, nomeadamente por motivos técnicos, de segurança, económicos ou legais. Sempre que possível, os utilizadores registados serão notificados por e-mail com pelo menos 30 dias de antecedência em caso de descontinuação permanente.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              8. Privacidade e Proteção de Dados
            </h2>
            <p className="text-[#a1a1aa] text-sm leading-relaxed">
              O tratamento dos seus dados pessoais é regulado pela nossa{' '}
              <Link href="/privacidade" className="text-[#c1694f] hover:underline">
                Política de Privacidade
              </Link>
              , que faz parte integrante destes Termos de Serviço e deve ser lida em conjunto com os mesmos.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              9. Legislação Aplicável e Foro Competente
            </h2>
            <p className="text-[#a1a1aa] text-sm leading-relaxed">
              Estes Termos regem-se pela lei portuguesa e pelo direito da União Europeia. Em caso de litígio, é competente o tribunal da comarca de Lisboa, sem prejuízo do recurso a mecanismos de resolução alternativa de litígios (RAL) ou da competência de autoridades de supervisão europeias.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              10. Alterações a Estes Termos
            </h2>
            <p className="text-[#a1a1aa] text-sm leading-relaxed">
              Podemos atualizar estes Termos periodicamente. As alterações entram em vigor na data indicada no topo da página. A utilização continuada do serviço após essa data constitui aceitação dos Termos revistos.
            </p>
          </section>

          {/* Contacto */}
          <div className="bg-[#111111] border border-[#27272a] rounded-xl p-6 mt-8">
            <h2 className="text-[#f4f4f5] font-semibold mb-2">Dúvidas sobre estes Termos?</h2>
            <p className="text-[#a1a1aa] text-sm mb-3">
              Contacte-nos por e-mail para qualquer questão relacionada com estes Termos de Serviço.
            </p>
            <a
              href="mailto:privacidade@miguelsilvalab.pt"
              className="inline-flex items-center gap-2 bg-[#c1694f] hover:bg-[#a0563f] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              privacidade@miguelsilvalab.pt
            </a>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#27272a] px-6 py-6 mt-8">
        <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[#71717a]">
          <span>© 2026 Miguel Silva Lab. Todos os direitos reservados.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacidade" className="hover:text-[#a1a1aa]">Política de Privacidade</Link>
            <Link href="/termos" className="text-[#c1694f] hover:underline">Termos de Serviço</Link>
            <Link href="/stratego" className="hover:text-[#a1a1aa]">Voltar ao início</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}