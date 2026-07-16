import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'
import type { RequestWithId } from './requestId'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = (req as RequestWithId).requestId
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      statusCode: err.statusCode,
      requestId,
    })
  }
  logger.error({ err, requestId }, 'Unhandled error')
  return res.status(500).json({
    error: 'InternalServerError',
    message: 'Something went wrong',
    statusCode: 500,
    requestId,
  })
}
