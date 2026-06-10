/**
 * Stratego.AI — Landing page v2.5
 * Substituição da landing page anterior (mantida em page.v1.tsx)
 * Combina StarfieldCanvas (fundo) + HeroScreen (conteúdo)
 */
import StarfieldCanvas from '@/components/ui/StarfieldCanvas'
import HeroScreen from '@/components/stratego/HeroScreen'

export const metadata = {
  title: 'Stratego.AI — De ideia a plano de negócio em minutos',
  description:
    'Responde a 7 perguntas e recebe um plano de negócio completo e profissional, gerado por IA. Gratuito, sem subscrição.',
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
