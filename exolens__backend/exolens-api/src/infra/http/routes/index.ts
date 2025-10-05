
import { Router } from 'express';
import { userRoutes } from './user.routes';

import { predictionRoutes } from './prediction.routes';
import { exoplanetRoutes } from './exoplanet.routes';
const routes = Router();

routes.use('/users', userRoutes);
routes.use('/predictions', predictionRoutes);
routes.use('/exoplanets', exoplanetRoutes);

export { routes };