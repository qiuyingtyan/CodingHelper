<script setup lang="ts">
import { NCard, NGrid, NGridItem, NSpin, NAlert, NTag, NProgress, NButton, NInput, NSpace, useMessage } from 'naive-ui';
import { useApi } from '../composables/useApi';
import { usePost } from '../composables/usePost';
import { computed, ref } from 'vue';

const message = useMessage();

interface Config {
  projectName?: string;
  description?: string;
  techStack?: { frontend?: string; backend?: string; database?: string };
  currentPhase?: string;
  version?: string;
  createdAt?: string;
}

interface TaskItem {
  id: string;
  title: string;
  status: string;
  priority: number;
}

interface TaskIndex {
  tasks: TaskItem[];
  executionOrder: string[];
}

interface ReviewRecord {
  taskId: string;
  status: string;
  reviewer: string;
  comment: string;
  timestamp: string;
}

interface DebugLog {
  scope: string;
  timestamp: string;
  findings: string[];
}

const { data: config, loading: configLoading, error } = useApi<Config>('/api/config', {});
const { data: tasks } = useApi<TaskIndex>('/api/tasks', { tasks: [], executionOrder: [] });
const { data: reviews } = useApi<ReviewRecord[]>('/api/reviews', []);
const { data: debugLogs } = useApi<DebugLog[]>('/api/debug-logs', []);
const { data: logs } = useApi<unknown[]>('/api/logs', []);

const phaseLabels: Record<string, string> = {
  init: '初始化', plan: '规划', spec: '规范', task: '任务', run: '执行', debug: '调试',
};
const phaseTypes: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  init: 'default', plan: 'info', spec: 'info', task: 'warning', run: 'success', debug: 'error',
};
const phaseLabel = computed(() => phaseLabels[config.value.currentPhase ?? ''] ?? config.value.currentPhase ?? '未知');
const phaseType = computed(() => phaseTypes[config.value.currentPhase ?? ''] ?? 'default');

const completedTasks = computed(() => tasks.value.tasks.filter(t => t.status === 'completed').length);
const taskProgress = computed(() => {
  const total = tasks.value.tasks.length;
  return total > 0 ? Math.round((completedTasks.value / total) * 100) : 0;
});

const approvedCount = computed(() => reviews.value.filter(r => r.status === 'approved').length);
const rejectedCount = computed(() => reviews.value.filter(r => r.status === 'rejected').length);
const totalFindings = computed(() => debugLogs.value.reduce((sum, d) => sum + d.findings.length, 0));

// --- Workflow ---
const reqInput = ref('');

const genReq = usePost<{ requirements: string; config: Config }, { path: string }>('/api/generate-requirements');
const genSpec = usePost<{ requirements: string; config: Config }, { specPath: string; claudeMdPath: string }>('/api/generate-spec');
const splitTasks = usePost<{ requirements: string; config: Config }, { path: string; taskCount: number }>('/api/split-tasks');

async function handleGenRequirements() {
  if (!reqInput.value.trim()) { message.warning('请输入需求内容'); return; }
  const res = await genReq.execute({ requirements: reqInput.value, config: config.value });
  if (res) message.success('需求文档已生成');
}

async function handleGenSpec() {
  if (!reqInput.value.trim()) { message.warning('请输入需求内容'); return; }
  const res = await genSpec.execute({ requirements: reqInput.value, config: config.value });
  if (res) message.success('规范文档已生成');
}

async function handleSplitTasks() {
  if (!reqInput.value.trim()) { message.warning('请输入需求内容'); return; }
  const res = await splitTasks.execute({ requirements: reqInput.value, config: config.value });
  if (res) message.success(`已拆分为 ${res.taskCount} 个任务`);
}
</script>

