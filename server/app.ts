import cors from 'cors'
import express from 'express'
import { errorHandler } from './error-handler.js'
import { schemasRouter } from './schemas.routes.js'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.use('/api/schemas', schemasRouter)

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  app.use(errorHandler)

  return app
}
