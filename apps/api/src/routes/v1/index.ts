import { Router } from 'express'
import { contentRouter } from '../content'
import { rowsRouter } from '../rows'
import { searchRouter } from '../search'
import { profilesRouter } from '../profiles'
import { myListRouter } from '../myList'
import { watchHistoryRouter } from '../watchHistory'
import { notificationsRouter } from '../notifications'
import { reviewsRouter } from '../reviews'
import { playbackRouter } from './playback'
import { billingRouter } from './billing'
import { assetsRouter } from './assets'
import { liveRouter } from './live'
import { complianceRouter } from './compliance'
import { recommendationsRouter } from './recommendations'
import { authRouter } from '../auth'

export const v1Router = Router()

v1Router.use('/auth', authRouter)
v1Router.use('/content', contentRouter)
v1Router.use('/rows', rowsRouter)
v1Router.use('/search', searchRouter)
v1Router.use('/profiles', profilesRouter)
v1Router.use('/profiles', myListRouter)
v1Router.use('/profiles', watchHistoryRouter)
v1Router.use('/notifications', notificationsRouter)
v1Router.use('/reviews', reviewsRouter)
v1Router.use('/playback', playbackRouter)
v1Router.use('/billing', billingRouter)
v1Router.use('/assets', assetsRouter)
v1Router.use('/live', liveRouter)
v1Router.use('/compliance', complianceRouter)
v1Router.use('/recommendations', recommendationsRouter)

v1Router.get('/openapi.json', (_req, res) => {
  res.json({
    openapi: '3.1.0',
    info: { title: 'Netflix Clone API', version: '1.0.0' },
    paths: {
      '/api/v1/content': { get: { summary: 'List content' } },
      '/api/v1/playback/{contentId}': { post: { summary: 'Issue playback token' } },
      '/api/v1/billing/checkout': { post: { summary: 'Stripe checkout' } },
      '/api/v1/live/channels': { get: { summary: 'List live channels' } },
    },
  })
})
