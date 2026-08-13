import http from 'node:http'
import { createApp } from './app.js'
import { initRealtime } from './realtime/realtime.js'

const port = Number(process.env.PORT ?? 3001)

const httpServer = http.createServer(createApp())
initRealtime(httpServer)

httpServer.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
