import { Request, Response, NextFunction } from 'express';
import { PredictionService } from '../services/PredictionService';
import { registerPredictionSchema } from '../validators/predictionValidator';
import { BadRequestError } from '../../core/errors/AppError';

export class PredictionController {

  constructor(private predictionService: PredictionService) {}

    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
            }
            req.body.userId = userId;
            const newPrediction = await this.predictionService.registerPrediction(req.body);
            return res.status(201).json(newPrediction);
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            if(!id) {
                return res.status(400).json({ message: 'ID is required' });
            }
         
     
            const prediction = await this.predictionService.getPredictionById(id);

            return res.status(200).json(prediction);
        } catch (error) {
            next(error);
        }
    }
    async getAllByUserId(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
            }
            const predictions = await this.predictionService.getAllPredictionsByUserId(userId);
            return res.status(200).json(predictions);
        } catch (error) {
            next(error);
        }
    }
    async deleteById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: predictionId } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            if (!predictionId) {
                return res.status(400).json({ message: 'Prediction ID is required.' });
            }

            const prediction = await this.predictionService.getPredictionById(predictionId);

            if (prediction.userId !== userId) {
                return res.status(403).json({ message: 'Forbidden: You can only delete your own predictions.' });
            }

            await this.predictionService.deletePredictionById(predictionId);
            return res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
      async predictFromForm(req: Request, res: Response, next: NextFunction) {
        try {
            const isRealData = req.query.isRealData === 'true';
            const predictionInput = registerPredictionSchema.parse(req.body);
            const result = await this.predictionService.predictFromForm(predictionInput, isRealData);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async predictFromCsv(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.file) {
                throw new BadRequestError('Nenhum arquivo CSV foi enviado.');
            }
            const isRealData = req.query.isRealData === 'true';
            const results = await this.predictionService.predictFromCsv(req.file.buffer, isRealData);
            return res.status(200).json(results);
        } catch (error) {
            next(error);
        }
    }

}