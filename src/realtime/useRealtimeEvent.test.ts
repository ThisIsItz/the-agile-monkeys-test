import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRealtimeEvent } from './useRealtimeEvent'
import { socket } from './socket'

vi.mock('./socket', () => ({
  socket: { on: vi.fn(), off: vi.fn() }
}))

describe('useRealtimeEvent', () => {
  afterEach(() => {
    vi.mocked(socket.on).mockClear()
    vi.mocked(socket.off).mockClear()
  })

  it('subscribes on mount and invokes the handler with the emitted payload', () => {
    const handler = vi.fn()
    renderHook(() => useRealtimeEvent<{ value: string }>('test:event', handler))

    expect(socket.on).toHaveBeenCalledWith('test:event', expect.any(Function))
    const listener = vi.mocked(socket.on).mock.calls[0][1] as (
      payload: { value: string }
    ) => void

    listener({ value: 'hello' })

    expect(handler).toHaveBeenCalledWith({ value: 'hello' })
  })

  it('unsubscribes on unmount', () => {
    const handler = vi.fn()
    const { unmount } = renderHook(() =>
      useRealtimeEvent('test:event', handler)
    )
    const listener = vi.mocked(socket.on).mock.calls[0][1]

    unmount()

    expect(socket.off).toHaveBeenCalledWith('test:event', listener)
  })
})
