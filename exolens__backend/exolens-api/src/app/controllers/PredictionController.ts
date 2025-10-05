import { Request, Response, NextFunction } from 'express';
import { PredictionService } from '../services/PredictionService';

export class PredictionController {

  constructor(private PredictionService: PredictionService) {}

    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new Error('User ID not found on authenticated request.');
            }
            req.body.userId = userId;
            const newPrediction = await this.PredictionService.registerPrediction(req.body);
            return res.status(201).json(newPrediction);
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            if(!id) {
                throw new Error('ID is required');
            }
         
            const prediction = await this.PredictionService.getPredictionById(id);

            return res.status(200).json(prediction);
        } catch (error) {
            next(error);
        }
    }
    async getAllByUserId(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new Error('User ID not found on authenticated request.');
            }
            const predictions = await this.PredictionService.getAllPredictionsByUserId(userId);
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

            const prediction = await this.PredictionService.getPredictionById(predictionId);

            if (prediction.userId !== userId) {
                return res.status(403).json({ message: 'Forbidden: You can only delete your own predictions.' });
            }

            await this.PredictionService.deletePredictionById(predictionId);
            return res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

}