import { Router, Request, Response, NextFunction } from "express";
import { ExoPlanetApiDataSource } from "../../../app/datasources/ExoPlanetApi.datasource";
import { PredictionRepository } from "../../../app/repositories/PredicitionRepository";
import { ExoPlanetController } from "../../../app/controllers/ExoPlanetController";
import { authMiddleware } from "../middlewares/authMiddleware";

const predictionRepository = new PredictionRepository();
const exoPlanetController = new ExoPlanetController(
  new ExoPlanetApiDataSource(predictionRepository)
);
const exoplanetRoutes = Router();


/**
 * @swagger
 * tags:
 *   - name: Exoplanets
 *     description: NASA Exoplanet Archive integration
 */

/**
 * @swagger
 * /api/exoplanets:
 *   get:
 *     summary: Lists all exoplanets from the NASA archive
 *     tags: [Exoplanets]
 *     description: Returns a list of formatted exoplanets from NASA's public archive.
 *     responses:
 *       200:
 *         description: Success. Returns a list of exoplanets.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Internal server error.
 *   post:
 *     summary: Creates a new exoplanet prediction
 *     tags: [Exoplanets]
 *     description: Registers a new exoplanet prediction in the database. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               probability:
 *                 type: number
 *               classification:
 *                 type: string
 *             example:
 *               description: "My new candidate"
 *               probability: 0.95
 *               classification: "CANDIDATE"
 *     responses:
 *       201:
 *         description: Prediction created successfully.
 *       400:
 *         description: Invalid request (validation error).
 *       401:
 *         description: Unauthorized (token is missing or invalid).
 *       500:
 *         description: Internal server error.
 */
exoplanetRoutes.get("/", (req: Request, res: Response, next: NextFunction) =>
  exoPlanetController.getAll(req, res, next)
);

exoplanetRoutes.post(
  "/",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) =>
    exoPlanetController.createExoPlanetPrediction(req, res, next)
);

/**
 * @swagger
 * /api/exoplanets/{id}:
 *   get:
 *     summary: Finds an exoplanet by its ID (name)
 *     tags: [Exoplanets]
 *     description: Returns the data of a single exoplanet based on its name (e.g., "Kepler-22 b").
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID (name) of the exoplanet to find.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success. Returns the exoplanet data.
 *       404:
 *         description: Exoplanet not found.
 *       500:
 *         description: Internal server error.
 */
exoplanetRoutes.get("/:id", (req: Request, res: Response, next: NextFunction) =>
  exoPlanetController.getById(req, res, next)
);

export {exoplanetRoutes};