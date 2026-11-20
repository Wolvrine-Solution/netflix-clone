import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { ThrottlerException } from '@nestjs/throttler'
import { PinoLogger } from 'nestjs-pino'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from './app-error'

/** Keeps the pre-migration error body: { error, message, statusCode, requestId }. */
@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(@Inject(PinoLogger) private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const req = ctx.getRequest<FastifyRequest>()
    const reply = ctx.getResponse<FastifyReply>()
    const requestId = String(req.id)

    if (exception instanceof ThrottlerException) {
      return reply.status(429).send({
        error: 'TooManyRequests',
        message: 'Too many requests',
        statusCode: 429,
        requestId,
      })
    }
    if (exception instanceof AppError) {
      return reply.status(exception.statusCode).send({
        error: exception.name,
        message: exception.message,
        statusCode: exception.statusCode,
        requestId,
      })
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      return reply.status(status).send({
        error: exception.name,
        message: exception.message,
        statusCode: status,
        requestId,
      })
    }
    this.logger.error({ err: exception, requestId }, 'Unhandled error')
    return reply.status(500).send({
      error: 'InternalServerError',
      message: 'Something went wrong',
      statusCode: 500,
      requestId,
    })
  }
}
