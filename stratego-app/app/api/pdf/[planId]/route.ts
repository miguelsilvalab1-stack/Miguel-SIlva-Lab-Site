import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params

  const { data: plan, error } = await supabaseAdmin
    .from('plans')
    .select('final_markdown, status, questionnaire_json, created_at')
    .eq('id', planId)
    .single()

  if (error || !plan || plan.status !== 'completed') {
    return NextResponse.json({ error: 'Plano não encontrado ou ainda não concluído.' }, { status: 404 })
  }

  const nomeNegocio = plan.questionnaire_json?.respostas?.['1_nome'] || 'Negócio'
  const dataFormatada = new Date(plan.created_at).toLocaleDateString('pt-PT', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const html = buildPDFHTML(plan.final_markdown, nomeNegocio, dataFormatada, planId)

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
  <title>Plano de Marketing — ${nomeNegocio}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; color: #1a1a1a; background: white; line-height: 1.7; }

    .cover { page-break-after: always; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; padding: 60px; text-align: center; background: #fafafa; }
    .cover-logo { font-size: 28pt; font-weight: bold; color: #c1694f; margin-bottom: 8px; font-family: -apple-system, sans-serif; }
    .cover-tag { font-size: 9pt; color: #c1694f; border: 1px solid #c1694f; padding: 3px 10px; border-radius: 20px; display: inline-block; margin-bottom: 40px; font-family: -apple-system, sans-serif; }
    .cover-title { font-size: 22pt; color: #1a1a1a; margin-bottom: 12px; font-weight: bold; }
    .cover-negocio { font-size: 16pt; color: #c1694f; margin-bottom: 40px; font-style: italic; }
    .cover-meta { font-size: 9pt; color: #888; font-family: -apple-system, sans-serif; }
    .cover-divider { width: 60px; height: 2px; background: #c1694f; margin: 30px auto; }

    .content { max-width: 720px; margin: 0 auto; padding: 50px 40px; }

    h1 { font-size: 18pt; color: #c1694f; margin-top: 40px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #c1694f; }
    h2 { font-size: 14pt; color: #1a1a1a; margin-top: 28px; margin-bottom: 8px; }
    h3 { font-size: 12pt; color: #333; margin-top: 20px; margin-bottom: 6px; }

    p { margin-bottom: 10px; }
    ul, ol { margin-left: 24px; margin-bottom: 10px; }
    li { margin-bottom: 4px; }

    /* Tabelas — optimizadas para não sair da folha */
    .table-wrapper { width: 100%; overflow-x: auto; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9pt; word-wrap: break-word; overflow-wrap: break-word; }
    th { background: #f5f5f5; color: #333; padding: 6px 8px; border: 1px solid #ddd; font-weight: bold; text-align: left; word-break: break-word; }
    td { padding: 5px 8px; border: 1px solid #ddd; vertical-align: top; word-break: break-word; }
    tr:nth-child(even) td { background: #fafafa; }

    blockquote { border-left: 3px solid #c1694f; padding-left: 16px; color: #555; margin: 16px 0; font-style: italic; }
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
  <div class="cover">
    <div class="cover-logo">Stratego</div>
    <div class="cover-tag">AI</div>
    <div class="cover-title">Plano de Marketing</div>
    <div class="cover-negocio">${nomeNegocio}</div>
    <div class="cover-divider"></div>
    <div class="cover-meta">
      Gerado a ${data}<br>
      por Stratego.AI · Miguel Silva Lab<br>
      Ref: ${planId.slice(0, 8).toUpperCase()}
    </div>
  </div>

  <div class="content">
    ${conteudo}

    <div class="footer">
      Plano de Marketing gerado por Stratego.AI — Miguel Silva Lab · stratego.miguelsilvalab.pt<br>
      Este documento foi criado automaticamente por inteligência artificial. Ref: ${planId.slice(0, 8).toUpperCase()}
    </div>
  </div>
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

    // Cabeçalhos
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

    // Lista ordenada
    const ol = trimmed.match(/^\d+\. (.+)$/)
    if (ol) {
      if (inList !== 'ol') {
        if (inList) htmlLines.push('</ul>')
        htmlLines.push('<ol>')
        inList = 'ol'
      }
      htmlLines.push(`<li>${applyInline(ol[1])}</li>`)
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
