import type {
  Attributes,
  DeviceBinding,
  UndefinedTolerant,
} from '../types/index.ts'
import { type Product, DerogationMode, getProduct, Mode } from '../constants.ts'
import { Temporal } from '../temporal.ts'
import { isKeyOf } from '../utils.ts'

/**
 * The last non-stop heating mode — what "back on" restores to.
 * @category Entities
 */
export type PreviousMode = Exclude<Mode, typeof Mode.stop>

const PRESENCE_END_MINUTES = {
  [Mode.comfort]: 90,
  [Mode.comfortMinus1]: 60,
  [Mode.comfortMinus2]: 30,
} as const

const isPresenceCountdownMode = isKeyOf(PRESENCE_END_MINUTES)

interface DerogationTransition {
  readonly currentMode?: Mode | undefined
  readonly derogationMode?: DerogationMode | undefined
  readonly derogationTime?: number | undefined
  readonly newCurrentMode?: Mode | undefined
  readonly newDerogationMode?: DerogationMode | undefined
  readonly newDerogationTime?: number | undefined
}

const hasDerogationChanged = ({
  derogationMode,
  derogationTime,
  newDerogationMode,
  newDerogationTime,
}: DerogationTransition): boolean =>
  (newDerogationMode !== undefined && newDerogationMode !== derogationMode) ||
  (newDerogationTime !== undefined && newDerogationTime !== derogationTime)

/**
 * In-memory model of one bound Heatzy device: wire identity, the
 * last-synced attribute payload, and the derived state the wire does
 * not carry (previous mode, derogation end date). Instances are
 * created and updated exclusively by {@link DeviceRegistry.syncDevices},
 * which preserves object identity across syncs.
 * @category Entities
 */
export class Device {
  /** Wire `did` — the device's unique identifier. */
  public readonly id: string

  /** Wire `dev_alias` — the user-facing device name; tracks renames across syncs. */
  public name: string

  /** Product generation resolved from the wire `product_key`. */
  public readonly product: Product

  /** Wire `product_key` hash. */
  public readonly productKey: string

  /** Wire `product_name` label. */
  public readonly productName: string

  /**
   * The last-synced attribute payload.
   * @returns The attributes as of the latest sync or decorated mutation.
   */
  public get data(): Attributes {
    return this.#attributes
  }

  /**
   * When the running derogation (boost, vacation, presence countdown)
   * ends, or `null` when none is running or the deadline has passed.
   * @returns The derogation end date, or `null`.
   */
  public get derogationEndDate(): Temporal.ZonedDateTime | null {
    return (
        this.#derogationEnd !== null &&
          Temporal.ZonedDateTime.compare(this.#derogationEnd, this.#now()) > 0
      ) ?
        this.#derogationEnd
      : null
  }

  /**
   * The last non-stop mode observed — what "back on" restores to.
   * Defaults to eco when the device has only ever been seen stopped.
   * @returns The previous heating mode.
   */
  public get previousMode(): PreviousMode {
    return this.#previousMode ?? Mode.eco
  }

  #attributes: Attributes

  #derogationEnd: Temporal.ZonedDateTime | null = null

  #previousMode: PreviousMode | undefined

  readonly #timezone: string | undefined

  /**
   * Builds the model from a `/bindings` entry and its live attributes.
   * @param binding - Wire identity from `/bindings`.
   * @param attributes - Live attribute payload from `/devdata`.
   * @param timezone - IANA timezone anchoring derogation end dates;
   * defaults to the runtime system timezone.
   */
  public constructor(
    binding: DeviceBinding,
    attributes: Attributes,
    timezone?: string,
  ) {
    this.id = binding.did
    this.name = binding.dev_alias
    this.productKey = binding.product_key
    this.productName = binding.product_name
    this.product = getProduct(binding.product_key)
    this.#timezone = timezone
    this.#attributes = attributes
    this.#handleTransition({
      currentMode: attributes.cur_mode,
      derogationMode: attributes.derog_mode,
      derogationTime: attributes.derog_time,
      mode: attributes.mode,
    })
  }

  /**
   * Merge a fresh (possibly partial) attribute payload into the model
   * and derive the transition state (previous mode, derogation end).
   * Explicit-`undefined` keys are dropped — a tolerant caller payload
   * cannot erase known state.
   * @param attributes - Fresh attribute payload from a sync or a
   * decorated mutation echo.
   */
  public update(attributes: UndefinedTolerant<Attributes>): void {
    this.#handleTransition({
      currentMode: this.#attributes.cur_mode,
      derogationMode: this.#attributes.derog_mode,
      derogationTime: this.#attributes.derog_time,
      mode: this.#attributes.mode,
      newCurrentMode: attributes.cur_mode,
      newDerogationMode: attributes.derog_mode,
      newDerogationTime: attributes.derog_time,
    })

    this.#attributes = {
      ...this.#attributes,
      ...Object.fromEntries(
        Object.entries(attributes).filter(([, value]) => value !== undefined),
      ),
    }
  }

  #handleDerogationEnd(transition: DerogationTransition): void {
    const mode = transition.newDerogationMode ?? transition.derogationMode
    if (mode === DerogationMode.presence) {
      this.#handlePresenceEnd(transition)
      return
    }
    if (mode === undefined || !hasDerogationChanged(transition)) {
      return
    }
    const time = transition.newDerogationTime ?? transition.derogationTime ?? 0
    this.#derogationEnd =
      mode === DerogationMode.off ?
        null
      : this.#now().add(
          mode === DerogationMode.boost ? { minutes: time } : { days: time },
        )
  }

  // The presence countdown keys off the *reported* mode: comfort
  // starts a 90-minute window, comfort−1 60, comfort−2 30; any other
  // mode clears it.
  #handlePresenceEnd({
    currentMode,
    newCurrentMode,
  }: DerogationTransition): void {
    if (newCurrentMode !== undefined && newCurrentMode !== currentMode) {
      this.#derogationEnd =
        isPresenceCountdownMode(newCurrentMode) ?
          this.#now().add({ minutes: PRESENCE_END_MINUTES[newCurrentMode] })
        : null
    }
  }

  // `mode` is the payload *before* the merge: the previous mode is the
  // last non-stop mode seen before the latest change landed.
  #handleTransition(
    transition: DerogationTransition & { readonly mode: Mode },
  ): void {
    if (transition.mode !== Mode.stop) {
      this.#previousMode = transition.mode
    }
    this.#handleDerogationEnd(transition)
  }

  #now(): Temporal.ZonedDateTime {
    return Temporal.Now.zonedDateTimeISO(this.#timezone)
  }
}

/**
 * Refresh a registry model in place from a fresh `/bindings` entry and
 * its live attributes; preserves the instance so facade references
 * stay valid.
 * @param model - The registry model to refresh.
 * @param binding - Fresh wire identity (tracks renames).
 * @param attributes - Fresh live attribute payload.
 * @category Entities
 */
export const syncDevice = (
  model: Device,
  binding: DeviceBinding,
  attributes: Attributes,
): void => {
  model.name = binding.dev_alias
  model.update(attributes)
}
