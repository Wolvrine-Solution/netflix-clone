import { HttpException } from '@nestjs/common'

/**
 * Domain error with an HTTP status. Same constructor as the former Express AppError so ported
 * service code keeps `throw new AppError(404, 'Not found')`.
 */
export class AppError extends HttpException {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message, statusCode)
    this.name = 'AppError'
  }
}
