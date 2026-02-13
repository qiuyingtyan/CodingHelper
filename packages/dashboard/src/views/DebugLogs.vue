<script setup lang="ts">
import { NCard, NCollapse, NCollapseItem, NSpin, NAlert, NTag } from 'naive-ui';
import { useApi } from '../composables/useApi';

interface DebugLog {
  scope: string;
  timestamp: string;
  findings: string[];
  claudeMdInstructions: string;
}

const { data, loading, error } = useApi<DebugLog[]>('/api/debug-logs', []);

const scopeLabel: Record<string, string> = {
  front: '前端',
  back: '后端',
  db: '数据库',
  all: '全部',
};
</script>

<template>
  <div>
    <h2>调试日志</h2>
    <NSpin :show="loading">
      <NAlert v-if="error" type="error" :title="error" style="margin-bottom: 16px" />
      <NCard v-if="!loading && data.length === 0">
        <p>暂无调试日志</p>
      </NCard>
      <NCollapse v-else>
        <NCollapseItem
          v-for="(log, idx) in data"
          :key="idx"
          :title="`[${scopeLabel[log.scope] ?? log.scope}] ${new Date(log.timestamp).toLocaleString('zh-CN')}`"
        >
          <div style="margin-bottom: 12px;">
            <NTag size="small" type="info">{{ scopeLabel[log.scope] ?? log.scope }}</NTag>
          </div>
          <h4>发现问题 ({{ log.findings.length }})</h4>
          <ul>
            <li v-for="(f, i) in log.findings" :key="i">{{ f }}</li>
          </ul>
          <h4 style="margin-top: 12px;">CLAUDE.md 指令</h4>
          <pre style="white-space: pre-wrap; font-size: 13px; background: #f5f5f5; padding: 12px; border-radius: 4px;">{{ log.claudeMdInstructions }}</pre>
        </NCollapseItem>
      </NCollapse>
    </NSpin>
  </div>
</template>
