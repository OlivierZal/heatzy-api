import { z } from 'zod'

import type {
  Attributes,
  Bindings,
  DeviceBinding,
  DeviceData,
  LoginData,
} from '../types/index.ts'
import { Mode, modeLabels, Switch } from '../constants.ts'
import { ValidationError } from '../errors/index.ts'

// Runtime schemas for API boundaries where silent shape drift would hide
// behind later undefined-property errors. Scoped to payloads the SDK
// actually consumes fields from — the wire format carries many more
// keys that the compile-time types already document.
//
// A READ checks the wire's TYPE, not a vocabulary this SDK happens to
// know: 10.0.0 put closed literals on `com_temp` and `cur_mode`, and
// every Glow, Onyx and Shine (numeric `cur_mode`, a calibration such
// as 5) plus every calibrated Pro failed its whole `/devdata` read
// from then on. The facades turn an unmodelled value into `null`.
// Only `mode` stays a closed set: it is the write vocabulary, and a
// label this SDK cannot map is a real protocol change.

// A V1 answers its Chinese label; every later generation, the Latin one.
const ModeSchema = z.preprocess(
  (value) =>
    typeof value === 'string' ? (modeLabels.get(value) ?? value) : value,
  z.literal(Object.values(Mode)),
)

// Gizwits declares `on_off` and `window_switch` as `bool` datapoints:
// every REST sample on record answers 0/1, a boolean is normalised.
// Gizwits answers a datapoint's declared form, and a switch is declared
// three ways across the products: the 0/1 this SDK writes, the `bool`
// the vendor documents for `on_off` and `window_switch`, and the
// on/off LABELS of an enum-declared one — witnessed in the field on a
// Pilote Pro, whose `temp_set_step` (documented `Bool (0-1)`) answered
// the string `off` (report f6f78df8, 2026-09-16). Every form reads
// back as the one `Switch` value; writes stay 0/1.
const SwitchSchema = z.union([
  z.literal(Object.values(Switch)),
  z.boolean().transform((isOn) => (isOn ? Switch.on : Switch.off)),
  z
    .literal(['off', 'on'])
    .transform((label) => (label === 'on' ? Switch.on : Switch.off)),
])

// Optional fields stay permissive per generation: a V1 payload carries
// none of them, a Pro payload carries most. `looseObject` lets Gizwits
// add new keys without breaking validation.
const AttributesSchema: z.ZodType<Attributes> = z.looseObject({
  cft_temp: z.number().optional(),
  cft_tempH: z.number().optional(),
  cft_tempL: z.number().optional(),
  com_temp: z.number().optional(),
  cur_humi: z.number().optional(),
  cur_mode: z.union([z.string(), z.number(), z.null()]).optional(),
  cur_temp: z.number().optional(),
  cur_tempH: z.number().optional(),
  cur_tempL: z.number().optional(),
  derog_mode: z.int().optional(),
  derog_time: z.number().optional(),
  eco_temp: z.number().optional(),
  eco_tempH: z.number().optional(),
  eco_tempL: z.number().optional(),
  LOCK_C: SwitchSchema.optional(),
  lock_switch: SwitchSchema.optional(),
  mode: ModeSchema,
  on_off: SwitchSchema.optional(),
  timer_switch: SwitchSchema.optional(),
  window_switch: SwitchSchema.optional(),
})

/**
 * One `/bindings` entry — applied ONE BY ONE at the listing boundary,
 * never inside the envelope's array (see {@link BindingsSchema}).
 */
export const DeviceBindingSchema: z.ZodType<DeviceBinding> = z.looseObject({
  dev_alias: z.string(),
  did: z.string().min(1),
  product_key: z.string().min(1),
  product_name: z.string(),
})

/**
 * `/bindings` response ENVELOPE — the device list is validated as a
 * list, its entries left `unknown`.
 *
 * The registry cycle opens here, and the enforced post-auth cycle
 * propagates its failures, so an atomic `z.array(DeviceBindingSchema)`
 * would let one unreadable entry invalidate every sibling and read as
 * "cannot sign in at all". `HeatzyAPI.list` therefore validates the
 * entries individually against {@link DeviceBindingSchema} and drops
 * — loudly — whatever it cannot model. A body that is not a device
 * list at all is still a hard failure: nothing survives it to salvage.
 */
export const BindingsSchema: z.ZodType<Bindings> = z.looseObject({
  devices: z.array(z.unknown()),
})

/**
 * `/devdata/{did}/latest` response envelope.
 */
export const DeviceDataSchema: z.ZodType<DeviceData> = z.looseObject({
  attr: AttributesSchema,
})

/**
 * `/login` response.
 */
export const LoginDataSchema: z.ZodType<LoginData> = z.looseObject({
  expire_at: z.number(),
  token: z.string().min(1),
})

// The value at an issue's path, walked on the raw payload. Only a
// primitive is ever described: a failing container (a body that is not
// an object, a list) would otherwise print everything under it.
const describeReceived = (
  data: unknown,
  path: readonly PropertyKey[],
): string => {
  let value: unknown = data
  for (const key of path) {
    if (
      typeof value !== 'object' ||
      value === null ||
      !Object.hasOwn(value, key)
    ) {
      return ' (missing)'
    }
    value = Reflect.get(value, key)
  }
  return typeof value === 'object' && value !== null
    ? ''
    : ` (received ${JSON.stringify(value)})`
}

const labelIssuePath = (path: readonly PropertyKey[]): string => {
  const label = path.map(String).join('.')
  return label === '' ? '(root)' : label
}

const joinOnce = (labels: readonly string[]): string =>
  [...new Set(labels)].join(', ')

/**
 * Name the paths a zod refusal failed at, each once and without the
 * values received there: the identity of a refusal whose received
 * values may change from one read to the next.
 * @param error - The zod refusal.
 * @returns The failing paths, comma-separated.
 */
export const describeRefusedPaths = (error: z.ZodError): string =>
  joinOnce(error.issues.map(({ path }) => labelIssuePath(path)))

/**
 * Parse `data` against `schema`; throw {@link ValidationError} on
 * mismatch. The message names each failing path once — and, when the caller
 * opts in, the primitive value received there — while the full issue
 * list stays in the ZodError `cause`, so a logged error prints it once.
 * @param schema - Zod schema to validate against.
 * @param data - Untrusted data from an upstream API response.
 * @param options - Parsing options.
 * @param options.context - Short label surfaced in the thrown error
 * message.
 * @param options.shouldReportReceived - Name the received values in
 * the message. ONLY for a payload that carries no credential: the
 * login body holds the token and `/bindings` each device's passcode.
 * @returns The parsed, typed data.
 * @throws A {@link ValidationError} whose `cause` is the underlying ZodError.
 */
export const parseOrThrow = <T>(
  schema: z.ZodType<T>,
  data: unknown,
  {
    context,
    shouldReportReceived = false,
  }: {
    readonly context: string
    readonly shouldReportReceived?: boolean | undefined
  },
): T => {
  const result = schema.safeParse(data)
  if (!result.success) {
    const paths = joinOnce(
      result.error.issues.map(
        ({ path }) =>
          `${labelIssuePath(path)}${
            shouldReportReceived ? describeReceived(data, path) : ''
          }`,
      ),
    )
    throw new ValidationError(
      `Invalid API response shape (${context}): ${paths}`,
      { cause: result.error, context },
    )
  }
  return result.data
}
