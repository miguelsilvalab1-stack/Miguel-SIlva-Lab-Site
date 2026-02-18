import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/db/supabase'
import ResultadoClient from './ResultadoClient'
import ProgressTracker from '@/components/ProgressTracker'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ stream?: string }>
}

export default async function ResultadoPage({ params, searchParams }: Props) {
  const { id } = await params
  const { stream } = await searchParams

  const { data: plan } = await supabaseAdmin
    .from('plans')
    .select('status, final_markdown, created_at')
    .eq('id', id)
    .single()

  // Se o plano ainda não terminou, mostra o tracker de progresso
  if (!plan || plan.status !== 'completed') {
    if (stream) {
      return <ProgressTracker jobId={id} streamUrl={stream} />
    }
    notFound()
  }

  return <ResultadoClient markdown={plan.final_markdown || ''} planId={id} createdAt={plan.created_at} />
}
