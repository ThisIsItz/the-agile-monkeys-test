import { describe, expect, it } from 'vitest'
import { emitEntriesChanged, emitSchemasChanged } from './realtime.js'

describe('realtime', () => {
  it('does not throw when emitting before initRealtime has been called', () => {
    expect(() => emitSchemasChanged('schema-1')).not.toThrow()
    expect(() => emitEntriesChanged('schema-1', 'entry-1')).not.toThrow()
  })
})
