import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { ValidationError } from '../../src/errors/index.ts'
import {
  BindingsSchema,
  DeviceDataSchema,
  LoginDataSchema,
  parseOrThrow,
} from '../../src/validation/index.ts'
import {
  buildBinding,
  buildLoginData,
  glowAttributes,
  proAttributes,
  v1Attributes,
  v2Attributes,
} from '../fixtures.ts'

// Drops the key entirely — unlike spreading `{ key: undefined }`, which
// leaves a present-but-undefined property that JSON payloads never carry.
const omitKey = (payload: object, key: string): Record<string, unknown> =>
  Object.fromEntries(Object.entries(payload).filter(([name]) => name !== key))

const captureValidationError = (act: () => unknown): ValidationError => {
  try {
    act()
  } catch (error) {
    if (error instanceof ValidationError) {
      return error
    }
    throw error
  }
  throw new Error('Expected a ValidationError')
}

describe(parseOrThrow, () => {
  it('returns the parsed data on success', () => {
    expect(
      parseOrThrow(LoginDataSchema, buildLoginData(1_753_100_000), 'login'),
    ).toStrictEqual({ expire_at: 1_753_100_000, token: 'user-token' })
  })

  it('throws a ValidationError carrying the context and the ZodError cause', () => {
    const error = captureValidationError(() =>
      parseOrThrow(LoginDataSchema, { token: 'user-token' }, 'login'),
    )

    expect(error.context).toBe('login')
    expect(error.cause).toBeInstanceOf(z.ZodError)
    expect(error.message).toMatch(/invalid api response shape \(login\)/iv)
  })
})

describe('bindingsSchema', () => {
  it('accepts a bindings envelope and preserves loose extra keys', () => {
    const parsed = BindingsSchema.parse({
      devices: [{ ...buildBinding('pro'), extra_key: 'kept' }],
      total: 1,
    })

    expect(parsed).toMatchObject({ total: 1 })
    expect(parsed.devices[0]).toMatchObject({
      did: 'did-pro',
      extra_key: 'kept',
    })
  })

  it('rejects an empty did', () => {
    expect(() =>
      BindingsSchema.parse({ devices: [buildBinding('pro', { did: '' })] }),
    ).toThrow(/did/v)
  })

  it('rejects a missing dev_alias', () => {
    expect(() =>
      BindingsSchema.parse({ devices: [omitKey(buildBinding(), 'dev_alias')] }),
    ).toThrow(/dev_alias/v)
  })
})

describe('deviceDataSchema', () => {
  it.each([
    { attributes: v1Attributes, label: 'V1' },
    { attributes: v2Attributes, label: 'V2' },
    { attributes: glowAttributes, label: 'Glow' },
    { attributes: proAttributes, label: 'Pro' },
  ])('accepts the $label attribute payload', ({ attributes }) => {
    expect(DeviceDataSchema.parse({ attr: attributes })).toStrictEqual({
      attr: attributes,
    })
  })

  it('preserves loose extra keys on the attributes', () => {
    const parsed = DeviceDataSchema.parse({
      attr: { ...v1Attributes, undocumented: 7 },
    })

    expect(parsed.attr).toMatchObject({ undocumented: 7 })
  })

  it('rejects a missing mode', () => {
    expect(() => DeviceDataSchema.parse({ attr: {} })).toThrow(/mode/v)
  })

  it('rejects an out-of-vocabulary mode literal', () => {
    expect(() => DeviceDataSchema.parse({ attr: { mode: 'warm' } })).toThrow(
      /mode/v,
    )
  })

  it('rejects an out-of-vocabulary com_temp offset', () => {
    expect(() =>
      DeviceDataSchema.parse({ attr: { ...glowAttributes, com_temp: 42 } }),
    ).toThrow(/com_temp/v)
  })
})

describe('loginDataSchema', () => {
  it('accepts the login payload and preserves loose extra keys', () => {
    const parsed = LoginDataSchema.parse({
      ...buildLoginData(1_753_100_000),
      uid: 'user-id',
    })

    expect(parsed).toMatchObject({ token: 'user-token', uid: 'user-id' })
  })

  it('rejects a missing token', () => {
    expect(() =>
      LoginDataSchema.parse(omitKey(buildLoginData(), 'token')),
    ).toThrow(/token/v)
  })

  it('rejects an empty token', () => {
    expect(() => LoginDataSchema.parse({ expire_at: 1, token: '' })).toThrow(
      /token/v,
    )
  })
})
