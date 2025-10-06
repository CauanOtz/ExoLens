
import { z } from 'zod';
import { registerPredictionSchema } from './../../app/validators/predictionValidator';

type PredictionInput = z.infer<typeof registerPredictionSchema>;

interface MLInput {
  data_type: string;
  csv_data: string;
}

const JUPITER_RADIUS_IN_KM = 69911;
const EARTH_RADIUS_IN_KM = 6371;
const SOLAR_RADIUS_IN_KM = 696340;

const JUPITER_MASS_IN_KG = 1.898e27;
const EARTH_MASS_IN_KG = 5.972e24;
const SOLAR_MASS_IN_KG = 1.989e30;


function convertTime(value: number | null, unit: PredictionInput['signalParams']['orbital_period_unit'], targetUnit: 'days' | 'hours'): number {
    if (value === null || value === undefined || unit === null || unit === undefined) {
        return 0;
    }
    const hoursInUnit = {
        seconds: 1 / 3600,
        minutes: 1 / 60,
        hours: 1,
        days: 24,
        years: 365.25 * 24,
    };
    
    const valueInHours = value * hoursInUnit[unit as keyof typeof hoursInUnit];

    if (targetUnit === 'hours') {
        return valueInHours;
    }
    return valueInHours / 24;
}

function convertToEarthRadii(value: number | null, unit: PredictionInput['candidateParams']['radius_unit']): number {
    if (value === null || value === undefined || unit === null || unit === undefined) {
        return 0;
    }
    switch(unit) {
        case 'km': return value / EARTH_RADIUS_IN_KM;
        case 'Earth Radius': return value;
        case 'Jupiter Radius': return value * (JUPITER_RADIUS_IN_KM / EARTH_RADIUS_IN_KM); 
        case 'Solar Radius': return value * (SOLAR_RADIUS_IN_KM / EARTH_RADIUS_IN_KM); 
        default: return value;
    }
}


function convertToSolarRadii(value: number | null, unit: PredictionInput['starParams']['radius_unit']): number {
    if (value === null || value === undefined || unit === null || unit === undefined) {
        return 0;
    }
    switch(unit) {
        case 'km': return value / SOLAR_RADIUS_IN_KM;
        case 'Solar Radius': return value;
        case 'Jupiter Radius': return value * (JUPITER_RADIUS_IN_KM / SOLAR_RADIUS_IN_KM);
        case 'Earth Radius': return value * (EARTH_RADIUS_IN_KM / SOLAR_RADIUS_IN_KM);
        default: return value;
    }
}


function convertToSolarMasses(value: number | null, unit: PredictionInput['starParams']['mass_unit']): number {
    if (value === null || value === undefined || unit === null || unit === undefined) {
        return 0;
    }
    switch(unit) {
        case 'kg': return value / SOLAR_MASS_IN_KG;
        case 'Solar Mass': return value;
        case 'Jupiter Mass': return value * (JUPITER_MASS_IN_KG / SOLAR_MASS_IN_KG); 
        case 'Earth Mass': return value * (EARTH_MASS_IN_KG / SOLAR_MASS_IN_KG); 
        default: return value;
    }
}



export function transformToMLInput(data: PredictionInput): MLInput {
  
  const headers = [
    'orbital_period',       
    'transit_duration_hr', 
    'transit_depth_ppm',  
    'planet_radius_earth', 
    'stellar_temp_k',     
    'stellar_radius_solar', 
    'stellar_mass_solar',   
    'impact_parameter',  
    'equilibrium_temp',
    'signal_to_noise'
  ].join(',');

  const values = [
    convertTime(data.signalParams.orbital_period_value, data.signalParams.orbital_period_unit, 'days'),
    convertTime(data.signalParams.transit_duration_value, data.signalParams.transit_duration_unit, 'hours'),
    data.signalParams.transit_depth_value ?? 0, 
    convertToEarthRadii(data.candidateParams.radius_value, data.candidateParams.radius_unit),
    data.starParams.effective_temperature_value ?? 0, 
    convertToSolarRadii(data.starParams.radius_value, data.starParams.radius_unit),
    convertToSolarMasses(data.starParams.mass_value, data.starParams.mass_unit),
    data.signalParams.impact_parameter_value ?? 0,
    data.candidateParams.equilibrium_temp ?? 0,
    data.signalParams.signal_to_noise ?? 0,
  ].join(',');

  return {
    data_type: "fictitious",
    csv_data: `${headers}\n${values}\n`
  };
}