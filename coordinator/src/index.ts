import express from 'express';
import cors from 'cors';
import { Config } from '@vector-flow/config';
import { routes } from './server/routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use('/api', routes);

const port = Config.PORT;

app.listen(port, () => {
  console.log(`🚀 VectorFlow Coordinator listening on port ${port}`);
});
