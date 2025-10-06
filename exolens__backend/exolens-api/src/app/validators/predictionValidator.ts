import { z } from 'zod';


import { MassUnit, RadiusUnit, TimeUnit, TemperatureUnit } from '../../@types/units'; 
 
export const signalParams = z.object({
    impact_parameter_value: z.number().min(0),
    impact_parameter_error: z.number().min(0),
    orbital_period_value: z.number().min(0),
    orbital_period_error: z.number().min(0),
    orbital_period_unit: z.string(),
    transit_duration_value: z.number().min(0),
    transit_duration_error: z.number().min(0),
    transit_duration_unit: z.enum(TimeUnit),
    transit_depth_value: z.number().min(0),
    transit_depth_error: z.number().min(0),
});


export const candidateParams = z.object({
    mass_value: z.number().min(0),
    mass_error: z.number().min(0),
    mass_unit: z.nativeEnum(MassUnit),
    radius_value: z.number().min(0),
    radius_error: z.number().min(0),
    radius_unit: z.nativeEnum(RadiusUnit),
});


export const starParams = z.object({
    effective_temperature_value: z.number().min(0),
    effective_temperature_error: z.number().min(0),
    effective_temperature_unit: z.nativeEnum(TemperatureUnit),
    mass_value: z.number().min(0),
    mass_error: z.number().min(0),
    mass_unit: z.nativeEnum(MassUnit),
    radius_value: z.number().min(0),
    radius_error: z.number().min(0),
    radius_unit: z.nativeEnum(RadiusUnit),
});

export const registerPredictionSchema = z.object({
    description: z.string().min(7, "A descrição precisa ter no mínimo 3 caracteres."),
    probability: z.number().min(0).max(1),
    classification: z.enum(['POSITIVE', 'NEGATIVE', 'FALSE_POSITIVE', 'FALSE_NEGATIVE','CONFIRMED']),  
    createdAt: z.date().optional(),
    starParams: starParams,
    candidateParams: candidateParams,
    signalParams: signalParams,
    userId: z.string().uuid(),

});

export const viewPredictionSchema = z.object({
    id: z.string().uuid(),
    description: z.string(),
    probability: z.number(),
    classification: z.string(),
    createdAt: z.date(),
    mass_value: z.number(),
    mass_unit: z.string(),
    radius_value: z.number(),
    radius_unit: z.string(),
    transit_duration_value: z.number(),
    transit_duration_unit: z.string(),
    orbital_period_value: z.number(),
    orbital_period_unit: z.string(),


})

const measurementValueAndError = z.object({
  value: z.number(),
  error: z.number(),
});

const measurementValueAndErrorAndUnit = z.object({
  value: z.number(),
  error: z.number(),
  unit: z.string(),
});



export const formattedPredictionDTOSchema = z.object({
    id: z.string().uuid(),
    description: z.string(),
    probability: z.number(),
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
 
};

export function formatPredictionByViewSchema(prediction: any): ViewPredictionDTO {
  const predictionDTO: ViewPredictionDTO = {
    id: prediction.id,
    description: prediction.description,
    probability: prediction.probability,
    classification: prediction.classification,
    createdAt: prediction.createdAt,
    mass_value: prediction.candidateParams.mass_value,
    mass_unit: prediction.candidateParams.mass_unit,
    radius_value: prediction.candidateParams.radius_value,
    radius_unit: prediction.candidateParams.radius_unit,
    transit_duration_value: prediction.signalParams.transit_duration_value,
    transit_duration_unit: prediction.signalParams.transit_duration_unit,
    orbital_period_value: prediction.signalParams.orbital_period_value,
    orbital_period_unit: prediction.signalParams.orbital_period_unit,
  };
  return predictionDTO;
}



export function formatPredictionForResponse(prediction: PredictionWithFlatParams): FormattedPredictionDTO {
  const predictionDTO: FormattedPredictionDTO = {
    id: prediction.id,
    description: prediction.description,
    probability: prediction.probability,
    classification: prediction.classification,
    createdAt: prediction.createdAt,
    star_params: {
      mass: {
        value: prediction.starParams.mass_value,
        error: prediction.starParams.mass_error,
        unit: prediction.starParams.mass_unit,
      },
      radius: {
        value: prediction.starParams.radius_value,
        error: prediction.starParams.radius_error,
        unit: prediction.starParams.radius_unit,
      },
      effective_temperature: {
        value: prediction.starParams.effective_temperature_value,
            error: prediction.starParams.effective_temperature_error,
        unit: prediction.starParams.effective_temperature_unit,
      },
    },
    candidate_params: {
      mass: {
        value: prediction.candidateParams.mass_value,
        error: prediction.candidateParams.mass_error,
        unit: prediction.candidateParams.mass_unit,
      },
      radius: {
        value: prediction.candidateParams.radius_value,
        error: prediction.candidateParams.radius_error,
        unit: prediction.candidateParams.radius_unit,
      },
    },
    signal_params: {
      orbital_period: {
        value: prediction.signalParams.orbital_period_value,
        error: prediction.signalParams.orbital_period_error,
        unit: prediction.signalParams.orbital_period_unit,
      },
      transit_duration: {
        value: prediction.signalParams.transit_duration_value,
        error: prediction.signalParams.transit_duration_error,
        unit: prediction.signalParams.transit_duration_unit,
      },
      transit_depth: {
        value: prediction.signalParams.transit_depth_value,
        error: prediction.signalParams.transit_depth_error,
      },
      impact_parameter: {
        value: prediction.signalParams.impact_parameter_value,
        error: prediction.signalParams.impact_parameter_error,
      },
    },
  };

  return predictionDTO;
}

export type RegisterPredicitionDTO = z.infer<typeof registerPredictionSchema>;
export type SignalParams = z.infer<typeof signalParams>;
export type CandidateParams = z.infer<typeof candidateParams>;
export type StarParams = z.infer<typeof starParams>;
export type FormattedPredictionDTO = z.infer<typeof formattedPredictionDTOSchema>;
export type ViewPredictionDTO = z.infer<typeof viewPredictionSchema>;