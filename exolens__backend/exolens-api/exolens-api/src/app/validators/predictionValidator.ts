import { z } from 'zod';

export const signalParams = z.object({
    impact_parameter_value: z.number().min(0).nullable(),
    impact_parameter_error: z.number().min(0).nullable(),
    orbital_period_value: z.number().min(0).nullable(),
    orbital_period_error: z.number().min(0).nullable(),
    orbital_period_unit: z.enum(['seconds', 'minutes', 'hours', 'days', 'years']).nullable(),
    transit_duration_value: z.number().min(0).nullable(),
    transit_duration_error: z.number().min(0).nullable(),
    transit_duration_unit: z.enum(['seconds', 'minutes', 'hours', 'days', 'years']).nullable(),
    transit_depth_value: z.number().min(0).nullable(),
    transit_depth_error: z.number().min(0).nullable(),
    signal_to_noise: z.number().min(0).nullable(),
});


export const candidateParams = z.object({
    mass_value: z.number().min(0).nullable(),
    mass_error: z.number().min(0).nullable(),
    mass_unit: z.enum(['Solar Mass', 'Jupiter Mass', 'Earth Mass', 'kg']).nullable(),
    radius_value: z.number().min(0).nullable(),
    radius_error: z.number().min(0).nullable(),
    radius_unit: z.enum(['Solar Radius', 'Jupiter Radius', 'Earth Radius', 'km']).nullable(),
    equilibrium_temp: z.number().min(0).nullable(),
});


export const starParams = z.object({
    effective_temperature_value: z.number().min(0).nullable(),
    effective_temperature_error: z.number().min(0).nullable(),
    effective_temperature_unit: z.enum(['K']).nullable(),
    mass_value: z.number().min(0).nullable(),
    mass_error: z.number().min(0).nullable(),
    mass_unit: z.enum(['Solar Mass', 'Jupiter Mass', 'Earth Mass', 'kg']).nullable(),
    radius_value: z.number().min(0).nullable(),
    radius_error: z.number().min(0).nullable(),
    radius_unit: z.enum(['Solar Radius', 'Jupiter Radius', 'Earth Radius', 'km']).nullable(),
});

export const registerPredictionSchema = z.object({
  description: z.string().min(7, "Description must be at least 7 characters."),
  probability: z.number().min(0).max(1),
  classification: z.enum(['FALSE POSITIVE','CANDIDATE','CONFIRMED']),  
  createdAt: z.date().optional(),
  starParams: starParams,
  candidateParams: candidateParams,
  signalParams: signalParams,
  userId: z.string().uuid(),
});

export const viewPredictionSchema = z.object({
    id: z.string(),
    description: z.string(),
    probability: z.number(),
    classification: z.string(),
    createdAt: z.date().nullable(),
    mass_value: z.number().nullable(),
    mass_unit: z.string().nullable(),
    radius_value: z.number().nullable(),
    radius_unit: z.string().nullable(),
    transit_duration_value: z.number().nullable(),
    transit_duration_unit: z.string().nullable(),
    orbital_period_value: z.number().nullable(),
    orbital_period_unit: z.string().nullable(),
    st_mass_value: z.number().min(0).nullable(),
    st_massunit: z.string().nullable(),
    st_radius_value: z.number().min(0).nullable(),
    st_radiusunit: z.string().nullable(),
    st_teff_value: z.number().min(0).nullable(),
    st_teffunit: z.string().nullable(),
    equilibrium_temp: z.number().nullable(),
    signal_to_noise: z.number().nullable(),
    existingData: z.boolean(),
    transition_depth_value: z.number().nullable(),
    transition_depth_error: z.number().nullable(),
    impact_parameter_value: z.number().nullable(),
    impact_parameter_error: z.number().nullable(),
    // New: expose NASA kepid when available
    kepid: z.number().nullable(),
})

const measurementValueAndError = z.object({
  value: z.number().nullable(),
  error: z.number().nullable(),
});

const measurementValueAndErrorAndUnit = z.object({
  value: z.number().nullable(),
  error: z.number().nullable(),
  unit: z.string().nullable(),
});



export const formattedPredictionDTOSchema = z.object({
    id: z.string().uuid(),
    description: z.string().nullable(),
    probability: z.number().nullable(),
    classification: z.string(),
    createdAt: z.date(),
  signal_params: z.object({
    orbital_period: measurementValueAndErrorAndUnit,
    transit_duration: measurementValueAndErrorAndUnit,
    transit_depth: measurementValueAndError,
    impact_parameter: measurementValueAndError,
  }),
  candidate_params: z.object({
    mass: measurementValueAndErrorAndUnit,
    radius: measurementValueAndErrorAndUnit,
  }),
  star_params: z.object({
    mass: measurementValueAndErrorAndUnit,
    radius: measurementValueAndErrorAndUnit,
    effective_temperature: measurementValueAndErrorAndUnit,
  }),
  userId: z.string().uuid(),
  existingData: z.boolean(),
});



