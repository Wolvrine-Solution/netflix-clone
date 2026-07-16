import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { prisma } from '@netflix/db'
import { router } from './routes'
import { v1Router } from './routes/v1'
import { stripeWebhookRouter } from './routes/v1/billing'
import { errorHandler } from './middleware/errorHandler'
import { apiLimiter } from './middleware/rateLimiter'
import { requestId } from './middleware/requestId'
import { getEnv, getCorsOrigins } from './lib/env'
import { logger } from './lib/logger'
import { unpublishExpiredLicenses } from './modules/compliance/service'
import { processOutboxBatch } from './modules/search/indexer'

import { initObservability } from './lib/observability'

const env = getEnv()
initObservability()
const app = express()
const PORT = env.PORT

app.use(requestId)
app.use(helmet())
app.use(cors({ origin: getCorsOrigins(), credentials: true }))
app.use(
  express.json({
    limit: env.JSON_BODY_LIMIT,
    verify: (req, _res, buf) => {
      if ((req as express.Request & { originalUrl?: string }).originalUrl?.startsWith('/webhooks/stripe')) {
        ;(req as express.Request & { rawBody?: Buffer }).rawBody = buf
      }
    },
  })
)

app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    logger.info({
      requestId: (req as express.Request & { requestId?: string }).requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
    })
  })
  next()
})

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ready', database: 'connected' })
  } catch (err) {
    logger.error({ err }, 'Readiness check failed')
    res.status(503).json({ status: 'not_ready', database: 'disconnected' })
  }
})

app.use('/webhooks/stripe', stripeWebhookRouter)
app.use('/api', apiLimiter, router)
app.use('/api/v1', apiLimiter, v1Router)
app.use(errorHandler)

async function runBackgroundJobs() {
  try {
    await unpublishExpiredLicenses()
    await processOutboxBatch()
  } catch (err) {
    logger.warn({ err }, 'Background job error')
  }
}

setInterval(runBackgroundJobs, 60_000)

app.listen(PORT, () => {
  logger.info(`API server running on http://localhost:${PORT}`)
})

export { app }
