// ===========================================
// Edge Function: chat-assistant
// Proxy para OpenAI GPT-4o-mini com knowledge base do site
// ===========================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Rate limiting por IP (10 pedidos/minuto)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 })
    return true
  }

  if (entry.count >= 10) {
    return false
  }

  entry.count++
  return true
}

const SYSTEM_PROMPT = `You are the AI assistant for Miguel Silva Lab, an AI consulting and training business in Portugal.

IMPORTANT: You MUST always respond in the SAME language the user writes in. If they write in English, you MUST reply in English. If in Spanish, reply in Spanish. If in French, reply in French. ONLY use Portuguese if the user writes in Portuguese or if the language is truly unclear. This is your #1 priority rule.

## Your role:
- Answer questions about Miguel Silva Lab's services, approach, and expertise
- Help visitors understand which service fits their needs
- Answer general questions about AI and its business applications
- Be friendly, professional, and concise
- When questions become too technical, too specific about pricing, or clearly sales-oriented, suggest booking a free 30-minute meeting via Calendly

## About Miguel Silva:
- Consultor e Formador em Inteligência Artificial
- 15+ years experience in strategy and business development
- Background: Licenciado em Economia, Executive MBA (Porto Business School), Pós-Graduação em IA aplicada ao Marketing
- Track record: +300 profissionais formados, +40 ações de formação e mentoria, +8 empresas apoiadas
- Approach: prático, orientado a resultados, adaptado ao contexto de cada cliente

## Services (5):
1. **Formação em IA para Instituições de Ensino** (Mais procurado): Formação externa em IA para instituições de ensino, centros de formação e entidades tecnológicas. Temas: introdução à IA, IA generativa, prompt engineering, assistentes de IA, automação, agentes de IA, IA para estratégia. Presencial ou online, workshops a cursos completos. Miguel tem CCP (Certificado de Competências Pedagógicas). Página dedicada: https://miguelsilvalab.com/formacao-instituicoes.html
2. **Formação em IA para Empresas** (Mais procurado): Formação prática em IA para empresas e equipas. Temas: IA para gestores, IA generativa no dia-a-dia, automação de tarefas, assistentes de IA, eficiência operacional. Processo: diagnóstico gratuito → formação à medida → resultados imediatos. +300 profissionais formados. Página dedicada: https://miguelsilvalab.com/formacao-empresas.html
3. **Consultoria Estratégica**: Análise do negócio e identificação de oportunidades para IA. Diagnóstico inicial gratuito de 30 minutos. Processo em 4 fases: 1) Diagnóstico de processos e necessidades, 2) Plano personalizado de implementação, 3) Pilotos, testes e validação, 4) Implementação real. Inclui relatório, roadmap, acompanhamento e suporte pós-implementação. Página dedicada: https://miguelsilvalab.com/consultoria-estrategica.html
4. **Mentoria Individual**: Sessões 1:1 de 60 minutos, online. Acompanhamento personalizado para líderes e profissionais que querem aplicar IA na gestão, marketing ou operações. Foco em resultados concretos e evolução contínua.
5. **Chatbots e Automação com IA**: Criação de chatbots inteligentes e assistentes de IA. Implementação em 2 a 4 semanas. Atendimento ao cliente 24/7, qualificação de leads e otimização de processos operacionais.

## FAQ:
- Público-alvo: PMEs, startups e profissionais independentes de diversos sectores
- Conhecimentos técnicos: Não são necessários. Formações desenhadas para profissionais de todas as áreas, com foco prático e linguagem acessível.
- Investimento: Varia conforme o serviço e dimensão do projeto. Mentoria tem valores acessíveis para profissionais individuais. Formações corporativas e consultoria são orçamentados à medida. A conversa inicial de 30 minutos é sempre gratuita e sem compromisso.
- Prazo de implementação: Chatbots e automações simples ficam operacionais em 2-4 semanas. Projetos mais complexos podem levar 2-3 meses.
- Suporte pós-implementação: Sim, todos os projetos incluem período de suporte e acompanhamento. Planos de manutenção e evolução contínua disponíveis.
- Mentoria individual: Sessões 1:1 personalizadas com objetivos claros e plano de ação prático. Pode começar com uma única sessão.

## Contact information:
- Email: miguelsilvalab1@gmail.com
- WhatsApp: +351 914 912 126
- Calendly (conversa gratuita 30 min): https://calendly.com/miguel-rubus/30min
- LinkedIn: https://www.linkedin.com/in/miguelfreiresilva

## Guidelines:
- Keep responses concise (2-4 sentences for simple questions, up to a short paragraph for complex ones)
- Use bullet points for listing multiple items
- For pricing questions: mention that initial consultation is free, and suggest booking via Calendly
- For complex/technical AI questions beyond basic scope: acknowledge interest and suggest booking a meeting for personalized advice
- Never invent information not provided above
- When suggesting actions, provide direct links:
  - Book meeting: [Agendar conversa](https://calendly.com/miguel-rubus/30min)
  - WhatsApp: [Enviar mensagem](https://wa.me/351914912126)
  - Email: miguelsilvalab1@gmail.com
  - Training for institutions: [Formação para Instituições](https://miguelsilvalab.com/formacao-instituicoes.html)
  - Training for companies: [Formação para Empresas](https://miguelsilvalab.com/formacao-empresas.html)
  - Strategic consulting: [Consultoria Estratégica](https://miguelsilvalab.com/consultoria-estrategica.html)
- If the user wants to get in touch or seems ready to engage, proactively suggest the free 30-minute consultation
- You can suggest the user fill out the contact form on the page
- Do NOT use markdown headers (##). Use **bold** and bullet points instead.`

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Rate limit check
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { messages } = await req.json()

    // Validate messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Truncate to last 10 messages to control token usage
    const recentMessages = messages.slice(-10).map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content).slice(0, 1000), // Limit per-message length
    }))

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Chat service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...recentMessages,
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI error:', openaiResponse.status, errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const data = await openaiResponse.json()
    const reply = data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar a sua pergunta.'

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Chat assistant error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
