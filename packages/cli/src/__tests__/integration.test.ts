import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import {
  buildProjectContext,
  loadConfig,
  saveConfig,
} from '../utils/projectContext.js';
import { ensureDir, readTextFile, writeTextFile, readJsonFile, writeJsonFile, fileExists } from '../utils/fs.js';
import { generateRequirementsDoc } from '../core/planner.js';
import { generateSpecDoc, generateClaudeMd } from '../core/specGenerator.js';
import { splitRequirementsIntoTasks, generateTaskMarkdown } from '../core/taskSplitter.js';
import { TaskIndexSchema } from '../types/index.js';
import type { Config } from '../types/index.js';
import {
  createSuggestionProvider,
  REQUIREMENT_CATEGORIES,
  type RequirementSection,
} from '../core/suggestionEngine.js';

describe('Integration: full workflow', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'codinghelper-integ-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('init → plan → spec → task → run → done', async () => {
    const ctx = buildProjectContext(tempDir);

    // === Phase: init ===
    await ensureDir(ctx.helperDir);
    await ensureDir(ctx.tasksDir);

    const config: Config = {
      projectName: 'IntegrationTest',
      description: '集成测试项目',
      techStack: { frontend: 'Vue 3', backend: 'Express' },
      createdAt: new Date().toISOString(),
      currentPhase: 'init',
      version: '1.0.0',
    };
    await saveConfig(ctx, config);

    const loaded = await loadConfig(ctx);
    expect(loaded.projectName).toBe('IntegrationTest');
    expect(loaded.currentPhase).toBe('init');

    // === Phase: plan ===
    const requirements = [
      '## 用户登录',
      '支持邮箱密码登录',
      '',
      '## 用户注册',
      '支持邮箱注册和验证',
      '',
      '## 个人中心',
      '查看和编辑个人信息',
    ].join('\n');

    const reqDoc = generateRequirementsDoc({ requirements, config });
    expect(reqDoc).toContain('IntegrationTest');
    expect(reqDoc).toContain('用户登录');

    await writeTextFile(ctx.requirementsPath, reqDoc);
    const planConfig = { ...config, currentPhase: 'plan' as const };
    await saveConfig(ctx, planConfig);

    expect(await fileExists(ctx.requirementsPath)).toBe(true);

    // === Phase: spec ===
    const specDoc = generateSpecDoc({ config: planConfig, requirements: reqDoc });
    const claudeMd = generateClaudeMd({ config: planConfig, requirements: reqDoc });

    expect(specDoc).toContain('技术规范');
    expect(specDoc).toContain('Vue 3');
    expect(claudeMd).toContain('CLAUDE.md');

    await writeTextFile(ctx.specPath, specDoc);
    await writeTextFile(ctx.claudeMdPath, claudeMd);
    const specConfig = { ...planConfig, currentPhase: 'spec' as const };
    await saveConfig(ctx, specConfig);

    expect(await fileExists(ctx.specPath)).toBe(true);
    expect(await fileExists(ctx.claudeMdPath)).toBe(true);

    // === Phase: task ===
    const taskIndex = splitRequirementsIntoTasks({ requirements, spec: specDoc });
    expect(taskIndex.tasks).toHaveLength(3);
    expect(taskIndex.tasks[0].title).toBe('用户登录');
    expect(taskIndex.tasks[1].title).toBe('用户注册');
    expect(taskIndex.tasks[2].title).toBe('个人中心');

    await writeJsonFile(ctx.taskIndexPath, taskIndex);

    const sections = requirements.split(/(?=^## )/m).filter((s) => s.trim());
    for (let i = 0; i < taskIndex.tasks.length; i++) {
      const task = taskIndex.tasks[i];
      const body = sections[i]?.replace(/^## .+\n?/, '').trim() ?? '';
      const md = generateTaskMarkdown(task, body);
      await writeTextFile(join(ctx.tasksDir, `${task.id}.md`), md);
    }

    const taskConfig = { ...specConfig, currentPhase: 'task' as const };
    await saveConfig(ctx, taskConfig);

    // Verify task files
    for (const task of taskIndex.tasks) {
      const taskPath = join(ctx.tasksDir, `${task.id}.md`);
      expect(await fileExists(taskPath)).toBe(true);
      const content = await readTextFile(taskPath);
      expect(content).toContain(task.title);
    }

    // Verify task index
    const loadedIndex = await readJsonFile(ctx.taskIndexPath, TaskIndexSchema);
    expect(loadedIndex.tasks).toHaveLength(3);
    expect(loadedIndex.executionOrder).toEqual(['task-001', 'task-002', 'task-003']);

    // === Phase: run (simulate) ===
    const pendingTasks = loadedIndex.tasks.filter((t) => t.status === 'pending');
    expect(pendingTasks).toHaveLength(3);

    const completedIds = new Set(
      loadedIndex.tasks.filter((t) => t.status === 'completed').map((t) => t.id)
    );
    const nextTask = pendingTasks.find((t) =>
      t.dependencies.every((dep) => completedIds.has(dep))
    );
    expect(nextTask).toBeDefined();
    expect(nextTask!.id).toBe('task-001');

    // Mark as in_progress
    const runTasks = loadedIndex.tasks.map((t) =>
      t.id === nextTask!.id ? { ...t, status: 'in_progress' as const } : t
    );
    await writeJsonFile(ctx.taskIndexPath, { ...loadedIndex, tasks: runTasks });

    // === Phase: done (simulate) ===
    const doneTasks = runTasks.map((t) =>
      t.id === nextTask!.id
        ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() }
        : t
    );
    await writeJsonFile(ctx.taskIndexPath, { ...loadedIndex, tasks: doneTasks });

    const finalIndex = await readJsonFile(ctx.taskIndexPath, TaskIndexSchema);
    const completedCount = finalIndex.tasks.filter((t) => t.status === 'completed').length;
    expect(completedCount).toBe(1);

    const remainingPending = finalIndex.tasks.filter((t) => t.status === 'pending').length;
    expect(remainingPending).toBe(2);
  });

  it('phase guard prevents skipping phases', async () => {
    const ctx = buildProjectContext(tempDir);
    await ensureDir(ctx.helperDir);

    const config: Config = {
      projectName: 'GuardTest',
      description: '',
      techStack: {},
      createdAt: new Date().toISOString(),
      currentPhase: 'init',
      version: '1.0.0',
    };
    await saveConfig(ctx, config);

    // Trying to run spec before plan should fail
    const { assertMinPhase } = await import('../utils/phaseGuard.js');
    expect(() => assertMinPhase('init', 'plan')).toThrow('需要先完成');
    expect(() => assertMinPhase('init', 'spec')).toThrow('需要先完成');
    expect(() => assertMinPhase('plan', 'plan')).not.toThrow();
    expect(() => assertMinPhase('spec', 'plan')).not.toThrow();
  });

  it('suggestion engine integrates with plan workflow', async () => {
    const ctx = buildProjectContext(tempDir);
    await ensureDir(ctx.helperDir);
    await ensureDir(ctx.tasksDir);

    const provider = createSuggestionProvider();

    // 1. Tech stack selection with companions
    const frontendOptions = provider.suggestTechStack('frontend');
    const selectedFrontend = frontendOptions.find((t) => t.name === 'React')!;
    expect(selectedFrontend).toBeDefined();

    const companions = provider.suggestCompanions('frontend', selectedFrontend.name);
    expect(companions.length).toBeGreaterThan(0);

    const stateGroup = companions.find((c) => c.group === '状态管理');
    expect(stateGroup).toBeDefined();

    // 2. Build config with selected tech
    const config: Config = {
      projectName: 'SuggestionInteg',
      description: '建议引擎集成测试',
      techStack: {
        frontend: selectedFrontend.name,
        stateManagement: stateGroup!.options[0].name,
      },
      createdAt: new Date().toISOString(),
      currentPhase: 'init',
      version: '1.0.0',
    };
    await saveConfig(ctx, config);

    // 3. Categorized requirements with completeness analysis
    const sections: RequirementSection[] = [
      { category: 'core', content: '用户认证和授权系统' },
      { category: 'users', content: '管理员和普通用户' },
      { category: 'constraints', content: '响应时间 < 200ms' },
    ];
    const report = provider.analyzeRequirements(sections);
    expect(report.score).toBe(60);
    expect(report.filled).toHaveLength(3);
    expect(report.missing).toHaveLength(2);

    // 4. Generate requirements doc and save
    const merged = sections
      .filter((s) => s.content.length > 0)
      .map((s) => {
        const label = REQUIREMENT_CATEGORIES.find((c) => c.key === s.category)?.label ?? s.category;
        return `## ${label}\n\n${s.content}`;
      })
      .join('\n\n');

    const reqDoc = generateRequirementsDoc({ requirements: merged, config });
    expect(reqDoc).toContain('用户认证和授权系统');
    expect(reqDoc).toContain('SuggestionInteg');

    await writeTextFile(ctx.requirementsPath, reqDoc);
    const planConfig = { ...config, currentPhase: 'plan' as const };
    await saveConfig(ctx, planConfig);

    // 5. Simulate rejection with improvement suggestions
    const improvements = provider.suggestImprovements(reqDoc, '安全性不足，需要更详细');
    expect(improvements.length).toBeGreaterThan(0);
    expect(improvements.some((s) => s.includes('认证授权'))).toBe(true);

    // 6. Verify full round-trip: file persisted correctly
    const savedDoc = await readTextFile(ctx.requirementsPath);
    expect(savedDoc).toBe(reqDoc);
    const savedConfig = await loadConfig(ctx);
    expect(savedConfig.currentPhase).toBe('plan');
    expect(savedConfig.techStack.frontend).toBe('React');
  });
});
