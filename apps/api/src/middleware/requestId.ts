import { randomUUID } from 'crypto'
import { Request, Response, NextFunction } from 'express'

export interface RequestWithId extends Request {
  requestId?: string
}

export function requestId(req: RequestWithId, res: Response, next: NextFunction) {
  const id = (req.headers['x-request-id'] as string) ?? randomUUID()
  req.requestId = id
  res.setHeader('x-request-id', id)
  next()
}
