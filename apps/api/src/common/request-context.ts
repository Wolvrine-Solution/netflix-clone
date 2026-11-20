import type { FastifyRequest } from 'fastify'

/** Fields our guards attach to the Fastify request. */
export interface AppRequest extends FastifyRequest {
  userId?: string
  isKidProfile?: boolean
}
