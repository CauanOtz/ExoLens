 //Parametros usados na predição

//parametros da estrela
export type StarParams = {
  effective_temperature_value: number;
  effective_temperature_error: number;
  effective_temperature_unit: string;
  mass_value: number;
  mass_error: number;
  mass_unit: string;
  radius_value: number;
  radius_error: number;
  radius_unit: string;
};

//parametros do candidato
export type CandidateParams = {
  mass_value: number;
  mass_error: number;
  mass_unit: string;
  radius_value: number;
  radius_error: number;
  radius_unit: string;
  equilibrium_temp: number;
};

//parametros do sinal
export type SignalParams = {
  impact_parameter_value: number;
  impact_parameter_error: number;
  orbital_period_value: number;
  orbital_period_error: number;
  orbital_period_unit: string;
  transit_duration_value: number;
  transit_duration_error: number;
  transit_duration_unit: string;
  transit_depth_value: number;
  transit_depth_error: number;
  signal_to_noise: number;
};