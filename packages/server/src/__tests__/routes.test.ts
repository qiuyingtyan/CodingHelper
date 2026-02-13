import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import { createRouter } from '../routes.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function makeTmpDir(): string {
  const dir = join(tmpdir(), `ch-routes-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function createTestApp(rootDir: string) {
  const app = express();
  app.use(express.json());
  app.use(createRouter(rootDir));
  return app;
}

async function request(app: express.Express, path: string) {
  // Use a lightweight approach: import node:http to test
  const { createServer } = await import('node:http');
  return new Promise<{ status: number; body: unknown }>((resolve, reject) => {
    const server = createServer(app);
    server.listen(0, () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') { server.close(); reject(new Error('bad addr')); return; }
      const port = addr.port;
      import('node:http').then(({ get }) => {
        get(`http://127.0.0.1:${port}${path}`, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            server.close();
            resolve({ status: res.statusCode ?? 500, body: JSON.parse(data) });
          });
        }).on('error', (err) => { server.close(); reject(err); });
      });
    });
  });
}

describe('routes', () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = makeTmpDir();
    const dir = join(rootDir, '.codinghelper');
    mkdirSync(dir, { recursive: true });
    mkdirSync(join(dir, 'tasks'), { recursive: true });
    writeFileSync(join(dir, 'config.json'), JSON.stringify({ projectName: 'test-proj' }));
    writeFileSync(join(dir, 'requirements.md'), '# Req');
    writeFileSync(join(dir, 'spec.md'), '# Spec');
    writeFileSync(join(dir, 'tasks', 'index.json'), JSON.stringify({ tasks: [], executionOrder: [] }));
  });

  it('GET /api/project returns full project data', async () => {
    const app = createTestApp(rootDir);
    const res = await request(app, '/api/project');
    expect(res.status).toBe(200);
    expect((res.body as Record<string, unknown>).config).toEqual({ projectName: 'test-proj' });
  });

  it('GET /api/config returns config', async () => {
    const app = createTestApp(rootDir);
    const res = await request(app, '/api/config');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ projectName: 'test-proj' });
  });

  it('GET /api/tasks returns task index', async () => {
    const app = createTestApp(rootDir);
    const res = await request(app, '/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ tasks: [], executionOrder: [] });
  });

  it('GET /api/spec returns spec content', async () => {
    const app = createTestApp(rootDir);
    const res = await request(app, '/api/spec');
    expect(res.status).toBe(200);
    expect((res.body as Record<string, unknown>).content).toBe('# Spec');
  });

  it('GET /api/requirements returns requirements content', async () => {
    const app = createTestApp(rootDir);
    const res = await request(app, '/api/requirements');
    expect(res.status).toBe(200);
    expect((res.body as Record<string, unknown>).content).toBe('# Req');
  });

  it('GET /api/logs returns empty array when no logs', async () => {
    const app = createTestApp(rootDir);
    const res = await request(app, '/api/logs');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /api/reviews returns only review records', async () => {
    const logsDir = join(rootDir, '.codinghelper', 'logs');
    mkdirSync(logsDir, { recursive: true });
    writeFileSync(join(logsDir, 'review-1.json'), JSON.stringify({
      taskId: 'task-001', status: 'approved', reviewer: 'user', comment: '通过', timestamp: '2024-01-01T00:00:00Z',
    }));
    writeFileSync(join(logsDir, 'debug-1.json'), JSON.stringify({
      scope: 'front', timestamp: '2024-01-01T00:00:00Z', findings: ['err'], claudeMdInstructions: 'fix',
    }));

    const app = createTestApp(rootDir);
    const res = await request(app, '/api/reviews');
    expect(res.status).toBe(200);
    const body = res.body as unknown[];
    expect(body).toHaveLength(1);
    expect((body[0] as Record<string, unknown>).status).toBe('approved');
  });

  it('GET /api/debug-logs returns only debug logs', async () => {
    const logsDir = join(rootDir, '.codinghelper', 'logs');
    mkdirSync(logsDir, { recursive: true });
    writeFileSync(join(logsDir, 'review-1.json'), JSON.stringify({
      taskId: 'task-001', status: 'approved', reviewer: 'user', comment: '通过', timestamp: '2024-01-01T00:00:00Z',
    }));
    writeFileSync(join(logsDir, 'debug-1.json'), JSON.stringify({
      scope: 'front', timestamp: '2024-01-01T00:00:00Z', findings: ['err'], claudeMdInstructions: 'fix',
    }));

    const app = createTestApp(rootDir);
    const res = await request(app, '/api/debug-logs');
    expect(res.status).toBe(200);
    const body = res.body as unknown[];
    expect(body).toHaveLength(1);
    expect((body[0] as Record<string, unknown>).scope).toBe('front');
  });
});
