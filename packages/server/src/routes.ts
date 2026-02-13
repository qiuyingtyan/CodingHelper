import { Router, type Request, type Response } from 'express';
import { readProjectData } from './dataReader.js';

export function createRouter(rootDir: string): Router {
  const router = Router();

  router.get('/api/project', async (_req: Request, res: Response) => {
    try {
      const data = await readProjectData(rootDir);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to read project data' });
    }
  });

  router.get('/api/config', async (_req: Request, res: Response) => {
    try {
      const data = await readProjectData(rootDir);
      res.json(data.config ?? {});
    } catch {
      res.status(500).json({ error: 'Failed to read config' });
    }
  });

  router.get('/api/tasks', async (_req: Request, res: Response) => {
    try {
      const data = await readProjectData(rootDir);
      res.json(data.tasks ?? { tasks: [], executionOrder: [] });
    } catch {
      res.status(500).json({ error: 'Failed to read tasks' });
    }
  });

  router.get('/api/spec', async (_req: Request, res: Response) => {
    try {
      const data = await readProjectData(rootDir);
      res.json({ content: data.spec ?? '' });
    } catch {
      res.status(500).json({ error: 'Failed to read spec' });
    }
  });

  router.get('/api/requirements', async (_req: Request, res: Response) => {
    try {
      const data = await readProjectData(rootDir);
      res.json({ content: data.requirements ?? '' });
    } catch {
      res.status(500).json({ error: 'Failed to read requirements' });
    }
  });

  router.get('/api/logs', async (_req: Request, res: Response) => {
    try {
      const data = await readProjectData(rootDir);
      const parsed = data.logs.map(l => {
        try { return JSON.parse(l); } catch { return l; }
      });
      res.json(parsed);
    } catch {
      res.status(500).json({ error: 'Failed to read logs' });
    }
  });

  router.get('/api/reviews', async (_req: Request, res: Response) => {
    try {
      const data = await readProjectData(rootDir);
      const reviews = data.logs
        .map(l => { try { return JSON.parse(l); } catch { return null; } })
        .filter((l): l is Record<string, unknown> => l !== null && typeof l === 'object' && 'status' in l && 'reviewer' in l);
      res.json(reviews);
    } catch {
      res.status(500).json({ error: 'Failed to read reviews' });
    }
  });

  router.get('/api/debug-logs', async (_req: Request, res: Response) => {
    try {
      const data = await readProjectData(rootDir);
      const debugLogs = data.logs
        .map(l => { try { return JSON.parse(l); } catch { return null; } })
        .filter((l): l is Record<string, unknown> => l !== null && typeof l === 'object' && 'scope' in l && 'findings' in l);
      res.json(debugLogs);
    } catch {
      res.status(500).json({ error: 'Failed to read debug logs' });
    }
  });

  return router;
}
