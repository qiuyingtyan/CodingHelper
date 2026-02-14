import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import {
  generateRequirementsDoc,
  generateSpecDoc,
  generateClaudeMd,
  splitRequirementsIntoTasks,
  generateTaskMarkdown,
  type Config,
} from '@codinghelper/shared';

const CODINGHELPER_DIR = '.codinghelper';

function helperDir(rootDir: string): string {
  return join(rootDir, CODINGHELPER_DIR);
}

// --- Generate requirements doc ---

export interface GenerateRequirementsInput {
  requirements: string;
  config: Config;
}

export async function actionGenerateRequirements(
  rootDir: string,
  input: GenerateRequirementsInput,
): Promise<{ path: string }> {
  const doc = generateRequirementsDoc({ requirements: input.requirements, config: input.config });
  const outPath = join(helperDir(rootDir), 'requirements.md');
  await mkdir(helperDir(rootDir), { recursive: true });
  await writeFile(outPath, doc, 'utf-8');
  return { path: outPath };
}

// --- Generate spec ---

export interface GenerateSpecInput {
  requirements: string;
  config: Config;
}

export async function actionGenerateSpec(
  rootDir: string,
  input: GenerateSpecInput,
): Promise<{ specPath: string; claudeMdPath: string }> {
  const specInput = { requirements: input.requirements, config: input.config };
  const specDoc = generateSpecDoc(specInput);
  const claudeMd = generateClaudeMd(specInput);

  const dir = helperDir(rootDir);
  await mkdir(dir, { recursive: true });

  const specPath = join(dir, 'spec.md');
  const claudeMdPath = join(rootDir, 'CLAUDE.md');

  await writeFile(specPath, specDoc, 'utf-8');
  await writeFile(claudeMdPath, claudeMd, 'utf-8');

  return { specPath, claudeMdPath };
}

// --- Split tasks ---

export interface SplitTasksInput {
  requirements: string;
  config: Config;
}

export async function actionSplitTasks(
  rootDir: string,
  input: SplitTasksInput,
): Promise<{ path: string; taskCount: number }> {
  const specInput = { requirements: input.requirements, config: input.config };
  const specDoc = generateSpecDoc(specInput);
  const result = splitRequirementsIntoTasks({
    requirements: input.requirements,
    spec: specDoc,
  });

  const dir = join(helperDir(rootDir), 'tasks');
  await mkdir(dir, { recursive: true });

  // Write index
  const indexPath = join(dir, 'index.json');
  await writeFile(indexPath, JSON.stringify(result, null, 2), 'utf-8');

  // Write individual task markdown files
  for (const task of result.tasks) {
    const md = generateTaskMarkdown(task, '');
    await writeFile(join(dir, `${task.id}.md`), md, 'utf-8');
  }

  return { path: indexPath, taskCount: result.tasks.length };
}
