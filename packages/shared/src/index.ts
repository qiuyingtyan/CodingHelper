// Types & schemas
export {
  PhaseValues,
  PhaseSchema,
  type Phase,
  PHASE_ORDER,
  ReviewStatusValues,
  ReviewStatusSchema,
  type ReviewStatus,
  ReviewRecordSchema,
  type ReviewRecord,
  DebugScopeValues,
  DebugScopeSchema,
  type DebugScope,
  DebugLogSchema,
  type DebugLog,
  TechStackSchema,
  type TechStack,
  ConfigSchema,
  type Config,
  TaskStatusValues,
  TaskStatusSchema,
  type TaskStatus,
  TaskItemSchema,
  type TaskItem,
  TaskIndexSchema,
  type TaskIndex,
  HistorySummarySchema,
  type HistorySummary,
} from './types.js';

// Planner
export { generateRequirementsDoc, type PlannerInput, type PlannerOutput } from './planner.js';

// Spec generator
export { generateSpecDoc, generateClaudeMd, type SpecInput } from './specGenerator.js';

// Spec strategies
export { resolveSpecStrategy, type SpecStrategy } from './specStrategies.js';

// Task splitter
export {
  splitRequirementsIntoTasks,
  generateTaskMarkdown,
  type TaskSplitInput,
} from './taskSplitter.js';
