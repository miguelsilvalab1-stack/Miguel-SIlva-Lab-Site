/**
 * Crowe Strategy Studio — Questionário v2.5 (7 perguntas)
 * Substituição do questionário anterior (mantido em page.v1.tsx)
 */
import { Suspense } from 'react'
import StarfieldCanvas from '@/components/ui/StarfieldCanvas'
import QuestionnaireV1 from '@/components/stratego/QuestionnaireV1'

export const metadata = {
  title: 'Crowe Strategy Studio — A sua empresa',
  robots: { index: false },
}

export default function QuestionarioPage() {
  return (
    <main
      className="stratego-hero"
      style={{ minHeight: '100dvh', position: 'relative' }}
    >
      <StarfieldCanvas />
      {/* Suspense necessário para useSearchParams dentro de QuestionnaireV1 */}
      <Suspense>
        <QuestionnaireV1 />
      </Suspense>
    </main>
  )
}
