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

  // Gerar HTML do PDF
  const nomeNegocio = plan.questionnaire_json?.respostas?.['1_nome'] || 'Negócio'
  const dataFormatada = new Date(plan.created_at).toLocaleDateString('pt-PT', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const html = buildPDFHTML(plan.final_markdown, nomeNegocio, dataFormatada, planId)

  // Retornar HTML com Content-Disposition para impressão/PDF via browser
  // (a geração de PDF real será feita no Sprint 3 com puppeteer/wkhtmltopdf)
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

function buildPDFHTML(markdown: string, nomeNegocio: string, data: string, planId: string): string {
  // Converte markdown básico para HTML (simplificado para PDF)
  // O Sprint 3 usa biblioteca dedicada (ex: marked + puppeteer)
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

    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 9.5pt; }
    th { background: #f5f5f5; color: #333; padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; text-align: left; }
    td { padding: 7px 12px; border: 1px solid #ddd; vertical-align: top; }
    tr:nth-child(even) td { background: #fafafa; }

    blockquote { border-left: 3px solid #c1694f; padding-left: 16px; color: #555; margin: 16px 0; font-style: italic; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 9pt; font-family: monospace; }
    strong { font-weight: bold; color: #111; }

    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 8pt; color: #aaa; font-family: -apple-system, sans-serif; }

    @media print {
      body { font-size: 10pt; }
      .cover { min-height: 100vh; }
      .no-print { display: none !important; }
    }
  </style>
  <script>
    window.addEventListener('load', function() {
      // Auto-trigger o diálogo de impressão/guardar PDF após 600ms
      setTimeout(function() { window.print(); }, 600);
    });
  </script>
</head>
<body>
  <div class="no-print" style="position:fixed;top:0;left:0;right:0;background:#1a1a1a;color:#fff;padding:12px 24px;display:flex;align-items:center;justify-between;font-family:-apple-system,sans-serif;font-size:13px;z-index:999;">
    <span>💡 Para guardar como PDF: seleciona <strong>Guardar como PDF</strong> no diálogo de impressão</span>
    <button onclick="window.print()" style="background:#c1694f;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">Imprimir / Guardar PDF</button>
  </div>
  <div style="height:48px" class="no-print"></div>

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

function markdownToHtml(md: string): string {
  return md
    // Cabeçalhos
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold e italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Listas não ordenadas
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Listas ordenadas
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Código inline
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Separadores
    .replace(/^---+$/gm, '<hr>')
    // Parágrafos (linhas simples)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|u|o|b|l|h])(.+)$/gm, '<p>$1</p>')
}
