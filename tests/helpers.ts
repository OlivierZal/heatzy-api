import { vi } from 'vitest'

import type { HeatzyAPIAdapter, SyncCallback } from '../src/api/index.ts'
import { v1Attributes } from './fixtures.ts'

// What is OURS: the one helper below stages this dialect's own shape —
// the facade-facing adapter. Everything the SDK suites used to copy
// from each other (`cast`, `defined`, `mock`, `createLogger`,
// `createSettingStore`, `createMockHttpClient`, `mockFetchResponse`,
// `mockHttpResponse` — the transport envelope this file kept as its own
// until api-core 1.13.0 named it the mechanism's — the `HttpError`
// factories, the `Temporal` clock spies) is `@olivierzal/api-core/testing`'s
// and is imported from that subpath directly, never re-exported through
// this module.

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
