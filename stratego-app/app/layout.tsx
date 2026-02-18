import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stratego.AI — Planos de Marketing com IA',
  description: 'Gera um plano de marketing profissional e acionável em minutos, com inteligência artificial.',
  openGraph: {
    title: 'Stratego.AI',
    description: 'O teu plano de marketing gerado por IA em menos de 3 minutos.',
    siteName: 'Stratego.AI by Miguel Silva Lab',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  )
}
