import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { HttpError } from './http-error.js'

// Express identifies error-handling middleware by its four-argument signature.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details })
    return
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Invalid request body', details: err.issues })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}
