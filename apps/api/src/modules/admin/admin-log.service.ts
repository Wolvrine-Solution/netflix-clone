import { Inject, Injectable } from '@nestjs/common'
import { adminLog, type Database } from '@netflix/db'
import type { AppRequest } from '../../common/request-context'
import { DB } from '../../common/tokens'

/** Writes AdminLog audit rows. A failure to audit never breaks the admin request. */
@Injectable()
export class AdminLogService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async log(
    req: Pick<AppRequest, 'userId' | 'ip'>,
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    if (!req.userId) return
    try {
      await this.db.insert(adminLog).values({
        adminId: req.userId,
        action,
        resource,
        resourceId,
        details,
        ipAddress: String(req.ip ?? ''),
      })
    } catch {
      // audit failure must not fail the request
    }
  }
}
