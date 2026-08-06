import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DisposableTimeout } from '../../src/resilience/disposable-timeout.ts'

describe('disposable timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('executes callback after delay', () => {
    using timeout = new DisposableTimeout()
    const callback = vi.fn<() => void>()
    timeout.schedule(callback, 1000)
    vi.advanceTimersByTime(1000)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('does not execute callback after clear', () => {
    using timeout = new DisposableTimeout()
    const callback = vi.fn<() => void>()
    timeout.schedule(callback, 1000)
    timeout.clear()
    vi.advanceTimersByTime(1000)

    expect(callback).not.toHaveBeenCalled()
  })

  it('clears previous timeout on re-schedule', () => {
    using timeout = new DisposableTimeout()
    const callback1 = vi.fn<() => void>()
    const callback2 = vi.fn<() => void>()
    timeout.schedule(callback1, 1000)
    timeout.schedule(callback2, 1000)
    vi.advanceTimersByTime(1000)

    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).toHaveBeenCalledTimes(1)
  })

  it('clear is idempotent when nothing is scheduled', () => {
    using timeout = new DisposableTimeout()

    expect(() => {
      timeout.clear()
    }).not.toThrow()
  })

  it('symbol.dispose clears the timeout', () => {
    const timeout = new DisposableTimeout()
    const callback = vi.fn<() => void>()
    timeout.schedule(callback, 1000)
    timeout[Symbol.dispose]()
    vi.advanceTimersByTime(1000)

    expect(callback).not.toHaveBeenCalled()
  })

  it('unrefs the underlying timer so it does not keep the event loop alive', () => {
    const unrefCalls: number[] = []
    const realSetTimeout = globalThis.setTimeout
    vi.stubGlobal(
      'setTimeout',
      (callback: () => void, ms: number): ReturnType<typeof setTimeout> => {
        const handle = realSetTimeout(callback, ms)
        handle.unref = (): ReturnType<typeof setTimeout> => {
          unrefCalls.push(1)
          return handle
        }
        return handle
      },
    )
    using timeout = new DisposableTimeout()
    timeout.schedule(vi.fn<() => void>(), 1000)
    vi.unstubAllGlobals()

    expect(unrefCalls).toHaveLength(1)
  })
})
