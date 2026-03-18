import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import './globals.css'

/* ── Fontes v2.5 ─────────────────────────────────── */
const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Stratego.AI — Transforma a tua ideia num plano de negócio',
  description: 'Responde a 7 perguntas e recebe um plano de negócio completo e profissional em menos de 2 minutos, gerado por IA.',
  openGraph: {
    title: 'Stratego.AI — Tu imaginas, nós criamos',
    description: 'Plataforma portuguesa de geração de planos de negócio com IA. Gratuito, sem subscrição.',
    siteName: 'Stratego.AI by Miguel Silva Lab',
    locale: 'pt_PT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stratego.AI',
    description: 'Plano de negócio profissional gerado por IA em 2 minutos.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={`${syne.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
