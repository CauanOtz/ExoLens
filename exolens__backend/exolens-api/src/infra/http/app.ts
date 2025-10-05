import express from 'express';
import type { Request, Response } from 'express';
const app = express();
import 'dotenv/config';
import { routes } from './routes';
app.use(express.json());


app.use('/api', routes);

app.get('/', (req: Request, res: Response) => {
  return res.status(200).json({ message: 'Hello, World!' });
});

export { app };