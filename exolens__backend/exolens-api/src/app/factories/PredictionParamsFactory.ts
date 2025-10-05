import {
  StarParams,
  CandidateParams,
  SignalParams
} from '../validators/predictionValidator';

export function createStarParams(overrides: Partial<StarParams> = {}): StarParams {
  const defaultParams: StarParams = {
    effective_temperature_value: 5778,
    effective_temperature_error: 50,
    effective_temperature_unit: 'K',
    mass_value: 1.0,
    mass_error: 0.05,
    mass_unit: 'Solar Mass',
    radius_value: 1.0,
    radius_error: 0.02,
    radius_unit: 'Solar Radius',
  };

  return { ...defaultParams, ...overrides };
}

export function createCandidateParams(overrides: Partial<CandidateParams> = {}): CandidateParams {
  const defaultParams: CandidateParams = {
    mass_value: 1.0,
    mass_error: 0.1,
    mass_unit: 'Jupiter Mass',
    radius_value: 1.0,
    radius_error: 0.1,
    radius_unit: 'Earth Radius',
  };

  return { ...defaultParams, ...overrides };
}

export function createSignalParams(overrides: Partial<SignalParams> = {}): SignalParams {
  const defaultParams: SignalParams = {
    impact_parameter_value: 0.5,
    impact_parameter_error: 0.05,
    orbital_period_value: 365.25,
    orbital_period_error: 0.1,
    orbital_period_unit: 'days', 
    transit_duration_value: 3.5,
    transit_duration_error: 0.2,
    transit_duration_unit: 'hours',
    transit_depth_value: 840,
    transit_depth_error: 10,
  };

  return { ...defaultParams, ...overrides };
}