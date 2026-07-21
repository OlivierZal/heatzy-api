// Wire vocabulary of the Gizwits/Heatzy API. Values mirror the wire
// verbatim (`cft`, `eco`, `fro`… and numeric switches) — do not rename
// them to satisfy style rules.

/**
 * Derogation (temporary override) modes.
 * @category Constants
 */
export const DerogationMode = {
  boost: 2,
  off: 0,
  presence: 3,
  vacation: 1,
} as const
export type DerogationMode =
  (typeof DerogationMode)[keyof typeof DerogationMode]

/**
 * Heating modes. `cft1`/`cft2` do not exist on V1 and V2 products.
 * @category Constants
 */
export const Mode = {
  comfort: 'cft',
  comfortMinus1: 'cft1',
  comfortMinus2: 'cft2',
  eco: 'eco',
  frostProtection: 'fro',
  stop: 'stop',
} as const
export type Mode = (typeof Mode)[keyof typeof Mode]

/**
 * Product generations, ordered so `>=` reads as capability support.
 * @category Constants
 */
export const Product = {
  glow: 5,
  pro: 6,
  v1: 1,
  v2: 2,
  v4: 4,
} as const
export type Product = (typeof Product)[keyof typeof Product]

/**
 * Numeric boolean the wire uses for every switch attribute.
 * @category Constants
 */
export const Switch = {
  off: 0,
  on: 1,
} as const
export type Switch = (typeof Switch)[keyof typeof Switch]

/**
 * `com_temp` values: an offset encoded around 50 (= no change).
 * @category Constants
 */
export const TemperatureCompensation = {
  minus5C: 0,
  noChange: 50,
  plus5C: 100,
} as const
export type TemperatureCompensation =
  (typeof TemperatureCompensation)[keyof typeof TemperatureCompensation]

/**
 * V1 products speak a positional `raw` triplet instead of `attrs`;
 * this maps the four base modes to their positional value.
 * @category Constants
 */
export const modeToModeV1 = {
  cft: 0,
  eco: 1,
  fro: 2,
  stop: 3,
} as const

/**
 * Constant filler of the V1 `raw` triplet's first two positions.
 * @category Constants
 */
export const POST_DATA_UNIT = 1

/**
 * Wire temperatures are tenths of degrees Celsius.
 * @category Constants
 */
export const TEMPERATURE_SCALE = 10

// Known `product_key` hashes per generation; V3 devices identify as
// V2, Onyx and Shine as Glow.
const productByKey = new Map<string, Product>([
  // Shine
  ['2884feb88e0b4f30b75ea5572276a102', Product.glow],
  // Glow
  ['2fd622e45283470f9e27e8e6167d7533', Product.glow],
  // V4
  ['46409c7f29d4411c85a3a46e5ee3703e', Product.v4],
  // V2
  ['4fc968a21e7243b390e9ede6f1c6465d', Product.v2],
  // V2
  ['51d16c22a5f74280bc3cfe9ebcdc6402', Product.v2],
  // V1
  ['9420ae048da545c88fc6274d204dd25f', Product.v1],
  // V4
  ['9dacde7ef459421eaf8dc4bea9385634', Product.v4],
  // Pro
  ['a77a929fcf0d4631bc4f669080376891', Product.pro],
  // V3
  ['b8c6657b66c34148b4dee64d615cefc7', Product.v2],
  // V3
  ['b9a67b6ce24b437d9794103fd317e627', Product.v2],
  // Onyx
  ['bb10d064f8de409db633b750faa22a52', Product.glow],
  // Glow
  ['cffa0df68a52449085c5d1e72c2f6bb0', Product.glow],
])

/**
 * Resolve a device's product generation from its `product_key`.
 * @param productKey - The wire `product_key` hash.
 * @returns The product generation.
 * @throws An `Error` when the key is unknown.
 * @category Constants
 */
export const getProduct = (productKey: string): Product => {
  const product = productByKey.get(productKey)
  if (product === undefined) {
    throw new Error(`Invalid product: ${productKey}`)
  }
  return product
}
