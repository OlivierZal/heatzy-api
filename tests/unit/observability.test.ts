import { REDACTED } from '@olivierzal/api-core'
import { describe, expect, it } from 'vitest'

import { redaction } from '../../src/observability/context.ts'
import { buildBinding, PRODUCT_KEYS } from '../fixtures.ts'

// Thin VOCABULARY suite: the redaction and log-shell MECHANISMS (and
// their mutation-checked suites) live in @olivierzal/api-core, and the
// call loggers live there too since the SessionAPI adoption — the
// core's inherited dispatch serializes through the engine `HeatzyAPI`
// hands it (pinned through the real client in `heatzy-api.test.ts`).
// What this file pins is the Gizwits layer's own obligation: the two
// vocabulary tiers of the one bound engine — the credential keys and
// the personal-data keys.

describe.concurrent('the Gizwits vocabulary', () => {
  it('marks the user-token header sensitive in any casing', () => {
    expect(redaction.isSensitive('x-gizwits-user-token')).toBe(true)
    expect(redaction.isSensitive('X-Gizwits-User-Token')).toBe(true)
  })

  // Every `/bindings` entry carries the device's binding passcode, and
  // the core logs each `/bindings` response body.
  it('marks the device passcode sensitive', () => {
    expect(redaction.isSensitive('passcode')).toBe(true)
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

describe.concurrent('the Gizwits personal-data tier', () => {
  // The core's dispatch prints every `/bindings` body whole, so the
  // name a user typed for each radiator stays out of a pasted report
  // only because this SDK declares its key — matched in any casing,
  // like a credential.
  it('marks the device alias personal data in any casing', () => {
    expect(redaction.isSensitive('dev_alias')).toBe(true)
    expect(redaction.isSensitive('DEV_ALIAS')).toBe(true)
  })

  // Both tiers through the ONE engine, on the body the core logs on
  // every cycle: the binding secret and the owner's name are blanked
  // alike, and the identifiers and vendor label a report needs to tell
  // the devices apart stay.
  it('blanks the alias of a /bindings dump and keeps the ids and the vendor label', () => {
    expect(
      redaction.redactValue({
        devices: [
          {
            ...buildBinding('pro', { dev_alias: 'Salon' }),
            passcode: 'bind-secret',
          },
        ],
      }),
    ).toStrictEqual({
      devices: [
        {
          dev_alias: REDACTED,
          did: 'did-pro',
          passcode: REDACTED,
          product_key: PRODUCT_KEYS.pro,
          product_name: 'pro',
        },
      ],
    })
  })

  it.each(['did', 'product_key', 'product_name'])(
    'leaves the identifier or vendor label %s in the dump',
    (key) => {
      expect(redaction.isSensitive(key)).toBe(false)
    },
  )
})
