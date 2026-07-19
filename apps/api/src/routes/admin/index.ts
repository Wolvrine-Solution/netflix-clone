import { Router } from 'express'
import { adminContentRouter } from './content'
import { adminRowsRouter } from './rows'
import { adminUsersRouter } from './users'
import { adminGenresRouter } from './genres'
import { adminAnalyticsRouter } from './analytics'
import { adminNotificationsRouter } from './notifications'
import { adminMfaRouter } from './mfa'

export const adminRouter = Router()

adminRouter.use('/mfa', adminMfaRouter)
adminRouter.use('/content', adminContentRouter)
adminRouter.use('/rows', adminRowsRouter)
adminRouter.use('/users', adminUsersRouter)
adminRouter.use('/genres', adminGenresRouter)
adminRouter.use('/analytics', adminAnalyticsRouter)
adminRouter.use('/notifications', adminNotificationsRouter)
