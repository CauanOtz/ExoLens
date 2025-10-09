export interface ViewPrediction {
  id: string;
  description: string;
  probability: number | null;
  classification: string;
  createdAt: string | null; // backend sends Date, we keep as ISO string in FE
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
  equilibrium_temp: number | null;
  signal_to_noise: number | null;
  existingData: boolean;
  transition_depth_value: number | null;
  transition_depth_error: number | null;
  impact_parameter_value: number | null;
  impact_parameter_error: number | null;
  kepid: number | null;
}
