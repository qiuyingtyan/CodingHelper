<script setup lang="ts">
import { NCard, NDataTable, NSpin, NAlert, NTag, NEmpty } from 'naive-ui';
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
  { title: '任务 ID', key: 'taskId', width: 90 },
  {
    title: '状态',
    key: 'status',
    width: 100,
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
  {
    title: '备注',
    key: 'comment',
    ellipsis: { tooltip: true },
  },
  {
    title: '时间',
    key: 'timestamp',
    width: 170,
    sorter: (a: ReviewRecord, b: ReviewRecord) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    render: (row: ReviewRecord) => new Date(row.timestamp).toLocaleString('zh-CN'),
  },
];

const tableData = computed(() => data.value);
</script>

<template>
  <div>
    <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 700; color: #1a1a1a;">审查记录</h2>
    <NSpin :show="loading">
      <NAlert v-if="error" type="error" :title="error" style="margin-bottom: 16px" />
      <NCard style="border-radius: 10px;">
        <NEmpty v-if="!loading && tableData.length === 0" description="暂无审查记录" />
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
