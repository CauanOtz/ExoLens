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
predictionRoutes.post(
  "/register",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) =>
    predictionController.register(req, res, next)
);

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
predictionRoutes.get(
  "/:id",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) =>
    predictionController.getById(req, res, next)
);

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
predictionRoutes.get(
  "/",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) =>
    predictionController.getAllByUserId(req, res, next)
);

/**
 * @swagger
 * /api/predictions/{id}:
 *   delete:
 *     summary: Delete a specific prediction by its ID
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
 *         description: The ID of the prediction to delete.
 *     responses:
 *       204:
 *         description: Prediction deleted successfully.
 *       401:
 *         description: Unauthorized. Token is missing or invalid.
 *       404:
 *         description: Prediction not found.
 */
predictionRoutes.delete(
  "/:id",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) =>
    predictionController.deleteById(req, res, next)
);

export { predictionRoutes };