<script setup lang="ts">
import { NCard, NDataTable, NSpin, NAlert, NTag, NEmpty } from 'naive-ui';
import { useApi } from '../composables/useApi';
import { computed, h } from 'vue';

interface Task {
  id: string;
  title: string;
  status?: string;
  dependencies?: string[];
  priority?: number;
  createdAt?: string;
  completedAt?: string | null;
}

interface TaskIndex {
  tasks: Task[];
  executionOrder: string[];
}

const { data, loading, error } = useApi<TaskIndex>('/api/tasks', { tasks: [], executionOrder: [] });

const statusMap: Record<string, { label: string; type: 'default' | 'info' | 'success' | 'error' }> = {
  pending: { label: '待处理', type: 'default' },
  in_progress: { label: '进行中', type: 'info' },
  completed: { label: '已完成', type: 'success' },
  rejected: { label: '已驳回', type: 'error' },
};

const columns = [
  { title: 'ID', key: 'id', width: 70, sorter: (a: Task, b: Task) => a.id.localeCompare(b.id) },
  { title: '标题', key: 'title', ellipsis: { tooltip: true } },
  {
    title: '优先级',
    key: 'priority',
    width: 90,
    sorter: (a: Task, b: Task) => (a.priority ?? 0) - (b.priority ?? 0),
    render: (row: Task) => {
      const p = row.priority ?? 0;
      const type = p <= 1 ? 'error' : p <= 3 ? 'warning' : 'default';
      return h(NTag, { type, size: 'small', round: true }, () => `P${p}`);
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row: Task) => {
      const s = statusMap[row.status ?? 'pending'] ?? statusMap.pending;
      return h(NTag, { type: s.type, size: 'small' }, () => s.label);
    },
  },
  {
    title: '依赖',
    key: 'dependencies',
    width: 120,
    render: (row: Task) => {
      const deps = row.dependencies ?? [];
      return deps.length > 0 ? deps.join(', ') : '-';
    },
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 170,
    render: (row: Task) => row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN') : '-',
  },
];

const tableData = computed(() => data.value.tasks);

const executionOrderText = computed(() => {
  const order = data.value.executionOrder;
  return order.length > 0 ? order.join(' → ') : '';
});
</script>

<template>
  <div>
    <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 700; color: #1a1a1a;">任务列表</h2>
    <NSpin :show="loading">
      <NAlert v-if="error" type="error" :title="error" style="margin-bottom: 16px" />

      <NCard v-if="executionOrderText" size="small" style="margin-bottom: 16px; border-radius: 10px;">
        <div style="font-size: 13px; color: #666;">
          <span style="font-weight: 600; color: #333;">执行顺序:</span>
          {{ executionOrderText }}
        </div>
      </NCard>

      <NCard style="border-radius: 10px;">
        <NEmpty v-if="!loading && tableData.length === 0" description="暂无任务" />
        <NDataTable
          v-else
          :columns="columns"
          :data="tableData"
          :bordered="false"
          :single-line="false"
          :pagination="{ pageSize: 20 }"
          striped
        />
      </NCard>
    </NSpin>
  </div>
</template>
