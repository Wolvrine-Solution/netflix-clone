import { Router } from 'express'
import { contentRouter } from './content'
import { rowsRouter } from './rows'
import { searchRouter } from './search'
import { profilesRouter } from './profiles'
import { myListRouter } from './myList'
import { watchHistoryRouter } from './watchHistory'
import { authRouter } from './auth'
import { adminRouter } from './admin/index'
import { notificationsRouter } from './notifications'
import { reviewsRouter } from './reviews'

export const router = Router()

// Auth
router.use('/auth', authRouter)

// User-facing
router.use('/content', contentRouter)
router.use('/rows', rowsRouter)
router.use('/search', searchRouter)
router.use('/profiles', profilesRouter)
router.use('/profiles', myListRouter)
router.use('/profiles', watchHistoryRouter)
router.use('/notifications', notificationsRouter)
router.use('/reviews', reviewsRouter)

// Admin (all protected by authenticate + adminOnly middleware inside)
router.use('/admin', adminRouter)
