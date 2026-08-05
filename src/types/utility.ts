/**
 * Optional form of `T` whose properties may also be explicitly
 * `undefined` — the input-side counterpart of `Partial<T>` under
 * `exactOptionalPropertyTypes` (whose mapped `?` does not admit a
 * present-`undefined` key). For inputs whose runtime treats a
 * present-`undefined` key exactly like an absent one.
 * @template T - Exact shape being widened into a tolerant input.
 * @category Types
 */
export type UndefinedTolerant<T> = { [K in keyof T]?: T[K] | undefined }
