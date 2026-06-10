/**
 * Crowe Strategy Studio — Landing page v2.5
 * Substituição da landing page anterior (mantida em page.v1.tsx)
 * Combina StarfieldCanvas (fundo) + HeroScreen (conteúdo)
 */
import StarfieldCanvas from '@/components/ui/StarfieldCanvas'
import HeroScreen from '@/components/stratego/HeroScreen'

export const metadata = {
  title: 'Crowe Strategy Studio — Diagnóstico Estratégico Preliminar',
  description:
    'Responda a 7 perguntas sobre a sua empresa e receba um diagnóstico estratégico preliminar, preparado por IA e validado por consultores Crowe.',
}

export default function StrategoPage() {
  return (
    <main
      className="stratego-hero"
      style={{ minHeight: '100dvh', position: 'relative' }}
    >
      {/* Fundo animado — z-0, pointer-events none */}
      <StarfieldCanvas />

      {/* Conteúdo — z-10 */}
      <HeroScreen />
    </main>
  )
}
