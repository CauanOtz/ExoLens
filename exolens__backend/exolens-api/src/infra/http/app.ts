import express from 'express';
import type { Request, Response } from 'express';
const app = express();
import 'dotenv/config';
import { routes } from './routes';
app.use(express.json());


app.use('/api', routes);


export { app };