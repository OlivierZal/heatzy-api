import { describe, expect, it } from 'vitest'

import {
  APIError,
  AttributeNotFoundError,
  isAPIError,
} from '../../src/errors/index.ts'

// Thin VOCABULARY suite: the error MECHANISMS — the `APIError` base,
// `isAPIError`'s guard and narrowing, `AuthenticationError`'s name and
// cause and, since api-core 1.3.0, `ValidationError`'s context and
// cause — live in @olivierzal/api-core with their own suites; this
// repo's `AuthenticationError` and `ValidationError` are the core's
// classes re-bound (exercised through the real client in
// `heatzy-api-auth.test.ts`, through `parseOrThrow` in
// `validation.test.ts`, and in the session-lifecycle kernel). What this
// file pins is the Gizwits layer's own obligation: the one protocol
// error it still declares, and that it sits inside the one family-wide
// `APIError` hierarchy.

describe.concurrent('the Gizwits protocol errors', () => {
  it('attributeNotFoundError derives its message from the attribute', () => {
    const error = new AttributeNotFoundError('derog_mode')

    expect(error).toBeInstanceOf(AttributeNotFoundError)
    expect(error).toBeInstanceOf(APIError)
    expect(error.attribute).toBe('derog_mode')
    expect(error.message).toBe('derog_mode not found')
    expect(error.name).toBe('AttributeNotFoundError')
  })

  it('attributeNotFoundError preserves the cause alongside its attribute', () => {
    const cause = new Error('wire dropped the field')
    const error = new AttributeNotFoundError('cur_mode', { cause })

    expect(error.attribute).toBe('cur_mode')
    expect(error.cause).toBe(cause)
  })

  it('attributeNotFoundError is recognised by the family guard', () => {
    const error: unknown = new AttributeNotFoundError('mode')

    expect(isAPIError(error)).toBe(true)
  })
})
