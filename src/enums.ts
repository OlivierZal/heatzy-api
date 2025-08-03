export enum DerogationMode {
  boost = 2,
  off = 0,
  vacation = 1,
  // Pro
  presence = 3,
}

export enum Mode {
  comfort = 'cft',
  eco = 'eco',
  frostProtection = 'fro',
  stop = 'stop',
  // Not V1, V2
  comfortMinus1 = 'cft1',
  comfortMinus2 = 'cft2',
}

export enum Product {
  glow = 5,
  pro = 6,
  v1 = 1,
  v2 = 2,
  v4 = 4,
}

export enum Switch {
  off = 0,
  on = 1,
}

export enum TemperatureCompensation {
  minus5C = 0,
  noChange = 50,
  plus5C = 100,
}

export const modeToModeV1: Partial<Record<Mode, number>> = {
  cft: 0,
  eco: 1,
  fro: 2,
  stop: 3,
}
