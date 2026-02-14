import { type Phase, PHASE_ORDER } from '../types/index.js';
import { PhaseViolationError } from '../errors/domainErrors.js';

export function assertMinPhase(current: Phase, required: Phase): void {
  if (PHASE_ORDER[current] < PHASE_ORDER[required]) {
    throw new PhaseViolationError(current, required);
  }
}
