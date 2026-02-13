import { type Phase, PHASE_ORDER } from '../types/index.js';

export function assertMinPhase(current: Phase, required: Phase): void {
  if (PHASE_ORDER[current] < PHASE_ORDER[required]) {
    throw new Error(
      `当前阶段为 "${current}"，需要先完成 "${required}" 阶段。请按顺序执行命令。`
    );
  }
}
