
import { Router } from 'express';
import { userRoutes } from './user.routes';

import { predictionRoutes } from './prediction.routes';
const routes = Router();

routes.use('/users', userRoutes);
routes.use('/predictions', predictionRoutes);

export { routes };