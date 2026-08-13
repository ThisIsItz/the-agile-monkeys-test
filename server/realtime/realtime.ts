import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'

let io: Server | undefined

export function initRealtime(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: '*' }
  })
  return io
}

export function emitSchemasChanged(schemaId: string): void {
  io?.emit('schemas:changed', { schemaId })
}

export function emitEntriesChanged(schemaId: string, entryId: string): void {
  io?.emit('entries:changed', { schemaId, entryId })
}
