import { join, resolve } from 'node:path';
import { type Config, ConfigSchema } from '../types/index.js';
import { readJsonFile, writeJsonFile, fileExists } from './fs.js';
import { ProjectNotInitializedError } from '../errors/domainErrors.js';

export const CODINGHELPER_DIR = '.codinghelper';
export const CONFIG_FILE = 'config.json';
export const REQUIREMENTS_FILE = 'requirements.md';
export const SPEC_FILE = 'spec.md';
export const TASKS_DIR = 'tasks';
export const TASK_INDEX_FILE = 'index.json';
export const CLAUDE_MD_FILE = 'CLAUDE.md';
export const LOGS_DIR = 'logs';

export interface ProjectContext {
  readonly rootDir: string;
  readonly helperDir: string;
  readonly configPath: string;
  readonly requirementsPath: string;
  readonly specPath: string;
  readonly tasksDir: string;
  readonly taskIndexPath: string;
  readonly claudeMdPath: string;
  readonly logsDir: string;
}

export function buildProjectContext(rootDir: string): ProjectContext {
  const helperDir = join(rootDir, CODINGHELPER_DIR);
  return {
    rootDir,
    helperDir,
    configPath: join(helperDir, CONFIG_FILE),
    requirementsPath: join(helperDir, REQUIREMENTS_FILE),
    specPath: join(helperDir, SPEC_FILE),
    tasksDir: join(helperDir, TASKS_DIR),
    taskIndexPath: join(helperDir, TASKS_DIR, TASK_INDEX_FILE),
    claudeMdPath: join(rootDir, CLAUDE_MD_FILE),
    logsDir: join(helperDir, LOGS_DIR),
  };
}

export async function resolveProjectContext(startDir?: string): Promise<ProjectContext> {
  let dir = resolve(startDir ?? process.cwd());
  const root = resolve('/');

  while (dir !== root) {
    const candidate = join(dir, CODINGHELPER_DIR);
    if (await fileExists(candidate)) {
      return buildProjectContext(dir);
    }
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }

  throw new ProjectNotInitializedError();
}

export async function loadConfig(ctx: ProjectContext): Promise<Config> {
  return readJsonFile(ctx.configPath, ConfigSchema);
}

export async function saveConfig(ctx: ProjectContext, config: Config): Promise<void> {
  await writeJsonFile(ctx.configPath, config);
}
