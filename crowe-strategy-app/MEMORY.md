# Stratego.AI — Memória de Sessão

**Última atualização:** 2026-06-02 (sessão 4 — diagnóstico + fix do pipeline v2.5 em produção)
**Projeto:** Stratego.AI — app Next.js de geração de planos de **negócio** com IA (multi-LLM)
**URL produção:** https://stratego.miguelsilvalab.pt/stratego
**Pasta local:** `~/Desktop/MIGUEL_SILVA_LAB/Miguel-SIlva-Lab-Site/stratego-app`
**Repo GitHub:** `miguelsilvalab1-stack/Miguel-SIlva-Lab-Site` (pasta `stratego-app/`)
**Deploy:** Vercel (auto-deploy no push para `main`)

> **NOTA IMPORTANTE:** A app está agora na **v2.5** (plano de NEGÓCIO, novo pipeline `orchestrator-v2`,
> nova interface). A arquitectura v1 (plano de marketing, SSE/stream, `final_markdown`) está **descontinuada**
> e mantida apenas como histórico no fim deste documento.

---

## Estado atual (v2.5)

A app transforma uma ideia em bruto num **plano de negócio** estruturado com 7 secções, em ~2 minutos,
via um pipeline multi-agente. O resultado é mostrado num dashboard de 7 tabs e pode ser exportado.

### Stack técnica
- **Framework:** Next.js 16.1.6 (App Router) + React 19 + TypeScript + Tailwind 4
- **Base de dados:** Supabase (tabelas `plans`, `leads`)
- **IA (multi-LLM):** OpenAI (GPT-4o) + Anthropic (Claude Sonnet 4.5 / Haiku 4.5)
- **Rate limiting:** Upstash Redis (3 planos / 24h por email|IP) — opcional, só se as env vars existirem
- **Deploy:** Vercel

### Pipeline `orchestrator-v2` (lib/ai/orchestrator-v2.ts)
1. **Etapa 1** — Preparação do contexto (`buildContexto`)
2. **Etapa 2** — Analista: GPT-4o (timeout 60s)
3. **Etapa 3** — Estrategas A + B: Claude Sonnet 4.5 x2 em paralelo (timeout 120s cada) — **etapa mais lenta (~120s)**
4. **Etapa 4** — Revisor: GPT-4o (timeout 60s)
5. **Etapa 5** — Finalizadores: Claude Haiku 4.5 x2 em paralelo (timeout 90s cada), devolvem JSON por secção
6. **Etapa 6** — Composição do `BusinessPlanOutput` (7 secções) e gravação em `plans.content`

**Duração típica observada em produção:** ~130–170s ponta a ponta.

### Estados do plano (coluna `plans.status`)
`pending → analysing → strategising → reviewing → finalising → done | error`

### Fluxo
1. **`POST /api/orchestrator-v2`** — valida, rate-limit, faz upsert do lead, cria `plan` (`status='pending'`),
   devolve `{ job_id }` de imediato e lança o pipeline via **`after()`** (mantém a função Vercel viva).
2. **`GET /api/orchestrator-v2/status?job_id=`** — devolve `{ state, ready }` para polling.
3. **`app/stratego/loading/page.tsx`** — faz POST, depois polling ao status; redireciona para o resultado quando `ready`.
4. **`app/stratego/resultado/[id]/page.tsx`** (RSC) — lê `plans.content`, faz parse do JSON e renderiza `ResultadoClientV2` (7 tabs).

### Ficheiros principais (v2.5)
| Ficheiro | Função |
|---|---|
| `app/api/orchestrator-v2/route.ts` | POST. Cria plano + lança pipeline com `after()`. `runtime='nodejs'`, `maxDuration=300`. |
| `app/api/orchestrator-v2/status/route.ts` | GET status para polling. Devolve `{ state, ready }`. |
| `app/api/lead/route.ts` | Associa email/nome a um `job_id` (upsert em `leads`, update `plans.lead_email`). |
| `lib/ai/orchestrator-v2.ts` | Pipeline completa. `generateBusinessPlan` exportada. Timeouts em todas as chamadas IA. |
| `app/stratego/loading/page.tsx` | Cliente: POST + polling ao status + redireciono. |
| `app/stratego/resultado/[id]/page.tsx` | RSC do resultado; converte v1→v2 se necessário. |
| `components/stratego/*` | HeroScreen, QuestionnaireV1, LeadForm, LoadingV1/V2, DashboardPRO, ResultadoClientV2. |
| `vercel.json` | `maxDuration: 300` para orchestrator, orchestrator-v2 e stream; 60 para pdf. |

### Schema Supabase (produção — IMPORTANTE)
A tabela `plans` em produção **já tem** as colunas `job_id`, `content` e `lead_email`, e o `status` aceita
os estados v2 (`strategising`, `done`, `error`). **Estas alterações foram aplicadas diretamente no Supabase**
e **NÃO existe ficheiro de migration** que as registe (o único, `001_stratego_schema.sql`, ainda é o schema v1).
→ Pendente: criar uma migration v2 para versionar o schema real.

---

## Sessão 4 (2026-06-02) — diagnóstico e correção do "plano preso"

