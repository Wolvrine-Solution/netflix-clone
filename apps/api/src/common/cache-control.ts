import type { FastifyInstance } from 'fastify'

const PUBLIC = /^\/api(?:\/v1)?\/(content|rows|search)(\/|\?|$)/

/**
 * Catalog GETs are CDN-cacheable; everything else under /api is no-store. A request hook (not a
 * Nest interceptor) so guard rejections and error responses carry the header too.
 */
export function registerCacheControl(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (req, reply) => {
    if (!req.url.startsWith('/api')) return
    void reply.header(
      'Cache-Control',
      req.method === 'GET' && PUBLIC.test(req.url)
        ? 'public, max-age=60, stale-while-revalidate=300'
        : 'no-store'
    )
  })
}
