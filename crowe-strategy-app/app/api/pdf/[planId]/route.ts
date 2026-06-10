import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { BusinessPlanOutput } from '@/lib/ai/orchestrator-v2'

export const runtime = 'nodejs'

const CROWE_LOGO = 'data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWluWU1pZCBtZWV0IiB3aWR0aD0iMTA2IiBoZWlnaHQ9IjMwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDYgMzAiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDEwNiAzMCIgcm9sZT0iaW1nIiBhcmlhLWxhYmVsPSJDcm93ZSBMb2dvIj48ZyBmaWxsPSIjMDAyZDYyIj48cGF0aCBkPSJtNTcuMiA5LjljLTEuMy0uOS0yLjktMS40LTQuNS0xLjQtNC4zIDAtNi44IDIuOS02LjggNi43IDAgNC4xIDMgNi45IDYuOCA2LjkgMS41IDAgMy4xLS40IDQuNC0xLjJsLjkgMS40Yy0xLjYgMS0zLjUgMS41LTUuNCAxLjUtNi4yIDAtOS4zLTQtOS4zLTguNSAwLTQuMSAzLjQtOC40IDkuNi04LjQgMS45IDAgMy44LjUgNS4zIDEuN2wtMSAxLjMiLz48cGF0aCBkPSJtNjEuNCAxMy4ybC45LS45Yy41LS41IDEuMS0uOCAxLjgtLjkuOC4xIDEuNS41IDIgMS4xbC0xIDEuNGMtLjUtLjMtMS4xLS41LTEuNy0uNS0xLjEgMC0yLjEgMS4xLTIuMSAzLjd2Ni4zaC0yLjJ2LTExLjZoMi4ybC4xIDEuNCIvPjxwYXRoIGQ9Im02NS40IDE3LjVjLS4xLTMuMiAyLjUtNiA1LjgtNi4xIDMuMy0uMSA2LjIgMi40IDYuMyA1LjcgMCAuMSAwIC4zIDAgLjQgMCAzLjYtMi40IDYuMi02LjEgNi4ycy02LTIuNi02LTYuMm0yLjQgMGMwIDIuMi44IDQuOCAzLjcgNC44IDIuOSAwIDMuNy0yLjYgMy43LTQuOHMtMS00LjUtMy44LTQuNWMtMi44IDAtMy43IDIuNC0zLjYgNC41Ii8+PHBhdGggZD0ibTg3LjIgMTEuOGMxLjIgMi44IDIuNCA1LjYgMy42IDguOSAxLTMuNCAyLTYuMyAzLTkuMWwyIC4zLTQuMyAxMS42aC0xLjVjLTEuMi0yLjktMi41LTUuOC0zLjctOS4xLTEuMiAzLjMtMi4zIDYuMi0zLjYgOS4xaC0xLjRsLTQuMy0xMS40IDIuMi0uNWMxIDIuOSAyIDUuNyAzIDkuMSAxLjItMy4zIDIuNC02LjEgMy42LTguOSIvPjxwYXRoIGQ9Im05Ny43IDE3LjdjLS4xIDIuMyAxLjcgNC4zIDQuMiA0LjUgMS4yIDAgMi40LS40IDMuNC0xbC42IDEuMWMtMS4yLjgtMi42IDEuMy00LjEgMS40LTMuOCAwLTYuNC0yLjItNi40LTYuMy0uMi0zLjEgMi4yLTUuNyA1LjQtNS45LjIgMCAuMyAwIC41IDAgMy43IDAgNSAzLjIgNC44IDYuM2gtOC40em02LjItMS40YzAtMS44LS44LTMuNC0yLjctMy40LTEuOSAwLTMuNCAxLjQtMy40IDMuMiAwIDAgMCAuMSAwIC4xaDYuMXoiLz48L2c+PHBhdGggZD0ibTE4LjguMmMwLS4xLS4xLS4xLS4yLS4yLS4xIDAtLjIuMS0uMi4xbC0xOC4zIDI5LjdjLS4xLjEtLjEuMi0uMS4ycy4xIDAgLjEtLjFsMTguMi0yMS4xYy4xLS4xLjEtLjEuMS0uMXMwIC4xLS4xLjJsLTEyLjYgMjFjMCAwIDAgLjEgMCAuMSAwIDAgLjEgMCAuMS0uMWwxNC44LTE3LjNjLjEtLjEuMS0uMS4xLS4xczAgLjEtLjEuMmwtOS42IDE3LjFjMCAuMSAwIC4yIDAgLjIgMCAwIC4xIDAgLjEtLjFsMTEuOC0xMy43Yy4xLS4yLjItLjIuMy0uMi4xIDAgLjIuMS4zLjFsMTEuNSAxMy44YzAgLjEuMS4xLjEuMSAwIDAgMC0uMS0uMS0uMmwtMTYuMi0yOS42IiBmaWxsPSIjZmRiOTEzIi8+PC9zdmc+'

