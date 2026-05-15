import { Router } from 'express'
import { contentRouter } from './content'
import { rowsRouter } from './rows'
import { searchRouter } from './search'
import { profilesRouter } from './profiles'
import { myListRouter } from './myList'
import { watchHistoryRouter } from './watchHistory'
import { authRouter } from './auth'

export const router = Router()

router.use('/auth', authRouter)
router.use('/content', contentRouter)
router.use('/rows', rowsRouter)
router.use('/search', searchRouter)
router.use('/profiles', profilesRouter)
router.use('/profiles', myListRouter)
router.use('/profiles', watchHistoryRouter)
