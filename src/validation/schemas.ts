import { z } from 'zod'

import type {
  Attributes,
  Bindings,
  DeviceData,
  LoginData,
} from '../types/index.ts'
import {
  DerogationMode,
  Mode,
  Switch,
  TemperatureCompensation,
} from '../constants.ts'
import { ValidationError } from '../errors/index.ts'

// Runtime schemas for API boundaries where silent shape drift would hide
// behind later undefined-property errors. Scoped to payloads the SDK
// actually consumes fields from — the wire format carries many more
// keys that the compile-time types already document.

const ModeSchema = z.literal(Object.values(Mode))

const SwitchSchema = z.literal(Object.values(Switch))

const DerogationModeSchema = z.literal(Object.values(DerogationMode))

const TemperatureCompensationSchema = z.literal(
  Object.values(TemperatureCompensation),
)

// Optional fields stay permissive per generation: a V1 payload carries
// none of them, a Pro payload carries most. `looseObject` lets Gizwits
// add new keys without breaking validation.
const AttributesSchema: z.ZodType<Attributes> = z.looseObject({
  cft_temp: z.number().optional(),
  cft_tempH: z.number().optional(),
  cft_tempL: z.number().optional(),
  com_temp: TemperatureCompensationSchema.optional(),
  cur_humi: z.number().optional(),
  cur_mode: ModeSchema.optional(),
  cur_temp: z.number().optional(),
  cur_tempH: z.number().optional(),
  cur_tempL: z.number().optional(),
  derog_mode: DerogationModeSchema.optional(),
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

const DeviceBindingSchema = z.looseObject({
  dev_alias: z.string(),
  did: z.string().min(1),
  product_key: z.string().min(1),
  product_name: z.string(),
})

/** `/bindings` response envelope. */
export const BindingsSchema: z.ZodType<Bindings> = z.looseObject({
  devices: z.array(DeviceBindingSchema),
})

/** `/devdata/{did}/latest` response envelope. */
export const DeviceDataSchema: z.ZodType<DeviceData> = z.looseObject({
  attr: AttributesSchema,
})

/** `/login` response. */
export const LoginDataSchema: z.ZodType<LoginData> = z.looseObject({
  expire_at: z.number(),
  token: z.string().min(1),
})

/**
 * Parse `data` against `schema`; throw {@link ValidationError} on
 * mismatch. The underlying ZodError is attached via `cause` so
 * downstream observers can inspect the field path breakdown without
 * re-parsing the message string.
 * @param schema - Zod schema to validate against.
 * @param data - Untrusted data from an upstream API response.
 * @param context - Short label surfaced in the thrown error message.
 * @returns The parsed, typed data.
 * @throws A {@link ValidationError} whose `cause` is the underlying ZodError.
 */
export const parseOrThrow = <T>(
  schema: z.ZodType<T>,
  data: unknown,
  context: string,
): T => {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ValidationError(
      `Invalid API response shape (${context}): ${result.error.message}`,
      { cause: result.error, context },
    )
  }
  return result.data
}
