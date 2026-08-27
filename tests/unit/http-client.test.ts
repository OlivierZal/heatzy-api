import { HttpClient as CoreHttpClient } from '@olivierzal/api-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  HttpClient,
  HttpError,
  HttpStatus,
  isHttpError,
} from '../../src/http/index.ts'
import { cast, mockFetchResponse } from '../helpers.ts'

// Thin WIRING suite: the transport MECHANISM (URL building, body
// serialization, signals, parsing — and its full suite) lives in
// @olivierzal/api-core. What this file pins is the Gizwits layer's
// own obligation: the subclass seats this SDK's vocabulary on every
// construction path, so no client — including one a host prebuilds —
// can throw an unredacted snapshot.

const mockFetch = vi.fn<typeof fetch>()
vi.stubGlobal('fetch', mockFetch)

const extractHeaders = (): Record<string, string> => {
  const init = mockFetch.mock.calls[0]?.[1]
  if (init === undefined) {
    throw new TypeError('mockFetch was not called')
  }
  return cast(init.headers)
}

describe(HttpClient, () => {
  const BASE_URL = 'https://api.test.local'

  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('is the core transport (instanceof holds across the family)', () => {
    const client = new HttpClient({ baseURL: BASE_URL, timeout: 0 })

    expect(client).toBeInstanceOf(HttpClient)
    expect(client).toBeInstanceOf(CoreHttpClient)
    expect(client.baseURL).toBe(BASE_URL)
  })

  // The whole-snapshot clause, now proving the SUBCLASS: the error a
  // real request throws must not carry the credentials that request
  // just sent — the Gizwits user token (this SDK's vocabulary) and the
  // bearer token (the core base) alike, with NOTHING passed at the
  // construction site.
  it('redacts the credentials of the request that failed', async () => {
    mockFetch.mockResolvedValueOnce(
      mockFetchResponse({ error_message: 'token expired' }, {}, 400),
    )
    const client = new HttpClient({
      baseURL: BASE_URL,
      headers: { 'X-Gizwits-User-Token': 'tok' },
      timeout: 0,
    })

    const promise = client.request({
      headers: { Authorization: 'Bearer secret', 'X-Trace': 'keep-me' },
      url: '/guarded',
    })

    await expect(promise).rejects.toMatchObject({
      config: {
        headers: {
          Authorization: '******',
          'X-Gizwits-User-Token': '******',
          'X-Trace': 'keep-me',
        },
      },
    })
    // Redaction is a reporting concern, not a transport one: the wire
    // still carried the real credential.
    expect(extractHeaders().Authorization).toBe('Bearer secret')
  })

  it('throws the shared HttpError class', async () => {
    mockFetch.mockResolvedValueOnce(mockFetchResponse({}, {}, 500))
    const client = new HttpClient({ baseURL: BASE_URL, timeout: 0 })

    const promise = client.request({ url: '/boom' })

    await expect(promise).rejects.toThrow(HttpError)
    await expect(promise).rejects.toSatisfy((error) => isHttpError(error))
  })
})

describe('httpError re-export', () => {
  it('redacts the login body a rejected sign-in echoes', () => {
    const error = new HttpError('boom', {
      config: {
        data: { lang: 'en', password: 'hunter2', username: 'user@example.com' },
        method: 'POST',
        url: '/login',
      },
      response: { data: null, headers: {}, status: 400 },
    })

    expect(error.config?.data).toStrictEqual({
      lang: 'en',
      password: '******',
      username: '******',
    })
  })
})

describe('httpStatus re-export', () => {
  it('carries the union table this SDK branches on', () => {
    expect(HttpStatus.BadRequest).toBe(400)
    expect(HttpStatus.Unauthorized).toBe(401)
    // Additive arrivals from the union with melcloud-api's vocabulary.
    expect(HttpStatus.NotFound).toBe(404)
    expect(HttpStatus.TooManyRequests).toBe(429)
  })
})
