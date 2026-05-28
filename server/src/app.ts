import express from 'express';
import cors from 'cors';
import path from 'path';
import { initLocalDb } from './utils/localDb';
import { closeAllPools } from './utils/db';
import environmentsRouter from './routes/environments';
import indicatorsRouter from './routes/indicators';
import projectsRouter from './routes/projects';
import dashboardRouter from './routes/dashboard';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/environments', environmentsRouter);
app.use('/api/indicators', indicatorsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const clientDistPath = path.join(__dirname, '..', 'client');
app.use(express.static(clientDistPath));
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

export { app, initLocalDb, closeAllPools };
