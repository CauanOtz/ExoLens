// =======================================================
// === UNIDADES ASTRONÔMICAS E FÍSICAS PADRONIZADAS ====
// =======================================================

export enum MassUnit {
  SOLAR_MASS = 'Solar Mass',     // M☉ — usado para estrelas
  JUPITER_MASS = 'Jupiter Mass', // M♃ — usado para exoplanetas
  EARTH_MASS = 'Earth Mass',     // M⊕ — usado para planetas rochosos
  KILOGRAM = 'kg',               // unidade física absoluta (SI)
}

export enum RadiusUnit {
  SOLAR_RADIUS = 'Solar Radius',   // R☉ — usado para estrelas
  JUPITER_RADIUS = 'Jupiter Radius', // R♃ — usado para planetas gasosos
  EARTH_RADIUS = 'Earth Radius',     // R⊕ — usado para planetas rochosos
  KILOMETER = 'km',                 // unidade física absoluta (SI)
}

export enum TimeUnit {
  SECONDS = 'seconds', // unidade base do SI
  MINUTES = 'minutes', // útil para trânsitos muito curtos
  HOURS = 'hours',     // usado para durações médias
  DAYS = 'days',       // usado para períodos orbitais
  YEARS = 'years',     // usado para escalas orbitais longas
}

export enum TemperatureUnit {
  KELVIN = 'K',   // unidade científica padrão

}
