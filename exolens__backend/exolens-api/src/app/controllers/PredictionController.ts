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



}