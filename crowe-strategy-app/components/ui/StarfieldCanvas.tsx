'use client'

import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  r: number
  alpha: number
  speed: number
  phase: number
}

/**
 * StarfieldCanvas — fundo animado com 200 estrelas pulsantes
 * Extraído do design v2.5 (stratego-ai-v2_5.html)
 * Usar como background fixed z-0 nas páginas do Stratego
 */
export default function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const stars: Star[] = []
    const N = 200

    function resize() {
      if (!canvas) return
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }

    function initStars() {
      if (!canvas) return
      stars.length = 0
      for (let i = 0; i < N; i++) {
        stars.push({
          x:     Math.random() * canvas.width,
          y:     Math.random() * canvas.height,
          r:     Math.random() * 1.5 + 0.3,
          alpha: Math.random() * 0.7 + 0.1,
          speed: Math.random() * 0.008 + 0.002,
          phase: Math.random() * Math.PI * 2,
        })
      }
    }

    function draw(t: number) {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // gradiente radial de fundo
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      )
      grad.addColorStop(0, '#FFFFFF')
      grad.addColorStop(1, '#F4F6F9')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // estrelas
      for (const s of stars) {
        const pulse = Math.sin(t * s.speed + s.phase) * 0.35 + 0.65
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,45,98,${s.alpha * pulse * 0.35})`
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    resize()
    initStars()
    animId = requestAnimationFrame(draw)

    const handleResize = () => { resize(); initStars() }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  )
}
