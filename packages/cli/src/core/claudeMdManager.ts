import type { ProjectContext } from '../utils/projectContext.js';
import type { TaskItem } from '../types/index.js';
import { readTextFile, writeTextFile, fileExists } from '../utils/fs.js';

const TASK_SECTION_START = '<!-- CURRENT_TASK_START -->';
const TASK_SECTION_END = '<!-- CURRENT_TASK_END -->';
const DEBUG_SECTION_START = '<!-- DEBUG_CONTEXT_START -->';
const DEBUG_SECTION_END = '<!-- DEBUG_CONTEXT_END -->';

/**
 * 在 CLAUDE.md 中注入当前任务上下文，让 Claude Code 了解正在执行的任务。
 */
export async function injectTaskContext(
  ctx: ProjectContext,
  task: TaskItem,
  taskContent: string,
): Promise<void> {
  if (!(await fileExists(ctx.claudeMdPath))) return;

  let claudeMd = await readTextFile(ctx.claudeMdPath);
  claudeMd = removeSection(claudeMd, TASK_SECTION_START, TASK_SECTION_END);

  const injection = [
    '',
    TASK_SECTION_START,
    `## 当前任务：${task.id} — ${task.title}`,
    '',
    `优先级：${task.priority} | 依赖：${task.dependencies.length > 0 ? task.dependencies.join(', ') : '无'}`,
    '',
    taskContent,
    TASK_SECTION_END,
    '',
  ].join('\n');

  claudeMd = claudeMd.trimEnd() + '\n' + injection;
  await writeTextFile(ctx.claudeMdPath, claudeMd);
}

/**
 * 在 CLAUDE.md 中注入 debug 上下文。
 */
export async function injectDebugContext(
  ctx: ProjectContext,
  instructions: string,
): Promise<void> {
  if (!(await fileExists(ctx.claudeMdPath))) return;

  let claudeMd = await readTextFile(ctx.claudeMdPath);
  claudeMd = removeSection(claudeMd, DEBUG_SECTION_START, DEBUG_SECTION_END);

  const injection = [
    '',
    DEBUG_SECTION_START,
    '## Debug 上下文',
    '',
    instructions,
    DEBUG_SECTION_END,
    '',
  ].join('\n');

  claudeMd = claudeMd.trimEnd() + '\n' + injection;
  await writeTextFile(ctx.claudeMdPath, claudeMd);
}

/**
 * 清除 CLAUDE.md 中的动态注入段落。
 */
export async function clearDynamicSections(ctx: ProjectContext): Promise<void> {
  if (!(await fileExists(ctx.claudeMdPath))) return;

  let claudeMd = await readTextFile(ctx.claudeMdPath);
  claudeMd = removeSection(claudeMd, TASK_SECTION_START, TASK_SECTION_END);
  claudeMd = removeSection(claudeMd, DEBUG_SECTION_START, DEBUG_SECTION_END);
  await writeTextFile(ctx.claudeMdPath, claudeMd.trimEnd() + '\n');
}

function removeSection(content: string, startMarker: string, endMarker: string): string {
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) return content;
  const before = content.slice(0, startIdx).trimEnd();
  const after = content.slice(endIdx + endMarker.length).trimStart();
  return after.length > 0 ? before + '\n\n' + after : before + '\n';
}
