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
            // Log a compact snapshot of the JSON payload sent from the frontend
            try {
              const preview = JSON.stringify(req.body);
              console.log(`[AI FORM] Received payload (isRealData=${isRealData}) from user=${req.user?.id ?? 'n/a'} ->`, preview);
            } catch {}
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
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
            }
            const isRealData = req.query.isRealData === 'true';

            // --- Logging of incoming CSV payload from frontend ---
            try {
                const text = req.file.buffer.toString('utf8');
                const lines = text.split(/\r?\n/);
                const header = (lines[0] || '').trim();
                const sampleRows = lines.slice(1, Math.min(lines.length, 6)).filter(Boolean);
                const headerCols = header ? header.split(',').length : 0;
                console.log(`[AI CSV] Received file from user=${userId} isRealData=${isRealData} size=${req.file.size}B type=${req.file.mimetype} name=${req.file.originalname || 'blob'}`);
                console.log(`[AI CSV] Header (${headerCols} cols): ${header}`);
                if (sampleRows.length) {
                  console.log(`[AI CSV] First ${sampleRows.length} row(s):`);
                  for (const r of sampleRows) {
                    const cols = r.split(',').length;
                    const mismatch = headerCols && cols !== headerCols ? ` [MISMATCH header=${headerCols} vs row=${cols}]` : '';
                    console.log(`${r}${mismatch}`);
                  }
                } else {
                  console.log('[AI CSV] No data rows found after header.');
                }
                // Log extra form fields (e.g., kepid and errors) sent along with the file
                if (req.body && Object.keys(req.body).length) {
                  const { kepid, transition_depth_error, impact_parameter_error, planet_id, ...rest } = req.body as any;
                  console.log('[AI CSV] Meta fields:', {
                    kepid: kepid ?? null,
                    transition_depth_error: transition_depth_error ?? null,
                    impact_parameter_error: impact_parameter_error ?? null,
                    planet_id: planet_id ?? null,
                    extra: Object.keys(rest).length ? rest : undefined,
                  });
                }
            } catch (e) {
                console.warn('[AI CSV] Failed to log CSV preview:', (e as Error)?.message);
            }
            // --- End logging ---

            const results = await this.predictionService.predictFromCsv(
              req.file.buffer,
              isRealData,
              userId,
              req.body && Object.keys(req.body).length ? (req.body as any) : undefined,
            );
            return res.status(200).json(results);
        } catch (error) {
            next(error);
        }
    }

}