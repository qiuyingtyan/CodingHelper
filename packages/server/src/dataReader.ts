import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

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

function helperDir(rootDir: string): string {
  return join(rootDir, CODINGHELPER_DIR);
}

export async function readConfig(rootDir: string): Promise<Record<string, unknown> | null> {
  return readJsonSafe(join(helperDir(rootDir), 'config.json'));
}

export async function readTasks(rootDir: string): Promise<Record<string, unknown> | null> {
  return readJsonSafe(join(helperDir(rootDir), 'tasks', 'index.json'));
}

export async function readSpec(rootDir: string): Promise<string | null> {
  return readTextSafe(join(helperDir(rootDir), 'spec.md'));
}

export async function readRequirements(rootDir: string): Promise<string | null> {
  return readTextSafe(join(helperDir(rootDir), 'requirements.md'));
}

export interface LogReadOptions {
  limit?: number;
  offset?: number;
}

export async function readLogs(rootDir: string, opts?: LogReadOptions): Promise<string[]> {
  const logsDir = join(helperDir(rootDir), 'logs');
  if (!existsSync(logsDir)) return [];

  let files = readdirSync(logsDir).filter(f => f.endsWith('.json'));
  files.sort();

  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? files.length;
  files = files.slice(offset, offset + limit);

  const logs: string[] = [];
  for (const file of files) {
    const content = await readTextSafe(join(logsDir, file));
    if (content) logs.push(content);
  }
  return logs;
}

export async function readProjectData(rootDir: string): Promise<ProjectData> {
  const [config, requirements, spec, tasks, logs] = await Promise.all([
    readConfig(rootDir),
    readRequirements(rootDir),
    readSpec(rootDir),
    readTasks(rootDir),
    readLogs(rootDir),
  ]);

  return { config, requirements, spec, tasks, logs };
}