const SECTION_TITLES: Array<[keyof BusinessPlanOutput, string]> = [
  ['resumo_executivo',      'Sumário Executivo'],
  ['analise_mercado',       'Análise Setorial'],
  ['estrategia_comercial',  'Posicionamento e Estratégia Comercial'],
  ['plano_financeiro',      'Análise Económico-Financeira'],
  ['plano_operacional',     'Operações e Adoção de IA'],
  ['marketing_comunicacao', 'Go-to-Market e Comunicação'],
  ['proximos_passos',       'Roteiro de 90 Dias'],
]

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params

  // Instanciado na função (a service key só existe em runtime)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: plan, error } = await supabaseAdmin
    .from('plans')
    .select('content, status, created_at')
    .eq('job_id', planId)
    .single()

  if (error || !plan || plan.status !== 'done' || !plan.content) {
    return NextResponse.json({ error: 'Plano não encontrado ou ainda não concluído.' }, { status: 404 })
  }

  /* Compor markdown a partir das 7 secções do plano v2 */
  let markdown = ''
  let ideia = ''
  try {
    const parsed = JSON.parse(plan.content) as BusinessPlanOutput
    ideia = (parsed.resumo_executivo || '')
      .replace(/[#*>`]/g, '')
      .split('\n').map(l => l.trim()).filter(Boolean)[0]?.slice(0, 90) ?? ''
    markdown = SECTION_TITLES
      .filter(([key]) => parsed[key]?.trim())
      .map(([key, title]) => `# ${title}\n\n${parsed[key].trim()}`)
      .join('\n\n')
  } catch {
    markdown = plan.content
  }

  const dataFormatada = new Date(plan.created_at).toLocaleDateString('pt-PT', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const html = buildPDFHTML(markdown, ideia, dataFormatada, planId)

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

function buildPDFHTML(markdown: string, nomeNegocio: string, data: string, planId: string): string {
  const conteudo = markdownToHtml(markdown)

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diagnóstico Estratégico Preliminar — Crowe Strategy Studio</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: Arial, 'Helvetica Neue', sans-serif; font-size: 11pt; color: #1a1a1a; background: white; line-height: 1.7; }

    .cover { page-break-after: always; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; padding: 60px; text-align: center; background: #fafafa; }
    .cover-logo { font-size: 28pt; font-weight: bold; color: #FDB913; margin-bottom: 8px; font-family: -apple-system, sans-serif; }
    .cover-tag { font-size: 9pt; color: #FDB913; border: 1px solid #FDB913; padding: 3px 10px; border-radius: 20px; display: inline-block; margin-bottom: 40px; font-family: -apple-system, sans-serif; }
    .cover-title { font-size: 22pt; color: #1a1a1a; margin-bottom: 12px; font-weight: bold; }
    .cover-negocio { font-size: 16pt; color: #FDB913; margin-bottom: 40px; font-style: italic; }
    .cover-meta { font-size: 9pt; color: #888; font-family: -apple-system, sans-serif; }
    .cover-divider { width: 60px; height: 2px; background: #FDB913; margin: 30px auto; }

    .content { max-width: 720px; margin: 0 auto; padding: 50px 40px; }

    h1 { font-size: 18pt; color: #002D62; margin-top: 40px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 3px solid #FDB913; }
    h2 { font-size: 14pt; color: #1a1a1a; margin-top: 28px; margin-bottom: 8px; }
    h3 { font-size: 12pt; color: #333; margin-top: 20px; margin-bottom: 6px; }
    h4 { font-size: 11pt; color: #555; margin-top: 16px; margin-bottom: 5px; text-transform: none; }

    p { margin-bottom: 10px; }
    ul, ol { margin-left: 24px; margin-bottom: 10px; }
    li { margin-bottom: 4px; }

    /* Tabelas — optimizadas para não sair da folha */
    .table-wrapper { width: 100%; overflow-x: auto; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9pt; word-wrap: break-word; overflow-wrap: break-word; }
    th { background: #f5f5f5; color: #333; padding: 6px 8px; border: 1px solid #ddd; font-weight: bold; text-align: left; word-break: break-word; }
    td { padding: 5px 8px; border: 1px solid #ddd; vertical-align: top; word-break: break-word; }
    tr:nth-child(even) td { background: #fafafa; }

    blockquote { border-left: 3px solid #FDB913; padding-left: 16px; color: #002D62; margin: 16px 0; font-style: italic; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 9pt; font-family: monospace; }
    strong { font-weight: bold; color: #111; }

    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 8pt; color: #aaa; font-family: -apple-system, sans-serif; }

    @media print {
      body { font-size: 10pt; }
      .cover { min-height: 100vh; }
      .content { max-width: 100%; padding: 30px 20px; }
      table { font-size: 8pt; page-break-inside: avoid; }
      th { padding: 4px 6px; }
      td { padding: 3px 6px; }
      .table-wrapper { overflow-x: hidden; }
      h1, h2, h3 { page-break-after: avoid; }
      p { orphans: 3; widows: 3; }
    }
  </style>
</head>
<body>
  <div class="cover" style="background:#FFFFFF; align-items:flex-start; text-align:left; justify-content:space-between; padding:50px 60px;">
    <div style="display:flex; align-items:center; gap:14px;">
      <img src="${CROWE_LOGO}" style="height:34px;" alt="Crowe">
      <span style="border-left:1px solid #D5DBE7; padding-left:14px; font-family:Arial,sans-serif; font-size:13pt; color:#002D62; font-weight:bold;">Strategy Studio</span>
    </div>
    <div>
      <div style="width:64px; height:5px; background:#FDB913; margin-bottom:26px;"></div>
      <div style="font-family:Arial,sans-serif; font-weight:bold; font-size:30pt; color:#002D62; line-height:1.15;">Diagnóstico Estratégico<br>Preliminar</div>
      <div style="font-family:Arial,sans-serif; font-size:12pt; color:#5C6680; margin-top:18px; max-width:540px;">${nomeNegocio}</div>
    </div>
    <div style="width:100%;">
      <div style="font-family:Arial,sans-serif; font-size:9pt; color:#5C6680; margin-bottom:18px;">
        Gerado a ${data} · Crowe AI Consulting Unit · Ref: ${planId.slice(0, 8).toUpperCase()}
      </div>
      <div style="background:#002D62; margin:0 -60px -50px; padding:16px 60px; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-family:Arial,sans-serif; font-size:9pt; color:#FFFFFF; font-weight:bold;">Audit / Tax / Advisory / Outsourcing</span>
        <span style="font-family:Arial,sans-serif; font-size:9pt; color:#FDB913; font-weight:bold;">Smart decisions. Lasting value.</span>
      </div>
    </div>
  </div>

  <div class="content">
    ${conteudo}

    <div class="footer">
      <img src="${CROWE_LOGO}" style="height:18px; margin-bottom:8px;" alt="Crowe"><br>
      © 2026 Crowe Advisory PT · Audit / Tax / Advisory / Outsourcing · Smart decisions. Lasting value.<br>
      Documento preliminar gerado por inteligência artificial — não dispensa validação por um consultor Crowe. Ref: ${planId.slice(0, 8).toUpperCase()}
    </div>
  </div>
  <script>
    // Abre o diálogo de impressão (Guardar como PDF) assim que a página carrega
    window.addEventListener('load', function () {
      setTimeout(function () { window.print() }, 400)
    })
  </script>
</body>
</html>`
}

// ─── Formatação inline (bold, italic, code) ─────────────────────────────────

function applyInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
}

// ─── Conversão de tabelas markdown para HTML ─────────────────────────────────

function convertTables(md: string): string {
  const lines = md.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    const trimmed = lines[i].trim()

    // Detectar início de tabela: linha que contém | e parece ter colunas
    if (trimmed.includes('|') && trimmed.startsWith('|')) {
      const nextTrimmed = (lines[i + 1] || '').trim()

      // Separador: contém | e - (com possíveis : para alinhamento)
      const isSeparator = nextTrimmed.startsWith('|') &&
        nextTrimmed.includes('-') &&
        /^[\s|:\-]+$/.test(nextTrimmed)

      if (isSeparator) {
        // Recolher cabeçalho
        const headerCells = parseCells(trimmed)

        // Recolher linhas do corpo
        const bodyRows: string[][] = []
        let j = i + 2

        while (j < lines.length) {
          const rowTrimmed = lines[j].trim()
          if (!rowTrimmed.includes('|') || !rowTrimmed.startsWith('|')) break
          bodyRows.push(parseCells(rowTrimmed))
          j++
        }

        // Construir HTML da tabela com wrapper
        const numCols = headerCells.length
        const colWidth = numCols > 0 ? Math.floor(100 / numCols) : 100

        const headerHtml = '<tr>' +
          headerCells.map(h => `<th style="width:${colWidth}%">${applyInline(h)}</th>`).join('') +
          '</tr>'

        const rowsHtml = bodyRows
          .map(cells => {
            // Preencher células em falta para alinhar com cabeçalho
            while (cells.length < numCols) cells.push('')
            return '<tr>' + cells.slice(0, numCols).map(c => `<td>${applyInline(c)}</td>`).join('') + '</tr>'
          })
          .join('\n')

        result.push(
          `<div class="table-wrapper"><table><thead>${headerHtml}</thead><tbody>${rowsHtml}</tbody></table></div>`
        )
        i = j
        continue
      }
    }

    result.push(lines[i])
    i++
  }

  return result.join('\n')
}

// Extrair células de uma linha de tabela markdown, preservando células vazias
function parseCells(line: string): string[] {
  let trimmed = line.trim()
  // Remover | inicial e final
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1)
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1)
  // Dividir e manter células vazias (trim cada uma)
  return trimmed.split('|').map(c => c.trim())
}

// ─── Conversão de markdown para HTML ─────────────────────────────────────────

function markdownToHtml(md: string): string {
  // 1. Tabelas (blocos multi-linha — processar primeiro)
  md = convertTables(md)

  // 2. Separar em linhas para processar bloco a bloco
  const lines = md.split('\n')
  const htmlLines: string[] = []
  let inList: 'ul' | 'ol' | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Linhas vazias — fechar lista se aberta
    if (trimmed === '' || trimmed === '</p><p>') {
      if (inList) { htmlLines.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null }
      continue
    }

    // Já é HTML (tabelas, etc.) — passar directamente
    if (trimmed.startsWith('<div') || trimmed.startsWith('<table') ||
        trimmed.startsWith('<thead') || trimmed.startsWith('<tbody') ||
        trimmed.startsWith('<tr') || trimmed.startsWith('</')) {
      if (inList) { htmlLines.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null }
      htmlLines.push(line)
      continue
    }

    // Cabeçalhos (h4 primeiro — o conversor tem de apanhar #### antes de ###)
    const h4 = trimmed.match(/^#### (.+)$/)
    if (h4) {
      if (inList) { htmlLines.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null }
      htmlLines.push(`<h4>${applyInline(h4[1])}</h4>`)
      continue
    }
    const h3 = trimmed.match(/^### (.+)$/)
    if (h3) {
      if (inList) { htmlLines.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null }
      htmlLines.push(`<h3>${applyInline(h3[1])}</h3>`)
      continue
    }
    const h2 = trimmed.match(/^## (.+)$/)
    if (h2) {
      if (inList) { htmlLines.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null }
      htmlLines.push(`<h2>${applyInline(h2[1])}</h2>`)
      continue
    }
    const h1 = trimmed.match(/^# (.+)$/)
    if (h1) {
      if (inList) { htmlLines.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null }
      htmlLines.push(`<h1>${applyInline(h1[1])}</h1>`)
      continue
    }

    // Separador
    if (/^---+$/.test(trimmed)) {
      if (inList) { htmlLines.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null }
      htmlLines.push('<hr>')
      continue
    }

    // Blockquote
    const bq = trimmed.match(/^> (.+)$/)
    if (bq) {
      if (inList) { htmlLines.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null }
      htmlLines.push(`<blockquote>${applyInline(bq[1])}</blockquote>`)
      continue
    }

    // Lista não ordenada
    const ul = trimmed.match(/^[-*] (.+)$/)
    if (ul) {
      if (inList !== 'ul') {
        if (inList) htmlLines.push('</ol>')
        htmlLines.push('<ul>')
        inList = 'ul'
      }
      htmlLines.push(`<li>${applyInline(ul[1])}</li>`)
      continue
    }

    // Lista ordenada — preserva a numeração original do markdown,
    // mesmo quando os itens estão separados por parágrafos (start="N")
    const ol = trimmed.match(/^(\d+)\. (.+)$/)
    if (ol) {
      if (inList !== 'ol') {
        if (inList) htmlLines.push('</ul>')
        const start = parseInt(ol[1], 10) || 1
        htmlLines.push(start > 1 ? `<ol start="${start}">` : '<ol>')
        inList = 'ol'
      }
      htmlLines.push(`<li>${applyInline(ol[2])}</li>`)
      continue
    }

    // Parágrafo (tudo o resto)
    if (inList) { htmlLines.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null }
    htmlLines.push(`<p>${applyInline(trimmed)}</p>`)
  }

  // Fechar lista pendente
  if (inList) htmlLines.push(inList === 'ul' ? '</ul>' : '</ol>')

  return htmlLines.join('\n')
}
