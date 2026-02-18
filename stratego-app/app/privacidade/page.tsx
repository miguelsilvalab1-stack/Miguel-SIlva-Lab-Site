import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade — Stratego.AI',
  description: 'Como o Stratego.AI recolhe, usa e protege os teus dados pessoais.',
}

export default function PoliticaPrivacidade() {
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
          <h1 className="text-3xl font-bold text-[#f4f4f5] mb-4">Política de Privacidade</h1>
          <p className="text-[#a1a1aa]">
            A sua privacidade é importante para nós. Esta política explica que dados recolhemos, para que fins, e quais os seus direitos ao abrigo do Regulamento Geral sobre a Proteção de Dados (RGPD — Regulamento UE 2016/679).
          </p>
        </div>

        <div className="space-y-10">

          {/* 1 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              1. Responsável pelo Tratamento
            </h2>
            <div className="text-[#a1a1aa] space-y-2 text-sm leading-relaxed">
              <p><strong className="text-[#f4f4f5]">Entidade:</strong> Miguel Silva Lab</p>
              <p><strong className="text-[#f4f4f5]">Website:</strong> stratego.miguelsilvalab.pt</p>
              <p><strong className="text-[#f4f4f5]">Contacto para questões de privacidade:</strong>{' '}
                <a href="mailto:privacidade@miguelsilvalab.pt" className="text-[#c1694f] hover:underline">
                  privacidade@miguelsilvalab.pt
                </a>
              </p>
            </div>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              2. Que Dados Recolhemos
            </h2>
            <div className="text-[#a1a1aa] text-sm leading-relaxed space-y-3">
              <p>Quando utiliza o Stratego.AI, recolhemos os seguintes dados pessoais:</p>
              <div className="bg-[#111111] border border-[#27272a] rounded-xl p-4 space-y-2">
                <div className="flex gap-3">
                  <span className="text-[#c1694f] mt-0.5">•</span>
                  <span><strong className="text-[#f4f4f5]">Endereço de e-mail</strong> — para envio do plano gerado e comunicações relacionadas com o serviço.</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#c1694f] mt-0.5">•</span>
                  <span><strong className="text-[#f4f4f5]">Nome</strong> — para personalização do email de entrega do plano.</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#c1694f] mt-0.5">•</span>
                  <span><strong className="text-[#f4f4f5]">Dados do negócio</strong> — nome, setor, produtos, mercado, orçamento e objetivos fornecidos no questionário. Estes dados são usados exclusivamente para gerar o plano de marketing.</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#c1694f] mt-0.5">•</span>
                  <span><strong className="text-[#f4f4f5]">Preferências de comunicação</strong> — consentimento para comunicações de marketing (opcional).</span>
                </div>
              </div>
              <p>Não recolhemos dados sensíveis (saúde, origem racial, convicções políticas, etc.).</p>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              3. Finalidades e Bases Legais do Tratamento
            </h2>
            <div className="text-[#a1a1aa] text-sm leading-relaxed">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#27272a]">
                      <th className="text-left py-2 pr-4 text-[#f4f4f5] font-medium w-1/3">Finalidade</th>
                      <th className="text-left py-2 pr-4 text-[#f4f4f5] font-medium w-1/3">Dados tratados</th>
                      <th className="text-left py-2 text-[#f4f4f5] font-medium w-1/3">Base legal (RGPD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a]">
                    <tr>
                      <td className="py-3 pr-4">Geração do plano de marketing</td>
                      <td className="py-3 pr-4">E-mail, nome, dados do negócio</td>
                      <td className="py-3">Art.º 6.º(1)(b) — execução de contrato / serviço solicitado</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4">Envio do plano por e-mail</td>
                      <td className="py-3 pr-4">E-mail, nome</td>
                      <td className="py-3">Art.º 6.º(1)(b) — execução de contrato / serviço solicitado</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4">Comunicações de marketing (newsletters, dicas)</td>
                      <td className="py-3 pr-4">E-mail, nome</td>
                      <td className="py-3">Art.º 6.º(1)(a) — consentimento (opt-in explícito)</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4">Melhoria do serviço e análise de qualidade</td>
                      <td className="py-3 pr-4">Dados do negócio (anonimizados)</td>
                      <td className="py-3">Art.º 6.º(1)(f) — interesse legítimo</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              4. Partilha com Terceiros (Subcontratantes)
            </h2>
            <div className="text-[#a1a1aa] text-sm leading-relaxed space-y-3">
              <p>Para prestar o serviço, os seus dados são partilhados com os seguintes subcontratantes, com os quais mantemos acordos de tratamento de dados (Data Processing Agreements) ao abrigo do Art.º 28.º do RGPD:</p>
              <div className="bg-[#111111] border border-[#27272a] rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-[#f4f4f5] font-medium mb-0.5">OpenAI, L.L.C. (EUA)</p>
                  <p>Fornece os modelos GPT-4o utilizados na análise e revisão do plano. Os dados são processados nos servidores da OpenAI. A OpenAI garante adequação ao RGPD através de cláusulas contratuais-tipo (SCCs).</p>
                </div>
                <div className="border-t border-[#27272a] pt-3">
                  <p className="text-[#f4f4f5] font-medium mb-0.5">Anthropic, PBC (EUA)</p>
                  <p>Fornece o modelo Claude utilizado na estratégia e finalização do plano. Os dados são processados nos servidores da Anthropic. A Anthropic garante adequação ao RGPD através de SCCs.</p>
                </div>
                <div className="border-t border-[#27272a] pt-3">
                  <p className="text-[#f4f4f5] font-medium mb-0.5">Supabase, Inc. (EUA)</p>
                  <p>Base de dados onde são armazenados o seu e-mail, nome, preferências e o plano gerado. Infraestrutura na região EU (Frankfurt).</p>
                </div>
                <div className="border-t border-[#27272a] pt-3">
                  <p className="text-[#f4f4f5] font-medium mb-0.5">Resend, Inc. (EUA)</p>
                  <p>Serviço de envio de e-mail transacional. Processa o seu endereço de e-mail exclusivamente para entrega do plano.</p>
                </div>
                <div className="border-t border-[#27272a] pt-3">
                  <p className="text-[#f4f4f5] font-medium mb-0.5">Vercel, Inc. (EUA)</p>
                  <p>Infraestrutura de alojamento da aplicação web. Não tem acesso ao conteúdo dos planos.</p>
                </div>
              </div>
              <p>Os seus dados não são vendidos a terceiros nem utilizados para fins publicitários.</p>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              5. Transferências Internacionais
            </h2>
            <p className="text-[#a1a1aa] text-sm leading-relaxed">
              Os subcontratantes OpenAI, Anthropic, Resend e Vercel estão sediados nos EUA. As transferências são realizadas ao abrigo das Cláusulas Contratuais-Tipo (SCCs) aprovadas pela Comissão Europeia, nos termos do Art.º 46.º do RGPD, garantindo um nível de proteção equivalente ao exigido na UE.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              6. Conservação dos Dados
            </h2>
            <div className="text-[#a1a1aa] text-sm leading-relaxed space-y-2">
              <p>Os seus dados são conservados pelos seguintes períodos:</p>
              <div className="bg-[#111111] border border-[#27272a] rounded-xl p-4 space-y-2">
                <div className="flex gap-3">
                  <span className="text-[#c1694f] mt-0.5">•</span>
                  <span><strong className="text-[#f4f4f5]">Plano gerado e dados do negócio:</strong> 24 meses a contar da data de geração.</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#c1694f] mt-0.5">•</span>
                  <span><strong className="text-[#f4f4f5]">E-mail e nome (para comunicação):</strong> até cancelamento do consentimento ou solicitação de eliminação.</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#c1694f] mt-0.5">•</span>
                  <span><strong className="text-[#f4f4f5]">Logs de utilização:</strong> 90 dias, para fins de segurança e diagnóstico.</span>
                </div>
              </div>
              <p>Após estes períodos, os dados são eliminados ou anonimizados de forma irreversível.</p>
            </div>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              7. Os Seus Direitos (RGPD Art.ºs 15.º a 21.º)
            </h2>
            <div className="text-[#a1a1aa] text-sm leading-relaxed space-y-3">
              <p>Tem os seguintes direitos relativamente aos seus dados pessoais:</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { titulo: 'Direito de Acesso', desc: 'Obter confirmação de que os seus dados são tratados e receber uma cópia.' },
                  { titulo: 'Direito de Retificação', desc: 'Corrigir dados inexatos ou incompletos.' },
                  { titulo: 'Direito ao Apagamento', desc: 'Solicitar a eliminação dos seus dados ("direito a ser esquecido").' },
                  { titulo: 'Direito à Limitação', desc: 'Restringir o tratamento em determinadas circunstâncias.' },
                  { titulo: 'Direito de Oposição', desc: 'Opor-se ao tratamento baseado em interesse legítimo ou marketing direto.' },
                  { titulo: 'Direito à Portabilidade', desc: 'Receber os seus dados num formato estruturado e legível por máquina.' },
                ].map((d) => (
                  <div key={d.titulo} className="bg-[#111111] border border-[#27272a] rounded-xl p-4">
                    <p className="text-[#f4f4f5] font-medium mb-1">{d.titulo}</p>
                    <p className="text-xs">{d.desc}</p>
                  </div>
                ))}
              </div>
              <p>
                Para exercer qualquer destes direitos, envie um e-mail para{' '}
                <a href="mailto:privacidade@miguelsilvalab.pt" className="text-[#c1694f] hover:underline">
                  privacidade@miguelsilvalab.pt
                </a>
                . Responderemos no prazo máximo de 30 dias.
              </p>
              <p>
                Tem também o direito de apresentar uma reclamação à autoridade de controlo nacional:{' '}
                <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" className="text-[#c1694f] hover:underline">
                  Comissão Nacional de Proteção de Dados (CNPD)
                </a>.
              </p>
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              8. Decisões Automatizadas e Inteligência Artificial
            </h2>
            <div className="text-[#a1a1aa] text-sm leading-relaxed space-y-2">
              <p>
                O Stratego.AI utiliza sistemas de IA (OpenAI GPT-4o e Anthropic Claude) para gerar planos de marketing de forma automatizada com base nas respostas ao questionário. Este processamento automático não produz efeitos jurídicos vinculativos nem o afeta de forma significativamente negativa na aceção do Art.º 22.º do RGPD.
              </p>
              <p>
                Em conformidade com o AI Act da União Europeia (Regulamento UE 2024/1689), os planos gerados incluem uma indicação clara de que foram produzidos por inteligência artificial. O plano gerado é um instrumento de apoio à decisão — não substitui aconselhamento profissional de gestão ou marketing.
              </p>
            </div>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              9. Cookies e Tecnologias de Rastreamento
            </h2>
            <p className="text-[#a1a1aa] text-sm leading-relaxed">
              O Stratego.AI utiliza apenas cookies técnicos estritamente necessários ao funcionamento da aplicação (ex: manutenção de sessão). Não utilizamos cookies de rastreamento, publicidade ou análise comportamental de terceiros sem o seu consentimento explícito.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f4f4f5] mb-3 pb-2 border-b border-[#27272a]">
              10. Alterações a Esta Política
            </h2>
            <p className="text-[#a1a1aa] text-sm leading-relaxed">
              Podemos atualizar esta política periodicamente. Em caso de alterações materiais, notificamo-lo por e-mail (se tiver fornecido consentimento para comunicações) ou através de aviso destacado no website. A data da última atualização está sempre indicada no topo desta página.
            </p>
          </section>

          {/* Contacto */}
          <div className="bg-[#111111] border border-[#c1694f]/20 rounded-xl p-6 mt-8">
            <h2 className="text-[#f4f4f5] font-semibold mb-2">Questões sobre privacidade?</h2>
            <p className="text-[#a1a1aa] text-sm mb-3">
              Contacte-nos em qualquer momento para exercer os seus direitos ou esclarecer dúvidas.
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
            <Link href="/privacidade" className="text-[#c1694f] hover:underline">Política de Privacidade</Link>
            <Link href="/termos" className="hover:text-[#a1a1aa]">Termos de Serviço</Link>
            <Link href="/stratego" className="hover:text-[#a1a1aa]">Voltar ao início</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}