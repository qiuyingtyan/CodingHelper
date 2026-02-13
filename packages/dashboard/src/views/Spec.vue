<script setup lang="ts">
import { NCard, NSpin, NAlert } from 'naive-ui';
import { useApi } from '../composables/useApi';

const { data, loading, error } = useApi<{ content: string }>('/api/spec', { content: '' });
</script>

<template>
  <div>
    <h2>规范文档</h2>
    <NSpin :show="loading">
      <NAlert v-if="error" type="error" :title="error" style="margin-bottom: 16px" />
      <NCard>
        <pre style="white-space: pre-wrap; font-size: 14px;">{{ data.content || '暂无规范文档' }}</pre>
      </NCard>
    </NSpin>
  </div>
</template>
