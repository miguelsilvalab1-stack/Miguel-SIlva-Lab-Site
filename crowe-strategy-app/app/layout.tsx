import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Crowe Strategy Studio — Diagnóstico Estratégico Preliminar',
  description:
    'Diagnóstico estratégico preliminar gerado por IA e validado por consultores. Crowe Advisory PT — Smart decisions. Lasting value.',
  openGraph: {
    title: 'Crowe Strategy Studio',
    description:
      'Diagnóstico estratégico preliminar para a sua empresa, gerado por IA e validado por consultores Crowe.',
    siteName: 'Crowe Strategy Studio',
    locale: 'pt_PT',
    type: 'website',
  },
  /* Versão de validação interna — não indexar */
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
