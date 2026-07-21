import { describe, expectTypeOf, it } from 'vitest'

import type { Resolved, UndefinedTolerant } from '../../src/types/index.ts'

interface Settings {
  interval: number | null
  label: string
}

describe('resolved', () => {
  it('makes every property required and strips explicit undefined', () => {
    expectTypeOf<
      Resolved<{ interval?: number | undefined; label?: string | undefined }>
    >().toEqualTypeOf<{ interval: number; label: string }>()
  })

  it('preserves null — a sentinel here, not an absence marker', () => {
    expectTypeOf<
      Resolved<{ interval?: number | null | undefined }>
    >().toEqualTypeOf<{ interval: number | null }>()
  })
})

describe('undefinedTolerant', () => {
  it('widens every property into an optional, undefined-admitting one', () => {
    expectTypeOf<UndefinedTolerant<Settings>>().toEqualTypeOf<{
      interval?: number | null | undefined
      label?: string | undefined
    }>()
  })

  it('round-trips through Resolved back to the source shape', () => {
    expectTypeOf<
      Resolved<UndefinedTolerant<Settings>>
    >().toEqualTypeOf<Settings>()
  })
})