<template>
  <div>
    <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 700; color: #1a1a1a;">项目概览</h2>
    <NSpin :show="configLoading">
      <NAlert v-if="error" type="error" :title="error" style="margin-bottom: 16px" />

      <!-- Project info banner -->
      <NCard style="margin-bottom: 20px; border-radius: 10px;">
        <div class="project-banner">
          <div>
            <div class="project-name">{{ config.projectName || '未命名项目' }}</div>
            <div class="project-desc">{{ config.description || '暂无描述' }}</div>
          </div>
          <div class="phase-badge">
            <NTag :type="phaseType" size="large" round>
              阶段: {{ phaseLabel }}
            </NTag>
            <span v-if="config.version" class="version-tag">v{{ config.version }}</span>
          </div>
        </div>
      </NCard>

      <!-- Stats grid -->
      <NGrid :cols="4" :x-gap="16" :y-gap="16" style="margin-bottom: 20px;">
        <NGridItem>
          <NCard class="stat-card" style="border-left: 3px solid #18a058;">
            <div class="stat-number">{{ tasks.tasks.length }}</div>
            <div class="stat-label">任务总数</div>
            <NProgress v-if="tasks.tasks.length > 0" :percentage="taskProgress" :show-indicator="false" :height="4" style="margin-top: 8px;" />
            <div v-if="tasks.tasks.length > 0" class="stat-sub">
              已完成 {{ completedTasks }} / {{ tasks.tasks.length }}
            </div>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard class="stat-card" style="border-left: 3px solid #2080f0;">
            <div class="stat-number">{{ reviews.length }}</div>
            <div class="stat-label">审查记录</div>
            <div v-if="reviews.length > 0" class="stat-sub">
              <span style="color: #18a058;">✓ {{ approvedCount }}</span>
              <span style="color: #d03050; margin-left: 8px;">✗ {{ rejectedCount }}</span>
            </div>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard class="stat-card" style="border-left: 3px solid #f0a020;">
            <div class="stat-number">{{ debugLogs.length }}</div>
            <div class="stat-label">调试日志</div>
            <div v-if="debugLogs.length > 0" class="stat-sub">
              {{ totalFindings }} 个发现
            </div>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard class="stat-card" style="border-left: 3px solid #8a65d7;">
            <div class="stat-number">{{ logs.length }}</div>
            <div class="stat-label">操作日志</div>
          </NCard>
        </NGridItem>
      </NGrid>

      <!-- Workflow panel -->
      <NCard title="工作流" style="margin-bottom: 20px; border-radius: 10px;" size="small">
        <NInput
          v-model:value="reqInput"
          type="textarea"
          placeholder="输入项目需求描述..."
          :rows="4"
          style="margin-bottom: 12px;"
        />
        <NSpace>
          <NButton type="primary" :loading="genReq.loading.value" @click="handleGenRequirements">
            生成需求文档
          </NButton>
          <NButton type="info" :loading="genSpec.loading.value" @click="handleGenSpec">
            生成规范
          </NButton>
          <NButton type="warning" :loading="splitTasks.loading.value" @click="handleSplitTasks">
            拆分任务
          </NButton>
        </NSpace>
        <NAlert v-if="genReq.error.value" type="error" style="margin-top: 10px;">{{ genReq.error.value }}</NAlert>
        <NAlert v-if="genSpec.error.value" type="error" style="margin-top: 10px;">{{ genSpec.error.value }}</NAlert>
        <NAlert v-if="splitTasks.error.value" type="error" style="margin-top: 10px;">{{ splitTasks.error.value }}</NAlert>
      </NCard>

      <!-- Tech stack -->
      <NCard v-if="config.techStack" title="技术栈" style="border-radius: 10px;" size="small">
        <div class="tech-row">
          <NTag v-if="config.techStack.frontend" type="info" size="medium" round>
            前端: {{ config.techStack.frontend }}
          </NTag>
          <NTag v-if="config.techStack.backend" type="success" size="medium" round>
            后端: {{ config.techStack.backend }}
          </NTag>
          <NTag v-if="config.techStack.database" type="warning" size="medium" round>
            数据库: {{ config.techStack.database }}
          </NTag>
        </div>
        <div v-if="config.createdAt" class="created-at">
          创建于 {{ new Date(config.createdAt).toLocaleString('zh-CN') }}
        </div>
      </NCard>
    </NSpin>
  </div>
</template>

<style scoped>
.project-banner { display: flex; justify-content: space-between; align-items: center; }
.project-name { font-size: 18px; font-weight: 700; color: #1a1a1a; }
.project-desc { color: #666; margin-top: 4px; font-size: 14px; }
.phase-badge { display: flex; align-items: center; gap: 10px; }
.version-tag { font-size: 12px; color: #999; background: #f0f0f0; padding: 2px 8px; border-radius: 10px; }
.stat-card { border-radius: 10px; }
.stat-number { font-size: 28px; font-weight: 700; color: #1a1a1a; }
.stat-label { font-size: 13px; color: #888; margin-top: 2px; }
.stat-sub { font-size: 12px; color: #999; margin-top: 6px; }
.tech-row { display: flex; gap: 10px; flex-wrap: wrap; }
.created-at { margin-top: 12px; font-size: 12px; color: #aaa; }
</style>
