import { REDACTED } from '@olivierzal/api-core'
import { describe, expect, it } from 'vitest'

import { redaction } from '../../src/observability/context.ts'

// Thin VOCABULARY suite: the redaction and log-shell MECHANISMS (and
// their mutation-checked suites) live in @olivierzal/api-core, and the
// call loggers live there too since the SessionAPI adoption — the
// core's inherited dispatch serializes through the engine `HeatzyAPI`
// hands it (pinned through the real client in `heatzy-api.test.ts`).
// What this file pins is the Gizwits layer's own obligation: the
// sensitive-key vocabulary of the one bound engine.

describe.concurrent('the Gizwits vocabulary', () => {
  it('marks the user-token header sensitive in any casing', () => {
    expect(redaction.isSensitive('x-gizwits-user-token')).toBe(true)
    expect(redaction.isSensitive('X-Gizwits-User-Token')).toBe(true)
  })

  it.each(['authorization', 'cookie', 'password', 'token', 'username'])(
    'keeps the core base key %s sensitive',
    (key) => {
      expect(redaction.isSensitive(key)).toBe(true)
    },
  )

  it('leaves non-credential keys alone', () => {
    expect(redaction.isSensitive('x-gizwits-application-id')).toBe(false)
    expect(redaction.isSensitive('x-trace')).toBe(false)
  })

  it('deep-redacts the issued token through the bound engine', () => {
    expect(
      redaction.redactValue({ login: { expire_at: 1, token: 'tok' } }),
    ).toStrictEqual({ login: { expire_at: 1, token: REDACTED } })
  })
})
