import express, { Request, Response, NextFunction } from 'express';
import { PredictionController } from '../../../app/controllers/PredictionController';
import { PredictionService } from '../../../app/services/PredictionService';
import { PredictionRepository } from './../../../app/repositories/PredicitionRepository';
const predictionRoutes = express.Router();

import { authMiddleware } from '../middlewares/authMiddleware';

const predictionRepository = new PredictionRepository();
const predictionController = new PredictionController(new PredictionService(predictionRepository));

/**
 * @swagger
 * components:
 *   schemas:
 *     PredictionParams:
 *       type: object
 *       properties:
 *         value:
 *           type: number
 *           example: 1.0
 *         error:
 *           type: number
 *           example: 0.1
 *         unit:
 *           type: string
 *           example: "Solar Mass"
 *
 *     RegisterPredictionInput:
 *       type: object
 *       required:
 *         - description
 *         - probability
 *         - classification
 *       properties:
 *         description:
 *           type: string
 *           description: A description for the prediction.
 *           example: "Kepler-186 f candidate"
 *         probability:
 *           type: number
 *           format: float
 *           description: The probability of the prediction being correct (0 to 1).
 *           example: 0.95
 *         classification:
 *           type: string
 *           enum: [POSITIVE, NEGATIVE, FALSE_POSITIVE, FALSE_NEGATIVE, CONFIRMED]
 *           example: "CONFIRMED"
 *         starParams:
 *           $ref: '#/components/schemas/StarParams'
 *         candidateParams:
 *           $ref: '#/components/schemas/CandidateParams'
 *         signalParams:
 *           $ref: '#/components/schemas/SignalParams'
 *
 *     ViewPrediction:
 *       type: object
 *       properties:
 *         description:
 *           type: string
 *         probability:
 *           type: number
 *         classification:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         mass_value:
 *           type: number
 *         mass_unit:
 *           type: string
 *         radius_value:
 *           type: number
 *         radius_unit:
 *           type: string
 *         transit_duration_value:
 *           type: number
 *         transit_duration_unit:
 *           type: string
 *     PredictionResponse:
 *       type: object
 *       properties:
 *         star_params:
 *           type: object
 *           properties:
 *             mass:
 *               $ref: '#/components/schemas/PredictionParams'
 *             radius:
 *               $ref: '#/components/schemas/PredictionParams'
 *             effective_temperature:
 *               $ref: '#/components/schemas/PredictionParams'
 *         candidate_params:
 *           type: object
 *           properties:
 *             mass:
 *               $ref: '#/components/schemas/PredictionParams'
 *             radius:
 *               $ref: '#/components/schemas/PredictionParams'
 *         signal_params:
 *           type: object
 *           properties:
 *             orbital_period:
 *               $ref: '#/components/schemas/PredictionParams'
 *             transit_duration:
 *               $ref: '#/components/schemas/PredictionParams'
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/predictions/register:
 *   post:
 *     summary: Register a new prediction for the authenticated user
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterPredictionInput'
 *     responses:
 *       201:
 *         description: Prediction registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PredictionResponse'
 *       401:
 *         description: Unauthorized. Token is missing or invalid.
 */
predictionRoutes.post('/register', authMiddleware, (req: Request, res: Response, next: NextFunction) => predictionController.register(req, res, next));

/**
 * @swagger
 * /api/predictions/{id}:
 *   get:
 *     summary: Get a specific prediction by its ID
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the prediction to retrieve.
 *     responses:
 *       200:
 *         description: Prediction data retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PredictionResponse'
 *       401:
 *         description: Unauthorized. Token is missing or invalid.
 *       404:
 *         description: Prediction not found.
 */
predictionRoutes.get('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => predictionController.getById(req, res, next));

/**
 * @swagger
 * /api/predictions:
 *   get:
 *     summary: Get all predictions for the authenticated user
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of the user's predictions.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ViewPrediction'
 *       401:
 *         description: Unauthorized. Token is missing or invalid.
 *       404:
 *         description: No predictions found for this user.
 */
predictionRoutes.get('/', authMiddleware, (req: Request, res: Response, next: NextFunction) => predictionController.getAllByUserId(req, res, next));
export { predictionRoutes };
