<script setup lang="ts">
import { NCard, NDataTable, NSpin, NAlert, NTag } from 'naive-ui';
import { useApi } from '../composables/useApi';
import { computed, h } from 'vue';

interface Task {
  id: string;
  title: string;
  status?: string;
  dependencies?: string[];
}

interface TaskIndex {
  tasks: Task[];
  executionOrder: string[];
}

const { data, loading, error } = useApi<TaskIndex>('/api/tasks', { tasks: [], executionOrder: [] });

const columns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '标题', key: 'title' },
  {
    title: '状态',
    key: 'status',
    width: 120,
    render: (row: Task) => {
      const map: Record<string, 'default' | 'info' | 'success' | 'error'> = {
        pending: 'default',
        running: 'info',
        done: 'success',
        failed: 'error',
      };
      return h(NTag, { type: map[row.status ?? 'pending'] ?? 'default' }, () => row.status ?? 'pending');
    },
  },
  {
    title: '依赖',
    key: 'dependencies',
    render: (row: Task) => (row.dependencies ?? []).join(', ') || '-',
  },
];

const tableData = computed(() => data.value.tasks);
</script>

<template>
  <div>
    <h2>任务列表</h2>
    <NSpin :show="loading">
      <NAlert v-if="error" type="error" :title="error" style="margin-bottom: 16px" />
      <NCard>
        <NDataTable :columns="columns" :data="tableData" :bordered="false" />
      </NCard>
    </NSpin>
  </div>
</template>
