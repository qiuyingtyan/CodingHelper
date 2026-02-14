import { describe, it, expect } from 'vitest';
import {
  TaskNotFoundError,
  PhaseViolationError,
  CircularDependencyError,
  isDomainError,
} from '../domainErrors.js';

describe('domainErrors', () => {
  it('TaskNotFoundError has correct properties', () => {
    const err = new TaskNotFoundError('task-001');
    expect(err.name).toBe('TaskNotFoundError');
    expect(err.code).toBe('TASK_NOT_FOUND');
    expect(err.message).toContain('task-001');
    expect(err instanceof Error).toBe(true);
  });

  it('PhaseViolationError has correct properties', () => {
    const err = new PhaseViolationError('task', 'init');
    expect(err.name).toBe('PhaseViolationError');
    expect(err.code).toBe('PHASE_VIOLATION');
    expect(err.message).toContain('task');
    expect(err.message).toContain('init');
  });

  it('CircularDependencyError has correct properties', () => {
    const err = new CircularDependencyError();
    expect(err.name).toBe('CircularDependencyError');
    expect(err.code).toBe('CIRCULAR_DEPENDENCY');
  });

  it('isDomainError identifies domain errors', () => {
    expect(isDomainError(new TaskNotFoundError('x'))).toBe(true);
    expect(isDomainError(new PhaseViolationError('a', 'b'))).toBe(true);
    expect(isDomainError(new Error('generic'))).toBe(false);
    expect(isDomainError(null)).toBe(false);
  });
});
