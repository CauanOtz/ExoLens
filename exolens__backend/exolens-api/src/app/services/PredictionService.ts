import { RegisterPredicitionDTO, FormattedPredictionDTO, formatPredictionForResponse, formatPredictionByViewSchema } from '../validators/predictionValidator';
import { NotFoundError } from '../../core/errors/AppError';
import { get } from 'http';
import { PredictionRepository } from './../repositories/PredicitionRepository';
import { createStarParams, createCandidateParams, createSignalParams} from '../factories/PredictionParamsFactory';
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
            throw new NotFoundError('No predictions found for this user');
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
}
