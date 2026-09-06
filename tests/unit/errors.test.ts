import { describe, expect, it } from 'vitest'

import {
  APIError,
  AttributeNotFoundError,
  isAPIError,
  ValidationError,
} from '../../src/errors/index.ts'

// Thin VOCABULARY suite: the error MECHANISMS — the `APIError` base,
// `isAPIError`'s guard and narrowing, `AuthenticationError`'s name and
// cause — live in @olivierzal/api-core with their own suites, and this
// repo's `AuthenticationError` is the core's class re-bound (exercised
// through the real client in `heatzy-api-auth.test.ts` and the
// session-lifecycle kernel). What this file pins is the Gizwits
// layer's own obligation: the two protocol errors it declares, and
// that they sit inside the one family-wide `APIError` hierarchy.

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

  it('validationError carries context and cause', () => {
    const cause = new Error('zod issue')
    const error = new ValidationError('bad shape', { cause, context: 'login' })

    expect(error).toBeInstanceOf(ValidationError)
    expect(error).toBeInstanceOf(APIError)
    expect(error.name).toBe('ValidationError')
    expect(error.context).toBe('login')
    expect(error.cause).toBe(cause)
  })

  it.each([
    ['AttributeNotFoundError', new AttributeNotFoundError('mode')],
    ['ValidationError', new ValidationError('x', { context: 'login' })],
  ])('%s is recognised by the family guard', (_name, error: unknown) => {
    expect(isAPIError(error)).toBe(true)
  })
})
