import { RegisterPredicitionDTO, FormattedPredictionDTO, formatPredictionForResponse, formatPredictionByViewSchema } from '../validators/predictionValidator';
import { NotFoundError, BadRequestError } from '../../core/errors/AppError';
import { PredictionRepository } from './../repositories/PredicitionRepository';
import { createStarParams, createCandidateParams, createSignalParams} from '../factories/PredictionParamsFactory';
import { transformToMLInput } from '../../core/mappers/prediction.mapper';
import { parse } from 'csv-parse';
import { finished } from 'stream/promises';

interface AiModelResponse {
    explicacao_xgboost: {
        contribuicoes: number[];
        features: string[];
    };
    probabilidade_final: number[];
}

export class PredictionService {

    constructor(private predictionRepository: PredictionRepository) {}

    async registerPrediction(predictionData: RegisterPredicitionDTO) {

        const predictionToCreate = {
            ...predictionData,
            createdAt: new Date(),
            starParams: createStarParams(predictionData.starParams),
            candidateParams: createCandidateParams(predictionData.candidateParams),
            signalParams: createSignalParams(predictionData.signalParams),
            existingData: false,
        };
        return this.predictionRepository.createPrediction(predictionToCreate);
    }

 async getPredictionById(id: string) {
    const prediction = await this.predictionRepository.findById(id);

    if(!prediction) {
        throw new NotFoundError('Prediction not found');
    }
    const predictionDTO: FormattedPredictionDTO = formatPredictionForResponse(prediction as any);
       
        
    return predictionDTO;

    };


    async getAllPredictionsByUserId(userId: string) {
        const predictions = await this.predictionRepository.findAllByUserId(userId);
        if(predictions.length === 0) {
            return []
        }

        return predictions.map(prediction => formatPredictionByViewSchema(prediction as any));
    }
    
    async deletePredictionById(id: string) {
        const prediction = await this.predictionRepository.findById(id);
        if(!prediction) {
            throw new NotFoundError('Prediction not found');
        }
        await this.predictionRepository.deleteById(id);
    }

    async predictFromForm(data: RegisterPredicitionDTO, isRealData: boolean): Promise<any> {
        this._validateMinimumFeatures(data);
        
        const result = await this._callAiModel(data, isRealData);
        return result;
    }

    /**
     */
    async predictFromCsv(fileBuffer: Buffer, isRealData: boolean) {
        const records = await this._parseCsv(fileBuffer);

        const predictionPromises = records.map(async (csvRow) => {
            try {
                const predictionInput = this._mapCsvRowToRegisterPredictionDTO(csvRow);
                
                this._validateMinimumFeatures(predictionInput);
                
                return await this._callAiModel(predictionInput, isRealData);
            } catch (error: any) {
                return { error: `Falha na linha: ${JSON.stringify(csvRow)}`, details: error.message ?? 'Unknown error' };
            }
        });

        return Promise.all(predictionPromises);
    }
    

    private async _callAiModel(predictionData: RegisterPredicitionDTO, isRealData: boolean): Promise<any> {
        const mlPayload = transformToMLInput(predictionData, isRealData);

        const aiApiUrl = process.env.AI_API_URL || 'http://localhost:5001/predict';

        const response = await fetch(aiApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mlPayload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`AI model request failed with status ${response.status}: ${errorBody}`);
        }
        const aiResult = await response.json() as AiModelResponse;
        return {
            finalProbability: aiResult.probabilidade_final[0],
            featureContributions: aiResult.explicacao_xgboost,
            inputData: predictionData 
        };
    }


    private _mapCsvRowToRegisterPredictionDTO(csvRow: any): RegisterPredicitionDTO {
        
        const getVal = (key: string) => csvRow[key] ? parseFloat(csvRow[key]) : null;

        return {
            description: `Predição via CSV para objeto ${csvRow.id || 'desconhecido'}`,
            probability: 0,
            classification: 'CANDIDATE',
            userId: 'csv-upload-process',
            
            starParams: {
                effective_temperature_value: getVal('stellar_temp_k'),
                effective_temperature_unit: csvRow.stellar_temp_k ? 'K' : null,
                radius_value: getVal('stellar_radius_solar'),
                radius_unit: csvRow.stellar_radius_solar ? 'Solar Radius' : null,
                mass_value: getVal('stellar_mass_solar'),
                mass_unit: csvRow.stellar_mass_solar ? 'Solar Mass' : null,
                effective_temperature_error: null, mass_error: null, radius_error: null,
            },
            candidateParams: {
                radius_value: getVal('planet_radius_earth'),
                radius_unit: csvRow.planet_radius_earth ? 'Earth Radius' : null,
                equilibrium_temp: getVal('equilibrium_temp'),
                mass_value: null, mass_error: null, radius_error: null, mass_unit: null,
            },
            signalParams: {
                orbital_period_value: getVal('orbital_period'),
                orbital_period_unit: csvRow.orbital_period ? 'days' : null,
                transit_duration_value: getVal('transit_duration_hr'),
                transit_duration_unit: csvRow.transit_duration_hr ? 'hours' : null,
                transit_depth_value: getVal('transit_depth_ppm'),
                impact_parameter_value: getVal('impact_parameter'),
                signal_to_noise: getVal('signal_to_noise'),
                impact_parameter_error: null, orbital_period_error: null, transit_duration_error: null, transit_depth_error: null,
            }
        };
    }
    
    
    private _validateMinimumFeatures(data: RegisterPredicitionDTO): void {
        const MINIMUM_FEATURES_FOR_PREDICTION: (keyof typeof featureMap)[] = [
            'orbital_period',
            'transit_duration_hr',
            'transit_depth_ppm',
            'planet_radius_earth',
            'stellar_temp_k',
            'stellar_radius_solar',
            'stellar_mass_solar',
            'impact_parameter',
            'equilibrium_temp',
            'signal_to_noise',
        ];
        const featureMap = {
            'orbital_period': data.signalParams.orbital_period_value,
            'transit_duration_hr': data.signalParams.transit_duration_value,
            'transit_depth_ppm': data.signalParams.transit_depth_value,
            'planet_radius_earth': data.candidateParams.radius_value,
            'stellar_temp_k': data.starParams.effective_temperature_value,
            'stellar_radius_solar': data.starParams.radius_value,
            'stellar_mass_solar': data.starParams.mass_value,
            'impact_parameter': data.signalParams.impact_parameter_value,
            'equilibrium_temp': data.candidateParams.equilibrium_temp,
            'signal_to_noise': data.signalParams.signal_to_noise,
        };

        const missingFeatures = MINIMUM_FEATURES_FOR_PREDICTION.filter(
            (feature: keyof typeof featureMap) => featureMap[feature] === null || featureMap[feature] === undefined
        );

        if (missingFeatures.length > 0) {
            throw new BadRequestError(`Dados insuficientes para predição. Campos obrigatórios faltando: ${missingFeatures.join(', ')}`);
        }
    }

 
    private async _parseCsv(buffer: Buffer): Promise<any[]> {
        const records: any[] = [];
        const parser = parse({ columns: true, skip_empty_lines: true, trim: true });
        parser.on('readable', function(this: typeof parser){
            let record;
            while ((record = parser.read()) !== null) {
                records.push(record);
            }
        });
        parser.write(buffer);
        parser.end();
        await finished(parser);
        return records;
    }
}
