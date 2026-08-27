import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { HttpError } from '../../src/http/index.ts'
import {
  isSensitive,
  REDACTED,
  redactValue,
} from '../../src/observability/context.ts'
import {
  APICallRequestData,
  APICallResponseData,
  createAPICallErrorData,
} from '../../src/observability/index.ts'
import { defined } from '../helpers.ts'

// Thin VOCABULARY suite: the redaction and log-shell MECHANISMS (and
// their mutation-checked suites) live in @olivierzal/api-core. What
// this file pins is the Gizwits layer's own obligation — its
// sensitive-key vocabulary, and the fact that every shell this SDK
// exports arrives pre-bound to it, with no call site passing anything.

const jsonRecord = z.record(z.string(), z.unknown())

const logShape = z.object({
  headers: jsonRecord.optional(),
  requestData: jsonRecord.optional(),
})

const parseLog = (value: string): z.infer<typeof logShape> => {
  const raw: unknown = JSON.parse(value)
  return logShape.parse(raw)
}

describe.concurrent('the Gizwits vocabulary', () => {
  it('marks the user-token header sensitive in any casing', () => {
    expect(isSensitive('x-gizwits-user-token')).toBe(true)
    expect(isSensitive('X-Gizwits-User-Token')).toBe(true)
  })

  it.each(['authorization', 'cookie', 'password', 'token', 'username'])(
    'keeps the core base key %s sensitive',
    (key) => {
      expect(isSensitive(key)).toBe(true)
    },
  )

  it('leaves non-credential keys alone', () => {
    expect(isSensitive('x-gizwits-application-id')).toBe(false)
    expect(isSensitive('x-trace')).toBe(false)
  })

  it('deep-redacts the issued token through the bound engine', () => {
    expect(
      redactValue({ login: { expire_at: 1, token: 'tok' } }),
    ).toStrictEqual({ login: { expire_at: 1, token: REDACTED } })
  })
})

describe.concurrent('the shells arrive pre-bound', () => {
  it('aPICallRequestData redacts the token header with no engine passed', () => {
    const call = new APICallRequestData({
      headers: {
        'X-Gizwits-Application-Id': 'app-id-kept',
        'X-Gizwits-User-Token': 'tok',
      },
      method: 'post',
      url: '/x',
    })
    const headers = defined(parseLog(call.toString()).headers)

    expect(headers['X-Gizwits-User-Token']).toBe(REDACTED)
    expect(headers['X-Gizwits-Application-Id']).toBe('app-id-kept')
  })

  it('aPICallResponseData redacts the issued token the login echoes', () => {
    const call = new APICallResponseData({
      data: { expire_at: 1_735_689_600, token: 'tok', uid: 'kept' },
      headers: {},
      status: 200,
    })
    const raw: unknown = JSON.parse(call.toString())
    const { responseData } = z.object({ responseData: jsonRecord }).parse(raw)

    expect(responseData).toStrictEqual({
      expire_at: 1_735_689_600,
      token: REDACTED,
      uid: 'kept',
    })
  })

  it('createAPICallErrorData redacts through the same vocabulary', () => {
    // The error below is built WITHOUT the Gizwits engine (only the
    // core base applies at construction), so the token header survives
    // into the snapshot — the serialization pass through this SDK's
    // bound factory must still blank it. Both locks carry the same
    // vocabulary; this clause pins the second one.
    const error = new HttpError('boom', {
      config: { url: '/x' },
      response: {
        data: null,
        headers: { 'x-gizwits-user-token': 'tok', 'x-trace': 'keep' },
        status: 400,
      },
    })
    const data = createAPICallErrorData(error)
    const headers = defined(parseLog(data.toString()).headers)

    expect(data.errorMessage).toBe('boom')
    expect(data.dataType).toBe('API response')
    expect(headers['x-gizwits-user-token']).toBe(REDACTED)
    expect(headers['x-trace']).toBe('keep')
  })

  it('createAPICallErrorData falls back to request data on a plain Error', () => {
    const data = createAPICallErrorData(new Error('Network Error'))

    expect(data.errorMessage).toBe('Network Error')
    expect(data.dataType).toBe('API request')
  })
})
