import { describe, it, expect } from 'vitest';
import { assertMinPhase } from '../phaseGuard.js';
import { PhaseViolationError } from '../../errors/domainErrors.js';

describe('phaseGuard', () => {
  it('allows same phase', () => {
    expect(() => assertMinPhase('plan', 'plan')).not.toThrow();
  });

  it('allows higher phase', () => {
    expect(() => assertMinPhase('spec', 'plan')).not.toThrow();
    expect(() => assertMinPhase('debug', 'init')).not.toThrow();
  });

  it('throws PhaseViolationError for lower phase', () => {
    expect(() => assertMinPhase('init', 'plan')).toThrow(PhaseViolationError);
    expect(() => assertMinPhase('plan', 'spec')).toThrow(PhaseViolationError);
    expect(() => assertMinPhase('init', 'debug')).toThrow(PhaseViolationError);
  });

  it('error message contains phase names', () => {
    try {
      assertMinPhase('init', 'spec');
    } catch (e) {
      expect((e as PhaseViolationError).message).toContain('init');
      expect((e as PhaseViolationError).message).toContain('spec');
      expect((e as PhaseViolationError).code).toBe('PHASE_VIOLATION');
    }
  });
});
