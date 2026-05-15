import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { router } from './routes'
import { errorHandler } from './middleware/errorHandler'

const app = express()
const PORT = process.env['PORT'] ?? 4000

app.use(helmet())
app.use(
  cors({
    origin: [
      process.env['NEXTAUTH_URL'] ?? 'http://localhost:3000',
      'http://localhost:3001',
      // Allow React Native metro bundler origins
      'http://localhost:8081',
      'http://localhost:19006',
    ],
    credentials: true,
  })
)
app.use(morgan('dev'))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api', router)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
