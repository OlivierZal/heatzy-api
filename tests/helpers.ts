import { vi } from 'vitest'

import type { HeatzyAPIAdapter, SyncCallback } from '../src/api/index.ts'
import { v1Attributes } from './fixtures.ts'

// What is OURS: the two helpers below stage this dialect's own shapes —
// the facade-facing adapter and the core `HttpResponse` envelope the
// transport spy answers with. Everything the SDK suites used to copy
// from each other (`cast`, `defined`, `mock`, `createLogger`,
// `createSettingStore`, `createMockHttpClient`, `mockFetchResponse`,
// the `HttpError` factories, the `Temporal` clock spies) is
// `@olivierzal/api-core/testing`'s since api-core 1.3.0 and is imported
// from that subpath directly, never re-exported through this module.

const HTTP_OK = 200

/**
 * Build a fully-mocked {@link HeatzyAPIAdapter} with benign defaults.
 * @param overrides - Adapter members to replace.
 * @returns The mocked adapter.
 */
export const createMockAdapter = (
  overrides: Partial<HeatzyAPIAdapter> = {},
): HeatzyAPIAdapter => ({
  getDeviceById: vi
    .fn<HeatzyAPIAdapter['getDeviceById']>()
    .mockReturnValue(undefined),
  getValues: vi
    .fn<HeatzyAPIAdapter['getValues']>()
    .mockResolvedValue(v1Attributes),
  locale: undefined,
  notifySync: vi.fn<SyncCallback>().mockResolvedValue(undefined),
  updateValues: vi
    .fn<HeatzyAPIAdapter['updateValues']>()
    .mockResolvedValue(undefined),
  ...overrides,
})

export const mockResponse = (
  data: unknown,
  headers: Record<string, string | string[]> = {},
  status: number = HTTP_OK,
): {
  data: unknown
  headers: Record<string, string | string[]>
  status: number
} => ({ data, headers, status })
