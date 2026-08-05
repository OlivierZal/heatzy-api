import { describe, expectTypeOf, it } from 'vitest'

import type { UndefinedTolerant } from '../../src/types/index.ts'

interface Settings {
  interval: number | null
  label: string
}

describe('undefinedTolerant', () => {
  it('widens every property into an optional, undefined-admitting one', () => {
    expectTypeOf<UndefinedTolerant<Settings>>().toEqualTypeOf<{
      interval?: number | null | undefined
      label?: string | undefined
    }>()
  })
})
