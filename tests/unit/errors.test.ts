import {
  failureCauseChain as coreFailureCauseChain,
  isKnownFailure as coreIsKnownFailure,
  logFailure as coreLogFailure,
} from '@olivierzal/api-core'
import { describe, expect, it } from 'vitest'

import {
  APIError,
  AttributeNotFoundError,
  isAPIError,
} from '../../src/errors/index.ts'
import {
  failureCauseChain,
  isKnownFailure,
  logFailure,
} from '../../src/index.ts'

// Thin VOCABULARY suite: the error MECHANISMS — the `APIError` base,
// `isAPIError`'s guard and narrowing, `AuthenticationError`'s name and
// cause and, since api-core 1.3.0, `ValidationError`'s context and
// cause — live in @olivierzal/api-core with their own suites; this
// repo's `AuthenticationError` and `ValidationError` are the core's
// classes re-bound (exercised through the real client in
// `heatzy-api-auth.test.ts`, through `parseOrThrow` in
// `validation.test.ts`, and in the session-lifecycle kernel). What this
// file pins is the Gizwits layer's own obligation: the one protocol
// error it still declares, that it sits inside the one family-wide
// `APIError` hierarchy, and that the failure-log helpers the package
// root hands a host are the core's own, so a host's line and the SDK's
// seats judge one failure the same way, through the SDK's pin alone.

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

describe.concurrent('the failure-log forwards', () => {
  // Typed `unknown`: the rows are compared by identity, and left to
  // inference the table would narrow every helper to the void shape.
  it.each<[string, unknown, unknown]>([
    ['failureCauseChain', failureCauseChain, coreFailureCauseChain],
    ['isKnownFailure', isKnownFailure, coreIsKnownFailure],
    ['logFailure', logFailure, coreLogFailure],
  ])(
    '%s reaches the package root as the core helper itself',
    (_name, local, core) => {
      expect(local).toBe(core)
    },
  )
})
