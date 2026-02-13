<script setup lang="ts">
import { NCard, NGrid, NGridItem, NSpin, NAlert } from 'naive-ui';
import { useApi } from '../composables/useApi';
import { computed } from 'vue';

interface ProjectData {
  config: Record<string, unknown> | null;
  requirements: string | null;
  spec: string | null;
  tasks: { tasks: unknown[]; executionOrder: string[] } | null;
  logs: unknown[];
}

const { data, loading, error } = useApi<ProjectData>('/api/project', {
  config: null, requirements: null, spec: null, tasks: null, logs: [],
});

const { data: reviews } = useApi<unknown[]>('/api/reviews', []);
const { data: debugLogs } = useApi<unknown[]>('/api/debug-logs', []);

const reviewStats = computed(() => {
  const list = reviews.value as Array<Record<string, unknown>>;
  return {
    total: list.length,
    approved: list.filter(r => r.status === 'approved').length,
    rejected: list.filter(r => r.status === 'rejected').length,
  };
});
</script>

<template>
  <div>
    <h2>项目概览</h2>
    <NSpin :show="loading">
      <NAlert v-if="error" type="error" :title="error" style="margin-bottom: 16px" />
      <NGrid :cols="3" :x-gap="16" :y-gap="16">
        <NGridItem>
          <NCard title="项目配置">
            <template v-if="data.config">
              <p v-for="(val, key) in data.config" :key="String(key)">
                <strong>{{ key }}:</strong> {{ val }}
              </p>
            </template>
            <p v-else>未找到配置</p>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard title="任务">
            <p v-if="data.tasks">共 {{ data.tasks.tasks.length }} 个任务</p>
            <p v-else>暂无任务</p>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard title="日志">
            <p>{{ data.logs.length }} 条日志记录</p>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard title="审查记录">
            <p>共 {{ reviewStats.total }} 条</p>
            <p v-if="reviewStats.total > 0">
              通过 {{ reviewStats.approved }} / 驳回 {{ reviewStats.rejected }}
            </p>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard title="调试日志">
            <p>{{ debugLogs.length }} 条调试记录</p>
          </NCard>
        </NGridItem>
      </NGrid>
    </NSpin>
  </div>
</template>
