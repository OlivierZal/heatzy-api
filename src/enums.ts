export enum DerogationMode {
  boost = 2,
  off = 0,
  vacation = 1,
  // Pro
  presence = 3,
}

export enum Mode {
  cft = 'cft',
  eco = 'eco',
  fro = 'fro',
  stop = 'stop',
  // Not V1, V2
  cft1 = 'cft1',
  cft2 = 'cft2',
}

export enum ModeV1 {
  cft = 0,
  eco = 1,
  fro = 2,
  stop = 3,
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
