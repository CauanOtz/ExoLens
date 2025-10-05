import { ViewPredictionDTO, RegisterPredicitionDTO } from './../validators/predictionValidator';

export interface IExoPlanetDataSource {
  findAll(): Promise<ViewPredictionDTO[]>;  

  findById(id: string): Promise<ViewPredictionDTO | null>;
  
  save(prediction: RegisterPredicitionDTO): Promise<ViewPredictionDTO>;
  
}