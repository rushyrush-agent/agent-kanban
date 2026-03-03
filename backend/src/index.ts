import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import fs from 'fs';

import { initSocket } from './socket';
import tasksRouter from './routes/tasks';
import commentsRouter from './routes/comments';

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8444;

app.use(cors());
app.use(express.json());

const dataDir = '/app/data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

initSocket(httpServer);

app.use('/api/tasks', tasksRouter);
app.use('/api/tasks', commentsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Task Dashboard API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;