### O que se passou na sessão anterior (18 mar, sessão 3.5)
A sessão de 18 de março estava a migrar a app de v1 para v2.5 ("Sprint 2") e terminou no meio de uma
série de 8 commits de correção de deploy na Vercel (createClient em build time, `ignoreBuildErrors`,
remoção do `resend`, parse errors, loading a chamar v1, `lead_email`, e por fim renomear
`SUPABASE_SERVICE_KEY → SUPABASE_SERVICE_ROLE_KEY` por causa de 500 em todas as chamadas). O último
commit foi `7a36929d` (pushed). A migração ficou funcional **mas com um bug crítico por resolver**.

### Bug encontrado
Os planos **nunca chegavam a `done`** — ficavam presos em `reviewing`.
- **Causa raiz:** o `orchestrator-v2/route.ts` já usava `after()` para correr o pipeline, **mas tinha
  `export const maxDuration = 60`**. O pipeline leva ~130–170s, por isso a função da Vercel era morta
  aos 60s, a meio da etapa do revisor. (O fire-and-forget original sem `after()` era um problema
  relacionado, mas a versão em produção já tinha `after()` — faltava era o tempo.)
- **Sintoma para o utilizador:** a página de resultado mostrava "ainda está a ser gerado…" para sempre.

### Correção aplicada (commit `df0eceb`, push para `main`)
1. `orchestrator-v2/route.ts` — `export const runtime = 'nodejs'` + **`export const maxDuration = 300`** (era 60).
2. `lib/ai/orchestrator-v2.ts` — **timeouts por chamada** (não existiam): Analista 60s, Estrategas 120s,
   Revisor 60s, Finalizadores 90s. Evita que uma chamada pendurada consuma o orçamento e deixe o plano preso.
3. `vercel.json` — entrada `maxDuration: 300` para `app/api/orchestrator-v2/route.ts`.

> Durante o deploy houve um conflito de rebase: o `main` remoto já tinha `after()` com `maxDuration=60`.
> Resolvido a favor dos **300s**.

### Validação em produção (teste ao vivo, 2026-06-02)
- **Job:** `84c7e2b2-6f67-4a50-b98c-7af74ede7109` (padaria de fermentação lenta, Coimbra)
- **Trajetória:** POST 200 (1,6s) → `strategising` (+38s) → `finalising` (+84s) → **`done` (+132s)**
- **Página de resultado:** renderiza as 7 secções com conteúdo real e coerente. ✅
- **Conclusão:** problema resolvido — passa o `reviewing` (onde antes morria aos 60s) e completa em ~2 min.

---

## Pendente / próximos passos

### Técnico
- **Criar migration v2 do Supabase** (colunas `job_id`, `content`, `lead_email`, novos estados do enum) —
  hoje o schema de produção foi alterado à mão e não está versionado.
- **Remover `ignoreBuildErrors: true`** do `next.config.ts` depois de corrigir os erros de TypeScript
  estritos (mascara erros no build).
- Limpar ficheiros `.bak` espalhados no projeto.
- Considerar: envio de email com o plano (Resend — removido no Sprint 2, planeado para "Sprint 3").
- Considerar: logs de duração por etapa para monitorização.

### Roadmap do produto (ref: `docs/StrategoAI_Plano_Produto_Desenvolvimento.docx` e `docs/v2.5-nova-versao/`)
- **Free:** mini plano (já funciona em produção).
- **PRO / Premium (49€ único):** dashboard completo + exportações PDF/PPT/Word — **simulado**, falta backend de
  pagamento (Stripe / EasyPay / PayPal) e geração de PDF real.
- Fases seguintes: validação com clientes reais, beta SaaS (auth + freemium), lançamento (campanhas).

---

## Notas operacionais / lições

- **Git via app desktop:** o `.git` acedido pela pasta montada dá deadlocks (locks/unlink falham) e o
  sandbox não tem credenciais GitHub. Os commits/push têm de ser feitos no Terminal do Mac.
- **Auth GitHub:** HTTPS já não aceita password — usar **PAT** (token) guardado no `osxkeychain`.
  Se der "Invalid username or token", apagar a credencial:
  `printf "protocol=https\nhost=github.com\n\n" | git credential-osxkeychain erase` e voltar a fazer push com o PAT.
- **Lock fantasma:** se aparecer `index.lock: File exists`, remover com `rm -f .git/index.lock`.
- **Rebase com editor:** usar `GIT_EDITOR=true git rebase --continue` para não abrir o vim.

---

## Supabase
- **Projeto:** `nicgjddphjevcvsfdtmr` (Miguel Silva Lab)
- **SQL Editor:** https://supabase.com/dashboard/project/nicgjddphjevcvsfdtmr/sql/

---

## Histórico — arquitectura v1 (DESCONTINUADA)

> Mantido apenas para referência. A v1 gerava planos de **marketing** via pipeline por **SSE/streaming**
> (`/api/orchestrator` + `/api/stream/[jobId]`), guardava o resultado em `plans.final_markdown` e enviava
> email via Resend. Bugs corrigidos na altura: coluna `consent_marketing` em falta; planos presos em
> `finalising` com `final_markdown=NULL`; email com "Olá, empreendedor!" em vez do nome; parser de tabelas
> do PDF reescrito; código local dessincronizado do GitHub. Os ficheiros v1 (`orchestrator.ts`,
> `stream/[jobId]/route.ts`, `pdf/[planId]/route.ts`, e os `*.v1.tsx`) ainda existem no repo.
