export type ExoplanetClassification = 'CONFIRMED' | 'CANDIDATE' | 'FALSE POSITIVE' | string;

export interface Exoplanet {
  id: string;
  description: string;
  probability: number | null;
  classification: ExoplanetClassification;
  createdAt: string;
  mass_value: number | null;
  mass_unit: string | null;
  radius_value: number | null;
  radius_unit: string | null;
  transit_duration_value: number | null;
  transit_duration_unit: string | null;
  orbital_period_value: number | null;
  orbital_period_unit: string | null;
  st_mass_value: number | null;
  st_massunit: string | null;
  st_radius_value: number | null;
  st_radiusunit: string | null;
  st_teff_value: number | null;
  st_teffunit: string | null;
  existingData: boolean;
}
