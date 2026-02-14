import express from 'express';
import cors from 'cors';
import { createRouter } from './routes.js';

export interface ServerOptions {
  rootDir: string;
  port?: number;
  staticDir?: string;
}

export function createServer(options: ServerOptions) {
  const { rootDir, port = 3120, staticDir } = options;
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(createRouter(rootDir));

  // Serve dashboard static files if provided
  if (staticDir) {
    app.use(express.static(staticDir));
    // SPA fallback
    app.get('*', (_req, res) => {
      res.sendFile('index.html', { root: staticDir });
    });
  }

  return {
    app,
    start: () =>
      new Promise<void>((resolve) => {
        app.listen(port, () => {
          resolve();
        });
      }),
    port,
  };
}

export { readProjectData } from './dataReader.js';
export { createRouter } from './routes.js';
export {
  actionGenerateRequirements,
  actionGenerateSpec,
  actionSplitTasks,
} from './actions.js';
