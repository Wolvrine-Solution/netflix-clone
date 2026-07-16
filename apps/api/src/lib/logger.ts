import pino from 'pino'
import { getEnv } from './env'

const env = (() => {
  try {
    return getEnv()
  } catch {
    return { NODE_ENV: 'test' as const }
  }
})()

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
})