type PredictionWithFlatParams = {
  id: string;
  description: string;
  probability: number;
  classification: string;
  createdAt: Date;
  starParams: StarParams;
  candidateParams: CandidateParams;
  signalParams: SignalParams;
  existingData: boolean;
  // Optional kepid pass-through for view mapping
  kepid?: number | null;
};

export function formatPredictionByViewSchema(prediction: any): ViewPredictionDTO {
  const predictionDTO: ViewPredictionDTO = {
    id: prediction.id,
    description: prediction.description,
    probability: prediction.probability ?? null,
    classification: prediction.classification,
    createdAt: prediction.createdAt,
    mass_value: prediction.candidateParams?.mass_value ?? null,
    mass_unit: prediction.candidateParams?.mass_unit ?? null,
    radius_value: prediction.candidateParams?.radius_value ?? null,
    radius_unit: prediction.candidateParams?.radius_unit ?? null,
    transit_duration_value: prediction.signalParams?.transit_duration_value ?? null,
    transit_duration_unit: prediction.signalParams?.transit_duration_unit ?? null,
    orbital_period_value: prediction.signalParams?.orbital_period_value ?? null,
    orbital_period_unit: prediction.signalParams?.orbital_period_unit ?? null,
    st_mass_value: prediction.starParams?.mass_value ?? null,
    st_massunit: prediction.starParams?.mass_unit ?? null,
    st_radius_value: prediction.starParams?.radius_value ?? null,
    st_radiusunit: prediction.starParams?.radius_unit ?? null,
    st_teff_value: prediction.starParams?.effective_temperature_value ?? null,
    st_teffunit: prediction.starParams?.effective_temperature_unit ?? null,
    equilibrium_temp: prediction.candidateParams?.equilibrium_temp ?? null,
    signal_to_noise: prediction.signalParams?.signal_to_noise ?? null,
    existingData: prediction.existingData,
    transition_depth_value: prediction.signalParams?.transit_depth_value ?? null,
    transition_depth_error: prediction.signalParams?.transit_depth_error ?? null,
    impact_parameter_value: prediction.signalParams?.impact_parameter_value ?? null,
    impact_parameter_error: prediction.signalParams?.impact_parameter_error ?? null,
    kepid: prediction.kepid ?? null,
  };
  return predictionDTO;
}


export function formatPredictionForResponse(prediction: PredictionWithFlatParams): FormattedPredictionDTO {
  const predictionDTO: FormattedPredictionDTO = {
    id: prediction.id,
    description: prediction.description ?? null,
    probability: prediction.probability ?? null,
    classification: prediction.classification,
    createdAt: prediction.createdAt,
    star_params: {
      mass: {
        value: prediction.starParams?.mass_value ?? null,
        error: prediction.starParams?.mass_error ?? null,
        unit: prediction.starParams?.mass_unit ?? null,
      },
      radius: {
        value: prediction.starParams?.radius_value ?? null,
        error: prediction.starParams?.radius_error ?? null,
        unit: prediction.starParams?.radius_unit ?? null,
      },
      effective_temperature: {
        value: prediction.starParams?.effective_temperature_value ?? null,
        error: prediction.starParams?.effective_temperature_error ?? null,
        unit: prediction.starParams?.effective_temperature_unit ?? null,
      },
    },
    candidate_params: {
      mass: {
        value: prediction.candidateParams?.mass_value ?? null,
        error: prediction.candidateParams?.mass_error ?? null,
        unit: prediction.candidateParams?.mass_unit ?? null,
      },
      radius: {
        value: prediction.candidateParams?.radius_value ?? null,
        error: prediction.candidateParams?.radius_error ?? null,
        unit: prediction.candidateParams?.radius_unit ?? null,
      },
    },
    signal_params: {
      orbital_period: {
        value: prediction.signalParams?.orbital_period_value ?? null,
        error: prediction.signalParams?.orbital_period_error ?? null,
        unit: prediction.signalParams?.orbital_period_unit ?? null,
      },
      transit_duration: {
        value: prediction.signalParams?.transit_duration_value ?? null,
        error: prediction.signalParams?.transit_duration_error ?? null,
        unit: prediction.signalParams?.transit_duration_unit ?? null,
      },
      transit_depth: {
        value: prediction.signalParams?.transit_depth_value ?? null,
        error: prediction.signalParams?.transit_depth_error ?? null,
      },
      impact_parameter: {
        value: prediction.signalParams?.impact_parameter_value ?? null,
        error: prediction.signalParams?.impact_parameter_error ?? null,
      },
    },
    userId: (prediction as any).userId,
    existingData: prediction.existingData,
  };

  return predictionDTO;
}

export type RegisterPredicitionDTO = z.infer<typeof registerPredictionSchema>;
export type SignalParams = z.infer<typeof signalParams>;
export type CandidateParams = z.infer<typeof candidateParams>;
export type StarParams = z.infer<typeof starParams>;
export type FormattedPredictionDTO = z.infer<typeof formattedPredictionDTOSchema>;
export type ViewPredictionDTO = z.infer<typeof viewPredictionSchema>;