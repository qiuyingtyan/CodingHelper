import { describe, it, expect } from 'vitest';
import {
  PhaseSchema,
  ConfigSchema,
  TechStackSchema,
  TaskItemSchema,
  TaskIndexSchema,
  TaskStatusSchema,
  PHASE_ORDER,
} from '../index.js';

describe('PhaseSchema', () => {
  it('accepts valid phases', () => {
    for (const p of ['init', 'plan', 'spec', 'task', 'run', 'debug']) {
      expect(PhaseSchema.parse(p)).toBe(p);
    }
  });

  it('rejects invalid phase', () => {
    expect(() => PhaseSchema.parse('invalid')).toThrow();
  });
});

describe('PHASE_ORDER', () => {
  it('has correct ordering', () => {
    expect(PHASE_ORDER.init).toBeLessThan(PHASE_ORDER.plan);
    expect(PHASE_ORDER.plan).toBeLessThan(PHASE_ORDER.spec);
    expect(PHASE_ORDER.spec).toBeLessThan(PHASE_ORDER.task);
    expect(PHASE_ORDER.task).toBeLessThan(PHASE_ORDER.run);
    expect(PHASE_ORDER.run).toBeLessThan(PHASE_ORDER.debug);
  });
});

describe('TechStackSchema', () => {
  it('accepts empty object', () => {
    expect(TechStackSchema.parse({})).toEqual({});
  });

  it('accepts partial stack', () => {
    const result = TechStackSchema.parse({ frontend: 'Vue 3' });
    expect(result.frontend).toBe('Vue 3');
  });
});

describe('ConfigSchema', () => {
  const validConfig = {
    projectName: 'test',
    description: 'A test project',
    techStack: { frontend: 'React' },
    createdAt: '2025-01-01T00:00:00Z',
    currentPhase: 'init',
    version: '1.0.0',
  };

  it('accepts valid config', () => {
    expect(ConfigSchema.parse(validConfig)).toEqual(validConfig);
  });

  it('rejects empty projectName', () => {
    expect(() => ConfigSchema.parse({ ...validConfig, projectName: '' })).toThrow();
  });

  it('rejects invalid phase', () => {
    expect(() => ConfigSchema.parse({ ...validConfig, currentPhase: 'bad' })).toThrow();
  });
});

describe('TaskStatusSchema', () => {
  it('accepts valid statuses', () => {
    for (const s of ['pending', 'in_progress', 'completed', 'rejected']) {
      expect(TaskStatusSchema.parse(s)).toBe(s);
    }
  });
});

describe('TaskItemSchema', () => {
  const validTask = {
    id: 'task-001',
    title: 'Setup project',
    status: 'pending',
    dependencies: [],
    priority: 1,
    createdAt: '2025-01-01T00:00:00Z',
    completedAt: null,
  };

  it('accepts valid task', () => {
    expect(TaskItemSchema.parse(validTask)).toEqual(validTask);
  });

  it('rejects non-positive priority', () => {
    expect(() => TaskItemSchema.parse({ ...validTask, priority: 0 })).toThrow();
  });
});

describe('TaskIndexSchema', () => {
  it('accepts valid index', () => {
    const index = {
      tasks: [
        {
          id: 'task-001',
          title: 'First',
          status: 'pending',
          dependencies: [],
          priority: 1,
          createdAt: '2025-01-01T00:00:00Z',
          completedAt: null,
        },
      ],
      executionOrder: ['task-001'],
    };
    expect(TaskIndexSchema.parse(index)).toEqual(index);
  });

  it('accepts empty tasks', () => {
    expect(TaskIndexSchema.parse({ tasks: [], executionOrder: [] })).toEqual({
      tasks: [],
      executionOrder: [],
    });
  });
});
