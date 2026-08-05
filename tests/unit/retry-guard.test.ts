import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RetryGuard } from '../../src/resilience/retry-guard.ts'
import { Temporal } from '../../src/temporal.ts'
import { mockTemporalNowInstant } from '../helpers.ts'

describe('retry guard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockTemporalNowInstant()
  })

  afterEach(() => {
    vi.mocked(Temporal.Now.instant).mockRestore()
    vi.useRealTimers()
  })

  it('allows the first consume', () => {
    const guard = new RetryGuard(1000)

    expect(guard.tryConsume()).toBe(true)
  })

  it('rejects consecutive consumes within the window', () => {
    const guard = new RetryGuard(1000)

    guard.tryConsume()

    expect(guard.tryConsume()).toBe(false)
    expect(guard.tryConsume()).toBe(false)
  })

  it('refills the budget after the delay elapses', () => {
    const guard = new RetryGuard(1000)

    guard.tryConsume()
    vi.advanceTimersByTime(1000)

    expect(guard.tryConsume()).toBe(true)
  })

  it('keeps refusing until the delay elapses', () => {
    const guard = new RetryGuard(1000)

    guard.tryConsume()
    vi.advanceTimersByTime(999)

    expect(guard.tryConsume()).toBe(false)
  })
})
