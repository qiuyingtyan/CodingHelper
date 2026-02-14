export class DomainError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

export class ProjectNotInitializedError extends DomainError {
  constructor() {
    super('未找到 .codinghelper/ 目录。请先运行 codinghelper init 初始化项目。', 'PROJECT_NOT_INITIALIZED');
  }
}

export class PhaseViolationError extends DomainError {
  constructor(current: string, required: string) {
    super(`当前阶段为 "${current}"，需要先完成 "${required}" 阶段。请按顺序执行命令。`, 'PHASE_VIOLATION');
  }
}

export class TaskNotFoundError extends DomainError {
  constructor(taskId: string) {
    super(`未找到任务：${taskId}`, 'TASK_NOT_FOUND');
  }
}

export class CircularDependencyError extends DomainError {
  constructor() {
    super('存在循环依赖或前置任务未完成，无法继续执行。', 'CIRCULAR_DEPENDENCY');
  }
}

export class InvalidReviewTargetError extends DomainError {
  constructor() {
    super('没有找到可审查的任务。只有 completed 或 in_progress 状态的任务可以审查。', 'INVALID_REVIEW_TARGET');
  }
}

export function isDomainError(err: unknown): err is DomainError {
  return err instanceof DomainError;
}
