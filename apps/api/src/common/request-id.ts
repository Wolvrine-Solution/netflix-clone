import { randomUUID } from 'node:crypto'
import type { FastifyInstance, FastifyRequest } from 'fastify'

/** Honour an inbound x-request-id, otherwise mint one. Used as Fastify's genReqId. */
export function genRequestId(req: { headers: Record<string, string | string[] | undefined> }) {
  const inbound = req.headers['x-request-id']
  const id = Array.isArray(inbound) ? inbound[0] : inbound
  return id && id.length <= 128 ? id : randomUUID()
}

/** Echo the id back on every response. */
export function registerRequestIdHeader(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (req: FastifyRequest, reply) => {
    void reply.header('x-request-id', String(req.id))
  })
}
