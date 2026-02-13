<script setup lang="ts">
import { NCard, NDataTable, NSpin, NAlert, NTag } from 'naive-ui';
import { useApi } from '../composables/useApi';
import { computed, h } from 'vue';

interface ReviewRecord {
  taskId: string;
  status: string;
  reviewer: string;
  comment: string;
  timestamp: string;
}

const { data, loading, error } = useApi<ReviewRecord[]>('/api/reviews', []);

const columns = [
  { title: '任务 ID', key: 'taskId', width: 120 },
  {
    title: '状态',
    key: 'status',
    width: 120,
    render: (row: ReviewRecord) => {
      const typeMap: Record<string, 'success' | 'error' | 'warning'> = {
        approved: 'success',
        rejected: 'error',
        needs_modification: 'warning',
      };
      const labelMap: Record<string, string> = {
        approved: '通过',
        rejected: '驳回',
        needs_modification: '需修改',
      };
      return h(NTag, { type: typeMap[row.status] ?? 'default', size: 'small' }, () => labelMap[row.status] ?? row.status);
    },
  },
  { title: '审查人', key: 'reviewer', width: 100 },
  { title: '备注', key: 'comment' },
  {
    title: '时间',
    key: 'timestamp',
    width: 180,
    render: (row: ReviewRecord) => new Date(row.timestamp).toLocaleString('zh-CN'),
  },
];

const tableData = computed(() => data.value);
</script>

<template>
  <div>
    <h2>审查记录</h2>
    <NSpin :show="loading">
      <NAlert v-if="error" type="error" :title="error" style="margin-bottom: 16px" />
      <NCard v-if="!loading && tableData.length === 0">
        <p>暂无审查记录</p>
      </NCard>
      <NCard v-else>
        <NDataTable :columns="columns" :data="tableData" :bordered="false" />
      </NCard>
    </NSpin>
  </div>
</template>
