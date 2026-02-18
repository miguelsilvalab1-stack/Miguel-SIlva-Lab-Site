'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface FormData {
  '1_nome': string
  '2_setor': string
  '2_setor_outro': string
  '3_produto': string
  '4_cliente_ideal': string
  '5_problema_resolve': string
  '6_concorrentes': string
  '7_diferenciador': string
  '8_preco': string
  '9_canais': string[]
  '10_orcamento': string
  '11_objetivos': string[]
  '12_sazonalidade': string
  '13_forcas': string
  '14_fraquezas': string
  '15_localizacao': string
  email: string
  nome_contacto: string
  consent_marketing: boolean
}

const initialData: FormData = {
  '1_nome': '',
  '2_setor': '',
  '2_setor_outro': '',
  '3_produto': '',
  '4_cliente_ideal': '',
  '5_problema_resolve': '',
  '6_concorrentes': '',
  '7_diferenciador': '',
  '8_preco': '',
  '9_canais': [],
  '10_orcamento': '€0 (só orgânico)',
  '11_objetivos': [],
  '12_sazonalidade': '',
  '13_forcas': '',
  '14_fraquezas': '',
  '15_localizacao': '',
  email: '',
  nome_contacto: '',
  consent_marketing: false,
}

const SETORES = [
  'Tecnologia', 'Saúde e Bem-estar', 'Educação e Formação',
  'Restauração e Hotelaria', 'Serviços Profissionais', 'Comércio e Retalho',
  'Indústria e Manufatura', 'Imobiliário', 'Desporto e Lazer',
  'Moda e Beleza', 'Outro',
]

const CANAIS = [
  'Website', 'Instagram', 'LinkedIn', 'Facebook', 'TikTok',
  'YouTube', 'Email Marketing', 'WhatsApp', 'Eventos presenciais',
  'Google Ads', 'Outro',
]

const ORCAMENTOS = [
  '€0 (só orgânico)', 'Até €100/mês', '€100–500/mês',
  '€500–1.000/mês', 'Mais de €1.000/mês',
]

const OBJETIVOS = [
  'Aumentar visibilidade e notoriedade',
  'Gerar mais leads / contactos',
  'Aumentar vendas / faturação',
  'Fidelizar clientes existentes',
  'Entrar num novo mercado ou segmento',
  'Lançar um novo produto/serviço',
  'Melhorar a presença digital',
]

const TOTAL_STEPS = 6

