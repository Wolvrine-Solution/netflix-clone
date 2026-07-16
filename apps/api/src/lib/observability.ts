import { getEnv } from './env'
import { logger } from './logger'

export function initObservability() {
  const env = getEnv()

  if (env.SENTRY_DSN) {
    logger.info('Sentry DSN configured — initialize @sentry/node in production bootstrap')
  }

  if (env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    logger.info(
      { endpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT },
      'OpenTelemetry endpoint configured'
    )
  }
}

export function recordRedMetric(name: string, value: number, labels?: Record<string, string>) {
  logger.debug({ metric: name, value, labels }, 'RED metric')
}
