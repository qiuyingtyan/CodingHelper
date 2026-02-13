import { z } from 'zod';

// --- Phase enum ---
export const PhaseValues = ['init', 'plan', 'spec', 'task', 'run', 'debug'] as const;
export const PhaseSchema = z.enum(PhaseValues);
export type Phase = z.infer<typeof PhaseSchema>;

export const PHASE_ORDER: Record<Phase, number> = {
  init: 0,
  plan: 1,
  spec: 2,
  task: 3,
  run: 4,
  debug: 5,
};

// --- ReviewStatus ---
export const ReviewStatusValues = ['approved', 'rejected', 'needs_modification'] as const;
export const ReviewStatusSchema = z.enum(ReviewStatusValues);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

// --- ReviewRecord ---
export const ReviewRecordSchema = z.object({
  taskId: z.string(),
  status: ReviewStatusSchema,
  reviewer: z.string(),
  comment: z.string(),
  timestamp: z.string(),
});
export type ReviewRecord = z.infer<typeof ReviewRecordSchema>;

// --- DebugScope ---
export const DebugScopeValues = ['front', 'back', 'db', 'all'] as const;
export const DebugScopeSchema = z.enum(DebugScopeValues);
export type DebugScope = z.infer<typeof DebugScopeSchema>;

// --- DebugLog ---
export const DebugLogSchema = z.object({
  scope: DebugScopeSchema,
  timestamp: z.string(),
  findings: z.array(z.string()),
  claudeMdInstructions: z.string(),
});
export type DebugLog = z.infer<typeof DebugLogSchema>;

// --- TechStack ---
export const TechStackSchema = z.object({
  frontend: z.string().optional(),
  backend: z.string().optional(),
  database: z.string().optional(),
});
export type TechStack = z.infer<typeof TechStackSchema>;

// --- Config ---
export const ConfigSchema = z.object({
  projectName: z.string().min(1),
  description: z.string(),
  techStack: TechStackSchema,
  createdAt: z.string(),
  currentPhase: PhaseSchema,
  version: z.string(),
});
export type Config = z.infer<typeof ConfigSchema>;

// --- TaskStatus ---
export const TaskStatusValues = ['pending', 'in_progress', 'completed', 'rejected'] as const;
export const TaskStatusSchema = z.enum(TaskStatusValues);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

// --- TaskItem ---
export const TaskItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: TaskStatusSchema,
  dependencies: z.array(z.string()),
  priority: z.number().int().positive(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
});
export type TaskItem = z.infer<typeof TaskItemSchema>;

// --- TaskIndex ---
export const TaskIndexSchema = z.object({
  tasks: z.array(TaskItemSchema),
  executionOrder: z.array(z.string()),
});
export type TaskIndex = z.infer<typeof TaskIndexSchema>;
