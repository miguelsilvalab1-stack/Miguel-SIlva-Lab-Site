/**
 * Rate limiting com Upstash Redis
 *
 * Limites implementados:
 *   - Por email: 3 planos por 24 horas
 *   - Por IP: 5 planos por 24 horas
 *
 * Degradação graciosa: se as variáveis UPSTASH_REDIS_REST_URL /
 * UPSTASH_REDIS_REST_TOKEN não estiverem configuradas no Vercel,
 * o rate limiting é simplesmente ignorado (fail-open).
 *
 * Para ativar:
 *   1. Criar conta em https://console.upstash.com
 *   2. Criar base de dados Redis (região eu-west-1 — Ireland)
 *   3. Adicionar variáveis de ambiente no Vercel:
 *      UPSTASH_REDIS_REST_URL=https://...upstash.io
 *      UPSTASH_REDIS_REST_TOKEN=...
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Limite por email: 3 pedidos / 24h
const EMAIL_LIMIT = 3
// Limite por IP: 5 pedidos / 24h
const IP_LIMIT = 5

let emailRatelimit: Ratelimit | null = null
let ipRatelimit: Ratelimit | null = null

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    return null
  }

  return new Redis({ url, token })
}

function getEmailRatelimit(): Ratelimit | null {
  if (emailRatelimit) return emailRatelimit

  const redis = getRedis()
  if (!redis) return null

  emailRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(EMAIL_LIMIT, '24 h'),
    prefix: 'stratego:email',
    analytics: false,
  })

  return emailRatelimit
}

function getIpRatelimit(): Ratelimit | null {
  if (ipRatelimit) return ipRatelimit

  const redis = getRedis()
  if (!redis) return null

  ipRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(IP_LIMIT, '24 h'),
    prefix: 'stratego:ip',
    analytics: false,
  })

  return ipRatelimit
}

export interface RateLimitResult {
  limited: boolean
  reason?: 'email' | 'ip'
  retryAfter?: number
}

/**
 * Verifica os limites por email e por IP.
 * Retorna `{ limited: false }` se o Upstash não estiver configurado.
 */
export async function checkRateLimit(
  email: string,
  ip: string
): Promise<RateLimitResult> {
  try {
    // Verificar limite por email
    const emailLimiter = getEmailRatelimit()
    if (emailLimiter) {
      const emailKey = email.toLowerCase().trim()
      const { success, reset } = await emailLimiter.limit(emailKey)
      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000)
        return { limited: true, reason: 'email', retryAfter }
      }
    }

    // Verificar limite por IP
    const ipLimiter = getIpRatelimit()
    if (ipLimiter) {
      const { success, reset } = await ipLimiter.limit(ip)
      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000)
        return { limited: true, reason: 'ip', retryAfter }
      }
    }

    return { limited: false }

  } catch (err) {
    // Fail-open: se Redis estiver indisponível, não bloquear o utilizador
    console.warn('[ratelimit] Redis indisponível, a ignorar rate limit:', err)
    return { limited: false }
  }
}