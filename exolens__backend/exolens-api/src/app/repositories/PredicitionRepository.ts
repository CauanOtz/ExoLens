import { PrismaClient, Prediction } from "@prisma/client";


const prisma = new PrismaClient();

export class PredictionRepository {


    async createPrediction(predictionData: Omit<Prediction, 'id'>): Promise<Prediction> {
        const newPrediction = await prisma.prediction.create({
            data: {
                ...predictionData,
                starParams: predictionData.starParams as any, 
                candidateParams: predictionData.candidateParams as any, 
                signalParams: predictionData.signalParams as any 
            },
        });
        return newPrediction;
       
    }

    async findById(id: string): Promise<Prediction | null> {
        return prisma.prediction.findUnique({ where: { id } });
    }

    async findAllByUserId(userId: string): Promise<Prediction[]> {
        return prisma.prediction.findMany({ where: { userId } });
    }
    
    async deleteById(id: string): Promise<void> {
        await prisma.prediction.delete({ where: { id } });
    }


}