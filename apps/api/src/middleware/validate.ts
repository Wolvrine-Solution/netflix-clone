import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { AppError } from './errorHandler'

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const messages = (result.error as ZodError).errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      return next(new AppError(400, `Validation error: ${messages}`))
    }
    req[source] = result.data
    next()
  }
}
