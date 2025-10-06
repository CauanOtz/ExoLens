import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { PredictionController } from '../../../app/controllers/PredictionController';
import { PredictionService } from '../../../app/services/PredictionService';
import { PredictionRepository } from './../../../app/repositories/PredicitionRepository';
const predictionRoutes = express.Router();

import { authMiddleware } from '../middlewares/authMiddleware';

const upload = multer({ storage: multer.memoryStorage() });

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

/**
 * @swagger
 * /api/predictions/predict/form:
 *   post:
 *     summary: Executes a prediction from structured JSON data
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     description: Sends a JSON object with the system parameters to receive a single prediction from the AI model.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterPredictionInput'
 *     responses:
 *       '200':
 *         description: Prediction successfully executed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIPredictionResponse'
 *       '400':
 *         description: Insufficient data for prediction or invalid request body.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
predictionRoutes.post(
    "/predict/form", 
    authMiddleware,
    (req: Request, res: Response, next: NextFunction) => predictionController.predictFromForm(req, res, next)
);
/**
 * @swagger
 * /api/predictions/predict/csv:
 *   post:
 *     summary: Executes batch predictions from a CSV file
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     description: Upload a CSV file to process multiple predictions at once. The first line of the file must contain the column headers (features).
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               predictionFile:
 *                 type: string
 *                 format: binary
 *                 description: "CSV file containing the data rows for prediction."
 *     responses:
 *       '200':
 *         description: Batch predictions successfully executed. Returns an array with the results for each row.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AIPredictionResponse'
 *       '400':
 *         description: "Invalid request. No file was uploaded or the file is malformed."
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
predictionRoutes.post(
    "/predict/csv", 
    authMiddleware,
    upload.single('predictionFile'), 
    (req: Request, res: Response, next: NextFunction) => predictionController.predictFromCsv(req, res, next)
);



export { predictionRoutes };