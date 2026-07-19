import { Router } from 'express'
import { authenticate, AuthRequest } from '../../middleware/authenticate'
import { assertProfileOwned } from '../../lib/profileAccess'
import { getRecommendations } from '../../modules/recommendations/service'

export const recommendationsRouter = Router()

recommendationsRouter.get('/:profileId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await assertProfileOwned(req.params['profileId']!, req.userId!)
    const items = await getRecommendations(req.params['profileId']!)
    res.json({ data: items })
  } catch (err) {
    next(err)
  }
})
