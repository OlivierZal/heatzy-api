/**
 * Object that supports sync notification via `notifySync`. Both
 * {@link HeatzyAPI} (bare payload, routed through the lifecycle
 * emitter) and facades (enrich the payload with their `id` then
 * delegate to `api.notifySync`) implement this contract structurally.
 */
interface HasNotifySync {
  readonly notifySync?: (params?: {
    ids?: string[] | undefined
  }) => Promise<void>
}

/**
 * Method decorator that invokes a sync notification **after** the
 * decorated method resolves. The host implements `notifySync`
 * structurally — facades enrich the payload with their `id` before
 * delegating, {@link HeatzyAPI} emits straight through the lifecycle
 * emitter. No action is taken when the host doesn't expose the hook.
 *
 * Intended for one-shot post-method notifications; this is **not**
 * a subscription. Exceptions thrown by the consumer's callback
 * propagate — the decorator does not swallow them, so a buggy sync
 * handler surfaces on the caller rather than dying silently.
 * @param target - The decorated method.
 * @param _context - TC39 decoration context; pins the decorator kind
 * at type level.
 * @returns The replacement method that triggers sync after execution.
 * @category Decorators
 */
export const syncDevices = <TArgs extends readonly unknown[], TResult>(
  target: (...args: TArgs) => Promise<TResult>,
  _context: ClassMethodDecoratorContext,
): ((...args: TArgs) => Promise<TResult>) =>
  async function newTarget(this: HasNotifySync, ...args: TArgs) {
    const data = await target.call(this, ...args)
    await this.notifySync?.()
    return data
  }
