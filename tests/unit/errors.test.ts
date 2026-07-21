import { describe, expect, it } from 'vitest'

import {
  APIError,
  AttributeNotFoundError,
  AuthenticationError,
  isAPIError,
  ValidationError,
} from '../../src/errors/index.ts'

describe.concurrent('apiError hierarchy', () => {
  it('authenticationError is an instance of APIError and Error', () => {
    const error = new AuthenticationError('bad creds')

    expect(error).toBeInstanceOf(AuthenticationError)
    expect(error).toBeInstanceOf(APIError)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('bad creds')
    expect(error.name).toBe('AuthenticationError')
  })

  it('preserves the original rejection as `cause`', () => {
    const cause = new Error('upstream')
    const error = new AuthenticationError('wrapped', { cause })

    expect(error.cause).toBe(cause)
  })

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
    const error = new ValidationError('bad shape', {
      cause,
      context: 'login',
    })

    expect(error).toBeInstanceOf(ValidationError)
    expect(error).toBeInstanceOf(APIError)
    expect(error.name).toBe('ValidationError')
    expect(error.context).toBe('login')
    expect(error.cause).toBe(cause)
  })
})

describe.concurrent(isAPIError, () => {
  it.each([
    ['AuthenticationError', new AuthenticationError('x')],
    ['AttributeNotFoundError', new AttributeNotFoundError('mode')],
    ['ValidationError', new ValidationError('x', { context: 'login' })],
  ])('returns true for %s', (_name, error: unknown) => {
    expect(isAPIError(error)).toBe(true)
  })

  it.each([
    ['plain Error', new Error('boom')],
    ['TypeError', new TypeError('bad')],
    ['string', 'boom'],
    ['null', null],
    ['undefined', undefined],
    ['plain object', { message: 'boom' }],
  ])('returns false for %s', (_name, value) => {
    expect(isAPIError(value)).toBe(false)
  })

  it('narrows the type so the subclass surface is accessible', () => {
    const value: unknown = new AttributeNotFoundError('mode')
    // Compile-time proof: `isAPIError` narrows `unknown` → `APIError`.
    const narrowed = isAPIError(value) ? value : null

    expect(narrowed?.name).toBe('AttributeNotFoundError')
  })
})
