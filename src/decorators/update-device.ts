import type { Attributes, UndefinedTolerant } from '../types/index.ts'

/**
 * Object whose in-memory model can absorb a partial attribute payload.
 * Facades implement this structurally by delegating to their registry
 * entity's `update`.
 */
interface HasUpdate {
  readonly update: (data: UndefinedTolerant<Attributes>) => void
}

/**
 * Method decorator that merges the decorated method's resolved payload
 * into the host's in-memory model **before** returning it — so a
 * mutation echo (`setValues`) or a fresh read (`values`) immediately
 * refreshes the registry entity without waiting for the next sync.
 * @param target - The decorated method; must resolve to a (possibly
 * partial) attribute payload.
 * @param _context - TC39 decoration context; pins the decorator kind
 * at type level.
 * @returns The replacement method that updates the model after execution.
 * @category Decorators
 */
export const updateDevice = <
  TArgs extends readonly unknown[],
  TResult extends UndefinedTolerant<Attributes>,
>(
  target: (...args: TArgs) => Promise<TResult>,
  _context: ClassMethodDecoratorContext,
): ((...args: TArgs) => Promise<TResult>) =>
  async function newTarget(this: HasUpdate, ...args: TArgs) {
    const data = await target.call(this, ...args)
    this.update(data)
    return data
  }
