import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const CODINGHELPER_DIR = '.codinghelper';

export interface ProjectData {
  config: Record<string, unknown> | null;
  requirements: string | null;
  spec: string | null;
  tasks: Record<string, unknown> | null;
  logs: string[];
}

async function readJsonSafe(path: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readTextSafe(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

export async function readProjectData(rootDir: string): Promise<ProjectData> {
  const dir = join(rootDir, CODINGHELPER_DIR);

  const [config, requirements, spec, tasks] = await Promise.all([
    readJsonSafe(join(dir, 'config.json')),
    readTextSafe(join(dir, 'requirements.md')),
    readTextSafe(join(dir, 'spec.md')),
    readJsonSafe(join(dir, 'tasks', 'index.json')),
  ]);

  // Collect log files
  const logsDir = join(dir, 'logs');
  const logs: string[] = [];
  if (existsSync(logsDir)) {
    const { readdirSync } = await import('node:fs');
    const files = readdirSync(logsDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const content = await readTextSafe(join(logsDir, file));
      if (content) logs.push(content);
    }
  }

  return { config, requirements, spec, tasks, logs };
}
