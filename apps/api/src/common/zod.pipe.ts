import { Injectable, PipeTransform } from '@nestjs/common'
import type { ZodType } from 'zod'
import { AppError } from './app-error'

/**
 * Validate a body/query/param with a Zod schema:
 *   @Body(new ZodPipe(Schema)) body: z.infer<typeof Schema>
 * Explicit pipe (not nestjs-zod's metatype lookup) because tsx emits no design:paramtypes.
 */
@Injectable()
export class ZodPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value)
    if (!result.success) {
      const messages = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join(', ')
      throw new AppError(400, `Validation error: ${messages}`)
    }
    return result.data
  }
}
