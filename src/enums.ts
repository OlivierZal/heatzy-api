export enum DerogationMode {
  Boost = 2,
  Off = 0,
  Vacation = 1,
  // Pro
  Presence = 3,
}

export enum Mode {
  Comfort = 'cft',
  Eco = 'eco',
  FrostProtection = 'fro',
  Stop = 'stop',
  // Not V1, V2
  ComfortMinus1 = 'cft1',
  ComfortMinus2 = 'cft2',
}

export enum Switch {
  Off = 0,
  On = 1,
}

export enum TemperatureCompensation {
  Minus5C = 0,
  NoChange = 50,
  Plus5C = 100,
}

export const modeToModeV1: Partial<Record<Mode, number>> = {
  cft: 0,
  eco: 1,
  fro: 2,
  stop: 3,
}
