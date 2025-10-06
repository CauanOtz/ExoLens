import { ViewPredictionDTO } from './../validators/predictionValidator';

export interface IExoPlanetDataSource {
  findAll(): Promise<ViewPredictionDTO[]>;  

  findById(id: string): Promise<ViewPredictionDTO | null>;

  searchExoPlanets(query: string): Promise<ViewPredictionDTO[]>;
  
  saveExoPlanetById(planetId: string, userId: string): Promise<ViewPredictionDTO>;
  
}