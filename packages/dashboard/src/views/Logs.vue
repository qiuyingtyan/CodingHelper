<script setup lang="ts">
import { NCard, NCollapse, NCollapseItem, NSpin, NAlert } from 'naive-ui';
import { useApi } from '../composables/useApi';

const { data, loading, error } = useApi<unknown[]>('/api/logs', []);
</script>

<template>
  <div>
    <h2>日志记录</h2>
    <NSpin :show="loading">
      <NAlert v-if="error" type="error" :title="error" style="margin-bottom: 16px" />
      <NCard v-if="data.length === 0">
        <p>暂无日志</p>
      </NCard>
      <NCollapse v-else>
        <NCollapseItem
          v-for="(log, idx) in data"
          :key="idx"
          :title="`日志 #${idx + 1}`"
        >
          <pre style="white-space: pre-wrap; font-size: 13px;">{{ JSON.stringify(log, null, 2) }}</pre>
        </NCollapseItem>
      </NCollapse>
    </NSpin>
  </div>
</template>
