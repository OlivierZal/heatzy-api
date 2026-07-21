import { describe, expect, it, vi } from 'vitest'

import {
  type ResiliencePolicy,
  AuthRetryPolicy,
  CompositePolicy,
  RetryGuard,
  TransientRetryPolicy,
} from '../../src/resilience/index.ts'
import { createServerError } from '../helpers.ts'

describe(CompositePolicy, () => {
  it('empty composite runs the attempt verbatim', async () => {
    const composite = new CompositePolicy([])
    const attempt = vi.fn<() => Promise<string>>().mockResolvedValue('ok')

    await expect(composite.run(attempt)).resolves.toBe('ok')
    expect(attempt).toHaveBeenCalledTimes(1)
  })

  it('wraps outer-to-inner — first array element sees the call first', async () => {
    const callOrder: string[] = []
    const makePolicy = (label: string): ResiliencePolicy => ({
      run: async <T>(inner: () => Promise<T>): Promise<T> => {
        callOrder.push(`${label}:before`)
        const result = await inner()
        callOrder.push(`${label}:after`)
        return result
      },
    })
    const composite = new CompositePolicy([
      makePolicy('outer'),
      makePolicy('mid'),
      makePolicy('inner'),
    ])

    await composite.run(async () => {
      callOrder.push('attempt')
      await Promise.resolve()
    })

    expect(callOrder).toStrictEqual([
      'outer:before',
      'mid:before',
      'inner:before',
      'attempt',
      'inner:after',
      'mid:after',
      'outer:after',
    ])
  })
})

describe(AuthRetryPolicy, () => {
  // Gizwits reports an invalid or expired token as HTTP 400 (error
  // code 9004 in the body), never 401 — the policy owns both statuses.
  it.each([400, 401])(
    'replays the attempt after a %i when reauthenticate returns true',
    async (status) => {
      using guard = new RetryGuard(1000)
      const reauthenticate = vi
        .fn<() => Promise<boolean>>()
        .mockResolvedValue(true)
      const policy = new AuthRetryPolicy(guard, reauthenticate)
      const attempt = vi
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(createServerError(status, '/x'))
        .mockResolvedValueOnce('retried')

      await expect(policy.run(attempt)).resolves.toBe('retried')
      expect(attempt).toHaveBeenCalledTimes(2)
      expect(reauthenticate).toHaveBeenCalledTimes(1)
    },
  )

  it.each([400, 401])(
    'rethrows the %i when the guard refuses a retry',
    async (status) => {
      using guard = new RetryGuard(1000)

      // consume the single token
      guard.tryConsume()
      const reauthenticate = vi.fn<() => Promise<boolean>>()
      const policy = new AuthRetryPolicy(guard, reauthenticate)

      await expect(
        policy.run(async () => {
          await Promise.resolve()
          throw createServerError(status, '/x')
        }),
      ).rejects.toThrow(`Status ${String(status)}`)
      expect(reauthenticate).not.toHaveBeenCalled()
    },
  )

  it.each([400, 401])(
    'rethrows the %i when reauthenticate fails',
    async (status) => {
      using guard = new RetryGuard(1000)
      const reauthenticate = vi
        .fn<() => Promise<boolean>>()
        .mockResolvedValue(false)
      const policy = new AuthRetryPolicy(guard, reauthenticate)

      await expect(
        policy.run(async () => {
          await Promise.resolve()
          throw createServerError(status, '/x')
        }),
      ).rejects.toThrow(`Status ${String(status)}`)
      expect(reauthenticate).toHaveBeenCalledTimes(1)
    },
  )

  it('passes another status (500) through without triggering reauth', async () => {
    using guard = new RetryGuard(1000)
    const reauthenticate = vi.fn<() => Promise<boolean>>()
    const policy = new AuthRetryPolicy(guard, reauthenticate)

    await expect(
      policy.run(async () => {
        await Promise.resolve()
        throw createServerError(500, '/x')
      }),
    ).rejects.toThrow('Status 500')
    expect(reauthenticate).not.toHaveBeenCalled()
  })
})

describe(TransientRetryPolicy, () => {
  it('retries on a transient 503 and succeeds', async () => {
    vi.useFakeTimers()
    const onRetry =
      vi.fn<(retryAttempt: number, error: unknown, delayMs: number) => void>()
    const policy = new TransientRetryPolicy({ onRetry })
    const attempt = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(createServerError(503, '/x'))
      .mockResolvedValueOnce('ok')

    const promise = policy.run(attempt)
    await vi.advanceTimersByTimeAsync(2000)

    await expect(promise).resolves.toBe('ok')
    expect(onRetry).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('does not retry on non-transient 500', async () => {
    const onRetry =
      vi.fn<(retryAttempt: number, error: unknown, delayMs: number) => void>()
    const policy = new TransientRetryPolicy({ onRetry })
    const attempt = vi
      .fn<() => Promise<string>>()
      .mockRejectedValue(createServerError(500, '/x'))

    await expect(policy.run(attempt)).rejects.toThrow('Status 500')
    expect(attempt).toHaveBeenCalledTimes(1)
    expect(onRetry).not.toHaveBeenCalled()
  })

  it('forwards an abort signal so a cancel during backoff bails out', async () => {
    const onRetry =
      vi.fn<(retryAttempt: number, error: unknown, delayMs: number) => void>()
    const controller = new AbortController()
    const policy = new TransientRetryPolicy({ onRetry }, controller.signal)
    const attempt = vi
      .fn<() => Promise<string>>()
      .mockRejectedValue(createServerError(503, '/x'))

    const promise = policy.run(attempt)
    // Wait for the first failure to land in the backoff sleep.
    await Promise.resolve()
    controller.abort(new Error('cancelled'))

    await expect(promise).rejects.toThrow('cancelled')
    expect(attempt).toHaveBeenCalledTimes(1)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
