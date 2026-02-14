import { Router, type Request, type Response } from 'express';
import {
  readProjectData,
  readConfig,
  readTasks,
  readSpec,
  readRequirements,
  readLogs,
} from './dataReader.js';
import {
  actionGenerateRequirements,
  actionGenerateSpec,
  actionSplitTasks,
} from './actions.js';

export function createRouter(rootDir: string): Router {
  const router = Router();

  router.get('/api/project', async (_req: Request, res: Response) => {
    try {
      const data = await readProjectData(rootDir);
      res.json(data);
    } catch {
      res.status(500).json({ error: 'Failed to read project data' });
    }
  });

  router.get('/api/config', async (_req: Request, res: Response) => {
    try {
      const config = await readConfig(rootDir);
      res.json(config ?? {});
    } catch {
      res.status(500).json({ error: 'Failed to read config' });
    }
  });

  router.get('/api/tasks', async (_req: Request, res: Response) => {
    try {
      const tasks = await readTasks(rootDir);
      res.json(tasks ?? { tasks: [], executionOrder: [] });
    } catch {
      res.status(500).json({ error: 'Failed to read tasks' });
    }
  });

  router.get('/api/spec', async (_req: Request, res: Response) => {
    try {
      const spec = await readSpec(rootDir);
      res.json({ content: spec ?? '' });
    } catch {
      res.status(500).json({ error: 'Failed to read spec' });
    }
  });

  router.get('/api/requirements', async (_req: Request, res: Response) => {
    try {
      const requirements = await readRequirements(rootDir);
      res.json({ content: requirements ?? '' });
    } catch {
      res.status(500).json({ error: 'Failed to read requirements' });
    }
  });

  router.get('/api/logs', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;
      const logs = await readLogs(rootDir, { limit, offset });
      const parsed = logs.map(l => {
        try { return JSON.parse(l); } catch { return l; }
      });
      res.json(parsed);
    } catch {
      res.status(500).json({ error: 'Failed to read logs' });
    }
  });

  router.get('/api/reviews', async (_req: Request, res: Response) => {
    try {
      const logs = await readLogs(rootDir);
      const reviews = logs
        .map(l => { try { return JSON.parse(l); } catch { return null; } })
        .filter((l): l is Record<string, unknown> => l !== null && typeof l === 'object' && 'status' in l && 'reviewer' in l);
      res.json(reviews);
    } catch {
      res.status(500).json({ error: 'Failed to read reviews' });
    }
  });

  router.get('/api/debug-logs', async (_req: Request, res: Response) => {
    try {
      const logs = await readLogs(rootDir);
      const debugLogs = logs
        .map(l => { try { return JSON.parse(l); } catch { return null; } })
        .filter((l): l is Record<string, unknown> => l !== null && typeof l === 'object' && 'scope' in l && 'findings' in l);
      res.json(debugLogs);
    } catch {
      res.status(500).json({ error: 'Failed to read debug logs' });
    }
  });

  // --- POST routes: workflow actions ---

  router.post('/api/generate-requirements', async (req: Request, res: Response) => {
    try {
      const { requirements, config } = req.body;
      if (!requirements || !config) {
        res.status(400).json({ error: 'Missing requirements or config' });
        return;
      }
      const result = await actionGenerateRequirements(rootDir, { requirements, config });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate requirements', detail: String(err) });
    }
  });

  router.post('/api/generate-spec', async (req: Request, res: Response) => {
    try {
      const { requirements, config } = req.body;
      if (!requirements || !config) {
        res.status(400).json({ error: 'Missing requirements or config' });
        return;
      }
      const result = await actionGenerateSpec(rootDir, { requirements, config });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate spec', detail: String(err) });
    }
  });

  router.post('/api/split-tasks', async (req: Request, res: Response) => {
    try {
      const { requirements, config } = req.body;
      if (!requirements || !config) {
        res.status(400).json({ error: 'Missing requirements or config' });
        return;
      }
      const result = await actionSplitTasks(rootDir, { requirements, config });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to split tasks', detail: String(err) });
    }
  });

  return router;
}