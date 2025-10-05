
import { ExoPlanetApiDataSource } from "../datasources/ExoPlanetApi.datasource";
import { Request, Response, NextFunction } from 'express';
import { registerPredictionSchema } from "../validators/predictionValidator";
import { ZodError } from "zod";

export class ExoPlanetController {
    constructor(private exoPlanetApiDataSource: ExoPlanetApiDataSource) {}

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const exoplanets = await this.exoPlanetApiDataSource.findAll();
            return res.status(200).json(exoplanets);
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {

            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: "Missing exoplanet ID in request parameters." });
            }
            const exoplanet = await this.exoPlanetApiDataSource.findById(id);

            if (!exoplanet) {
           
                return res.status(404).json({ message: `Exoplanet with ID '${id}' not found` });
            }

            return res.status(200).json(exoplanet);
        } catch (error) {
            next(error);
        }
    }
   
    
    async searchExoPlanets(req: Request, res: Response, next: NextFunction) {
        try {
            const { query } = req.query;
            if (!query || typeof query !== 'string') {
                return res.status(400).json({ message: "Missing or invalid 'query' parameter." });
            }
            const results = await this.exoPlanetApiDataSource.searchExoPlanets(query);
            return res.status(200).json(results);
        } catch (error) {
            next(error);
        }
    }

    async createExoPlanetPrediction(req: Request, res: Response, next: NextFunction) {
        try {

            const planetId = req.params.id;
            if (!planetId) {
                return res.status(400).json({ message: "Missing exoplanet ID in request parameters." });
            }
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
            }
            
            const newPrediction = await this.exoPlanetApiDataSource.saveExoPlanetById(planetId, userId);
            return res.status(201).json(newPrediction);

        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    message: "Invalid request body.",
                    errors: error.flatten().fieldErrors,
                });
            }
            next(error);
        }
    }
}