import express, { Request, Response, NextFunction } from "express";
import { ExoPlanetController } from "../../../app/controllers/ExoPlanetController";
import { ExoPlanetApiDataSource } from "../../../app/datasources/ExoPlanetApi.datasource";
import { PredictionRepository } from "../../../app/repositories/PredicitionRepository";
import { authMiddleware } from "../middlewares/authMiddleware";

const exoplanetRoutes = express.Router();

const predictionRepository = new PredictionRepository();
const exoPlanetApiDataSource = new ExoPlanetApiDataSource(predictionRepository);
const exoPlanetController = new ExoPlanetController(exoPlanetApiDataSource);

/**
 * @swagger
 * /api/exoplanets:
 *   get:
 *     summary: Get all exoplanets from NASA Exoplanet Archive
 *     tags: [Exoplanets]
 *     responses:
 *       200:
 *         description: List of exoplanets retrieved successfully.
 */
exoplanetRoutes.get("/", (req: Request, res: Response, next: NextFunction) =>
  exoPlanetController.getAll(req, res, next)
);

/**
 * @swagger
 * /api/exoplanets/{id}:
 *   get:
 *     summary: Get an exoplanet by its Kepler name
 *     tags: [Exoplanets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kepler name of the exoplanet.
 *     responses:
 *       200:
 *         description: Exoplanet retrieved successfully.
 *       404:
 *         description: Exoplanet not found.
 */
exoplanetRoutes.get("/:id", (req: Request, res: Response, next: NextFunction) =>
  exoPlanetController.getById(req, res, next)
);

/**
 * @swagger
 * /api/exoplanets/{id}:
 *   post:
 *     summary: Save an existing exoplanet as a user prediction
 *     tags: [Exoplanets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kepler name of the exoplanet to associate with the logged user.
 *     responses:
 *       201:
 *         description: Exoplanet prediction created successfully for the authenticated user.
 *       400:
 *         description: Missing or invalid parameters.
 *       401:
 *         description: Unauthorized. Token missing or invalid.
 *       404:
 *         description: Exoplanet not found in NASA Archive.
 */
exoplanetRoutes.post(
  "/:id",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) =>
    exoPlanetController.createExoPlanetPrediction(req, res, next)
); // async searchExoPlanets(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         const { query } = req.query;
    //         if (!query || typeof query !== 'string') {
    //             return res.status(400).json({ message: "Missing or invalid 'query' parameter." });
    //         }
    //         const results = await this.exoPlanetApiDataSource.searchExoPlanets(query);
    //         return res.status(200).json(results);
    //     } catch (error) {
    //         next(error);
    //     }
    // }

/**
 * @swagger
 * /api/exoplanets/search:
 *   get:
 *     summary: Search exoplanets by name
 *     tags: [Exoplanets]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term to match against exoplanet names.
 *     responses:
 *       200:
 *         description: List of exoplanets matching the search term.
 *       400:
 *         description: Missing or invalid 'query' parameter.
 */
exoplanetRoutes.get("/search", (req: Request, res: Response, next: NextFunction) =>
  exoPlanetController.searchExoPlanets(req, res, next)
);


export { exoplanetRoutes };
