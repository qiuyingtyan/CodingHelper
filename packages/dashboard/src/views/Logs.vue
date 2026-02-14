<script setup lang="ts">
import { NCard, NCollapse, NCollapseItem, NSpin, NAlert, NTag, NEmpty } from 'naive-ui';
import { useApi } from '../composables/useApi';
import { computed } from 'vue';

const { data, loading, error } = useApi<unknown[]>('/api/logs', []);

function getLogTitle(log: unknown, idx: number): string {
  if (typeof log === 'object' && log !== null) {
    const obj = log as Record<string, unknown>;
    if (obj.timestamp) return new Date(obj.timestamp as string).toLocaleString('zh-CN');
    if (obj.type) return `${obj.type} #${idx + 1}`;
  }
  return `日志 #${idx + 1}`;
}

function getLogType(log: unknown): string {
  if (typeof log === 'object' && log !== null) {
    const obj = log as Record<string, unknown>;
    if (typeof obj.type === 'string') return obj.type;
    if ('status' in obj && 'reviewer' in obj) return 'review';
    if ('scope' in obj && 'findings' in obj) return 'debug';
  }
  return 'log';
}

const typeTagMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  review: 'success',
  debug: 'warning',
  error: 'error',
  log: 'default',
};

const reversedData = computed(() => [...data.value].reverse());
</script>

<template>
  <div>
    <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 700; color: #1a1a1a;">
      日志记录
      <span v-if="data.length > 0" style="font-size: 13px; color: #999; font-weight: 400; margin-left: 8px;">
        共 {{ data.length }} 条
      </span>
    </h2>
    <NSpin :show="loading">
      <NAlert v-if="error" type="error" :title="error" style="margin-bottom: 16px" />
      <NCard style="border-radius: 10px;">
        <NEmpty v-if="!loading && data.length === 0" description="暂无日志" />
        <NCollapse v-else accordion>
          <NCollapseItem
            v-for="(log, idx) in reversedData"
            :key="idx"
            :title="getLogTitle(log, data.length - 1 - idx)"
          >
            <template #header-extra>
              <NTag :type="typeTagMap[getLogType(log)] ?? 'default'" size="small" round>
                {{ getLogType(log) }}
              </NTag>
            </template>
            <pre class="log-content">{{ JSON.stringify(log, null, 2) }}</pre>
          </NCollapseItem>
        </NCollapse>
      </NCard>
    </NSpin>
  </div>
</template>

<style scoped>
.log-content {
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.5;
  background: #fafafa;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #eee;
  overflow-x: auto;
  color: #333;
}
</style>