export default function QuestionnaireForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function update(field: keyof FormData, value: string | boolean | string[]) {
    setData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => { const e = { ...prev }; delete e[field]; return e })
  }

  function toggleArray(field: '9_canais' | '11_objetivos', value: string) {
    const arr = data[field] as string[]
    const maxItems = field === '11_objetivos' ? 3 : 999
    if (arr.includes(value)) {
      update(field, arr.filter(v => v !== value))
    } else if (arr.length < maxItems) {
      update(field, [...arr, value])
    }
  }

  function validateStep(s: number): boolean {
    const e: Record<string, string> = {}

    if (s === 1) {
      if (!data['1_nome'].trim() || data['1_nome'].length < 2) e['1_nome'] = 'Nome obrigatório (mín. 2 caracteres)'
      if (!data['2_setor']) e['2_setor'] = 'Seleciona o setor'
      if (data['2_setor'] === 'Outro' && !data['2_setor_outro'].trim()) e['2_setor_outro'] = 'Especifica o setor'
      if (!data['3_produto'].trim() || data['3_produto'].length < 20) e['3_produto'] = 'Descreve o produto (mín. 20 caracteres)'
    }

    if (s === 2) {
      if (!data['4_cliente_ideal'].trim() || data['4_cliente_ideal'].length < 30) e['4_cliente_ideal'] = 'Descreve o cliente (mín. 30 caracteres)'
      if (!data['5_problema_resolve'].trim() || data['5_problema_resolve'].length < 20) e['5_problema_resolve'] = 'Descreve o problema (mín. 20 caracteres)'
    }

    if (s === 3) {
      if (!data['8_preco'].trim() || data['8_preco'].length < 3) e['8_preco'] = 'Indica o preço (mín. 3 caracteres)'
    }

    if (s === 4) {
      if (data['11_objetivos'].length === 0) e['11_objetivos'] = 'Seleciona pelo menos um objetivo'
    }

    if (s === 6) {
      if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e['email'] = 'Email válido obrigatório'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  function nextStep() {
    if (validateStep(step)) setStep(s => s + 1)
  }

  function prevStep() {
    setStep(s => s - 1)
    setErrors({})
  }

  async function handleSubmit() {
    if (!validateStep(step)) return
    setSubmitting(true)

    const setor = data['2_setor'] === 'Outro' ? data['2_setor_outro'] : data['2_setor']
    const localizacao = data['15_localizacao'].trim() || 'Portugal'

    const questionario = {
      tipo_plano: 'marketing',
      timestamp: new Date().toISOString(),
      respostas: {
        '1_nome': data['1_nome'],
        '2_setor': setor,
        '3_produto': data['3_produto'],
        '4_cliente_ideal': data['4_cliente_ideal'],
        '5_problema_resolve': data['5_problema_resolve'],
        '6_concorrentes': data['6_concorrentes'] || 'Não sei — a IA irá pesquisar.',
        '7_diferenciador': data['7_diferenciador'] || '',
        '8_preco': data['8_preco'],
        '9_canais': data['9_canais'],
        '10_orcamento': data['10_orcamento'],
        '11_objetivos': data['11_objetivos'],
        '12_sazonalidade': data['12_sazonalidade'] || '',
        '13_forcas': data['13_forcas'] || '',
        '14_fraquezas': data['14_fraquezas'] || '',
        '15_localizacao': localizacao,
      },
    }

    try {
      const res = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          nome: data.nome_contacto || null,
          consent_marketing: data.consent_marketing,
          questionario,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro desconhecido')

      router.push(`/stratego/resultado/${json.job_id}?stream=${encodeURIComponent(json.stream_url)}`)
    } catch (err) {
      setErrors({ submit: (err as Error).message })
      setSubmitting(false)
    }
  }

  const progress = Math.round((step / TOTAL_STEPS) * 100)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center gap-2 justify-center mb-2">
            <span className="text-[#c1694f] font-bold text-lg">Stratego</span>
            <span className="text-xs bg-[#c1694f]/10 text-[#c1694f] border border-[#c1694f]/20 px-2 py-0.5 rounded-full">AI</span>
          </div>
          <p className="text-sm text-[#a1a1aa]">Ecrã {step} de {TOTAL_STEPS} · {progress}% concluído</p>
        </div>

        {/* Barra de progresso */}
        <div className="w-full bg-[#1a1a1a] rounded-full h-1.5 mb-8">
          <div
            className="bg-[#c1694f] h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="bg-[#111111] border border-[#27272a] rounded-2xl p-8 animate-slide-up">
          {/* Ecrã 1: O Teu Negócio */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-[#f4f4f5] mb-1">O teu negócio</h2>
              <p className="text-sm text-[#a1a1aa] mb-6">Conta-nos o básico sobre o que fazes.</p>

              <div className="space-y-6">
                <Field label="Qual é o nome do teu negócio ou projeto?" required error={errors['1_nome']}>
                  <input
                    type="text"
                    placeholder="Ex: AromaPorto, Studio Criativo Lisboa, etc."
                    maxLength={100}
                    value={data['1_nome']}
                    onChange={e => update('1_nome', e.target.value)}
                    className={inputClass(!!errors['1_nome'])}
                  />
                  <Hint>Se ainda não tens nome, escreve uma descrição breve.</Hint>
                </Field>

                <Field label="Em que setor ou indústria atuas?" required error={errors['2_setor']}>
                  <select
                    value={data['2_setor']}
                    onChange={e => update('2_setor', e.target.value)}
                    className={inputClass(!!errors['2_setor'])}
                  >
                    <option value="">Seleciona um setor…</option>
                    {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {data['2_setor'] === 'Outro' && (
                    <input
                      type="text"
                      placeholder="Especifica o teu setor"
                      className={cn('mt-2', inputClass(!!errors['2_setor_outro']))}
                      value={data['2_setor_outro']}
                      onChange={e => update('2_setor_outro', e.target.value)}
                    />
                  )}
                </Field>

                <Field label="Descreve o teu produto ou serviço principal." required error={errors['3_produto']}>
                  <textarea
                    rows={4}
                    placeholder="Ex: Formação presencial em IA para PMEs, com sessões de 4 horas."
                    maxLength={500}
                    value={data['3_produto']}
                    onChange={e => update('3_produto', e.target.value)}
                    className={inputClass(!!errors['3_produto'])}
                  />
                  <div className="flex justify-between mt-1">
                    <Hint>Sê específico: o que é, como funciona, o que inclui.</Hint>
                    <span className="text-xs text-[#52525b]">{data['3_produto'].length}/500</span>
                  </div>
                </Field>
              </div>
            </div>
          )}

          {/* Ecrã 2: O Teu Cliente */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-[#f4f4f5] mb-1">O teu cliente</h2>
              <p className="text-sm text-[#a1a1aa] mb-6">Quem compra de ti e porquê.</p>

              <div className="space-y-6">
                <Field label="Quem é o teu cliente ideal?" required error={errors['4_cliente_ideal']}>
                  <textarea
                    rows={4}
                    placeholder="Ex: Gestores de PMEs com 25–50 colaboradores, que querem adotar IA mas não sabem por onde começar."
                    maxLength={500}
                    value={data['4_cliente_ideal']}
                    onChange={e => update('4_cliente_ideal', e.target.value)}
                    className={inputClass(!!errors['4_cliente_ideal'])}
                  />
                  <Hint>Descreve: idade, profissão, localização, necessidades, hábitos digitais.</Hint>
                </Field>

                <Field label="Qual é o principal problema que resolves para o teu cliente?" required error={errors['5_problema_resolve']}>
                  <textarea
                    rows={3}
                    placeholder="Ex: Falta de conhecimento prático sobre como usar IA no dia-a-dia da empresa."
                    maxLength={300}
                    value={data['5_problema_resolve']}
                    onChange={e => update('5_problema_resolve', e.target.value)}
                    className={inputClass(!!errors['5_problema_resolve'])}
                  />
                  <Hint>Foca-te na dor ou necessidade que motiva a compra.</Hint>
                </Field>

                <Field label="Quem são os teus 2–3 principais concorrentes?" error={errors['6_concorrentes']}>
                  <textarea
                    rows={2}
                    placeholder="Ex: Rumos Formação, Flag, Consulting House"
                    value={data['6_concorrentes']}
                    onChange={e => update('6_concorrentes', e.target.value)}
                    className={inputClass(false)}
                  />
                  <Hint>Se não sabes, deixa em branco. A nossa IA pesquisa por ti.</Hint>
                </Field>

                <Field label="Qual é o teu principal diferenciador face à concorrência?" error={errors['7_diferenciador']}>
                  <textarea
                    rows={2}
                    placeholder="Ex: Formação 100% prática com casos reais da empresa do formando."
                    maxLength={300}
                    value={data['7_diferenciador']}
                    onChange={e => update('7_diferenciador', e.target.value)}
                    className={inputClass(false)}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Ecrã 3: O Teu Mercado */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-[#f4f4f5] mb-1">O teu mercado</h2>
              <p className="text-sm text-[#a1a1aa] mb-6">Preço, canais e orçamento de marketing.</p>

              <div className="space-y-6">
                <Field label="Qual é o preço (ou faixa de preço) do teu produto/serviço?" required error={errors['8_preco']}>
                  <input
                    type="text"
                    placeholder="Ex: 500€ por sessão, 9,99€/mês, gratuito com upsell."
                    value={data['8_preco']}
                    onChange={e => update('8_preco', e.target.value)}
                    className={inputClass(!!errors['8_preco'])}
                  />
                </Field>

                <Field label="Que canais de venda e comunicação já utilizas?">
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {CANAIS.map(canal => (
                      <label key={canal} className={cn(
                        'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-sm',
                        data['9_canais'].includes(canal)
                          ? 'border-[#c1694f] bg-[#c1694f]/5 text-[#f4f4f5]'
                          : 'border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]'
                      )}>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={data['9_canais'].includes(canal)}
                          onChange={() => toggleArray('9_canais', canal)}
                        />
                        <div className={cn(
                          'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center',
                          data['9_canais'].includes(canal) ? 'bg-[#c1694f] border-[#c1694f]' : 'border-[#3f3f46]'
                        )}>
                          {data['9_canais'].includes(canal) && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        {canal}
                      </label>
                    ))}
                  </div>
                </Field>

                <Field label="Qual é o teu orçamento mensal para marketing?">
                  <div className="space-y-2 mt-1">
                    {ORCAMENTOS.map(orc => (
                      <label key={orc} className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm',
                        data['10_orcamento'] === orc
                          ? 'border-[#c1694f] bg-[#c1694f]/5 text-[#f4f4f5]'
                          : 'border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]'
                      )}>
                        <input
                          type="radio"
                          name="orcamento"
                          className="hidden"
                          checked={data['10_orcamento'] === orc}
                          onChange={() => update('10_orcamento', orc)}
                        />
                        <div className={cn(
                          'w-4 h-4 rounded-full border-2 flex-shrink-0',
                          data['10_orcamento'] === orc ? 'border-[#c1694f] bg-[#c1694f]' : 'border-[#3f3f46]'
                        )} />
                        {orc}
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          )}

          {/* Ecrã 4: Os Teus Objetivos */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-[#f4f4f5] mb-1">Os teus objetivos</h2>
              <p className="text-sm text-[#a1a1aa] mb-6">Para onde queres ir nos próximos 6 meses.</p>

              <div className="space-y-6">
                <Field label="Quais são os teus 3 principais objetivos de marketing para os próximos 6 meses?" required error={errors['11_objetivos']}>
                  <p className="text-xs text-[#71717a] mb-2">Seleciona até 3 opções</p>
                  <div className="space-y-2">
                    {OBJETIVOS.map(obj => (
                      <label key={obj} className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm',
                        data['11_objetivos'].includes(obj)
                          ? 'border-[#c1694f] bg-[#c1694f]/5 text-[#f4f4f5]'
                          : 'border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]',
                        data['11_objetivos'].length >= 3 && !data['11_objetivos'].includes(obj) && 'opacity-40 cursor-not-allowed'
                      )}>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={data['11_objetivos'].includes(obj)}
                          onChange={() => toggleArray('11_objetivos', obj)}
                          disabled={data['11_objetivos'].length >= 3 && !data['11_objetivos'].includes(obj)}
                        />
                        <div className={cn(
                          'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center',
                          data['11_objetivos'].includes(obj) ? 'bg-[#c1694f] border-[#c1694f]' : 'border-[#3f3f46]'
                        )}>
                          {data['11_objetivos'].includes(obj) && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        {obj}
                      </label>
                    ))}
                  </div>
                </Field>

                <Field label="Há alguma sazonalidade ou timing importante no teu negócio?">
                  <textarea
                    rows={2}
                    placeholder="Ex: Pico de vendas no Natal, lançamento previsto para setembro, época baixa em janeiro."
                    maxLength={300}
                    value={data['12_sazonalidade']}
                    onChange={e => update('12_sazonalidade', e.target.value)}
                    className={inputClass(false)}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Ecrã 5: Forças e Fraquezas */}
          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold text-[#f4f4f5] mb-1">Forças e fraquezas</h2>
              <p className="text-sm text-[#a1a1aa] mb-6">Quanto mais honesto fores, melhor será o teu plano.</p>

              <div className="space-y-6">
                <Field label="Tens alguma força interna relevante?">
                  <textarea
                    rows={3}
                    placeholder="Ex: equipa especializada, rede de contactos, patentes, localização premium."
                    maxLength={400}
                    value={data['13_forcas']}
                    onChange={e => update('13_forcas', e.target.value)}
                    className={inputClass(false)}
                  />
                  <Hint>Pensa no que te dá vantagem: experiência, recursos, reputação, tecnologia.</Hint>
                </Field>

                <Field label="Tens alguma fraqueza ou limitação que queiras indicar?">
                  <textarea
                    rows={3}
                    placeholder="Ex: orçamento limitado, equipa pequena, marca pouco conhecida."
                    maxLength={400}
                    value={data['14_fraquezas']}
                    onChange={e => update('14_fraquezas', e.target.value)}
                    className={inputClass(false)}
                  />
                  <Hint>Sê honesto — quanto mais precisa for a informação, melhor será o plano.</Hint>
                </Field>

                <Field label="Qual é a localização geográfica do teu negócio e mercado-alvo?" required error={errors['15_localizacao']}>
                  <input
                    type="text"
                    placeholder="Ex: Porto, Portugal. Mercado-alvo: todo o território nacional."
                    value={data['15_localizacao']}
                    onChange={e => update('15_localizacao', e.target.value)}
                    className={inputClass(!!errors['15_localizacao'])}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Ecrã 6: Dados de Contacto */}
          {step === 6 && (
            <div>
              <h2 className="text-xl font-bold text-[#f4f4f5] mb-1">Quase pronto!</h2>
              <p className="text-sm text-[#a1a1aa] mb-6">Indica o teu email para receberes o plano.</p>

              <div className="space-y-6">
                <Field label="O teu email" required error={errors['email']}>
                  <input
                    type="email"
                    placeholder="exemplo@empresa.pt"
                    value={data.email}
                    onChange={e => update('email', e.target.value)}
                    className={inputClass(!!errors['email'])}
                  />
                </Field>

                <Field label="O teu nome (opcional)">
                  <input
                    type="text"
                    placeholder="Nome próprio"
                    value={data.nome_contacto}
                    onChange={e => update('nome_contacto', e.target.value)}
                    className={inputClass(false)}
                  />
                </Field>

                <label className="flex items-start gap-3 cursor-pointer">
                  <div
                    className={cn(
                      'w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors',
                      data.consent_marketing ? 'bg-[#c1694f] border-[#c1694f]' : 'border-[#3f3f46]'
                    )}
                    onClick={() => update('consent_marketing', !data.consent_marketing)}
                  >
                    {data.consent_marketing && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#a1a1aa]">
                    Aceito receber dicas de marketing e novidades do Miguel Silva Lab por email. Podes cancelar a qualquer momento.
                  </span>
                </label>

                <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg p-4">
                  <p className="text-xs text-[#71717a]">
                    Ao submeter, concordas com os nossos <a href="#" className="text-[#c1694f] hover:underline">Termos de Serviço</a> e <a href="#" className="text-[#c1694f] hover:underline">Política de Privacidade</a>. Os teus dados são tratados de forma segura e nunca partilhados com terceiros.
                  </p>
                </div>

                {errors['submit'] && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
                    {errors['submit']}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navegação */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#27272a]">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="text-sm text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors px-4 py-2"
              >
                ← Anterior
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <button
                onClick={nextStep}
                className="bg-[#c1694f] hover:bg-[#a0563f] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
              >
                Continuar →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={cn(
                  'font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm',
                  submitting
                    ? 'bg-[#c1694f]/50 text-white/50 cursor-not-allowed'
                    : 'bg-[#c1694f] hover:bg-[#a0563f] text-white'
                )}
              >
                {submitting ? 'A gerar o teu plano…' : 'Gerar o meu plano de marketing ✨'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// — Subcomponentes auxiliares —

function Field({
  label, required, error, children
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#e4e4e7] mb-1.5">
        {label}
        {required && <span className="text-[#c1694f] ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-[#71717a] mt-1">{children}</p>
}

function inputClass(hasError: boolean) {
  return cn(
    'w-full bg-[#0a0a0a] border rounded-lg px-3 py-2.5 text-sm text-[#f4f4f5] placeholder:text-[#52525b] focus:outline-none focus:ring-1 transition-colors resize-none',
    hasError
      ? 'border-red-500/50 focus:ring-red-500/30'
      : 'border-[#27272a] focus:border-[#c1694f] focus:ring-[#c1694f]/20'
  )
}
