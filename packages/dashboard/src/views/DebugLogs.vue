<script setup lang="ts">
import { NCard, NCollapse, NCollapseItem, NSpin, NAlert, NTag, NEmpty } from 'naive-ui';
import { useApi } from '../composables/useApi';
import { computed } from 'vue';

interface DebugLog {
  scope: string;
  timestamp: string;
  findings: string[];
  claudeMdInstructions: string;
}

const { data, loading, error } = useApi<DebugLog[]>('/api/debug-logs', []);

const scopeLabel: Record<string, string> = {
  front: '前端', back: '后端', db: '数据库', all: '全部',
};
const scopeType: Record<string, 'info' | 'success' | 'warning' | 'default'> = {
  front: 'info', back: 'success', db: 'warning', all: 'default',
};

const reversedData = computed(() => [...data.value].reverse());
</script>

<template>
  <div>
    <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 700; color: #1a1a1a;">
      调试日志
      <span v-if="data.length > 0" style="font-size: 13px; color: #999; font-weight: 400; margin-left: 8px;">
        共 {{ data.length }} 条
      </span>
    </h2>
    <NSpin :show="loading">
      <NAlert v-if="error" type="error" :title="error" style="margin-bottom: 16px" />
      <NCard style="border-radius: 10px;">
        <NEmpty v-if="!loading && data.length === 0" description="暂无调试日志" />
        <NCollapse v-else accordion>
          <NCollapseItem
            v-for="(log, idx) in reversedData"
            :key="idx"
            :title="new Date(log.timestamp).toLocaleString('zh-CN')"
          >
            <template #header-extra>
              <NTag :type="scopeType[log.scope] ?? 'default'" size="small" round>
                {{ scopeLabel[log.scope] ?? log.scope }}
              </NTag>
            </template>

            <div class="section">
              <div class="section-title">
                发现问题
                <NTag size="tiny" round>{{ log.findings.length }}</NTag>
              </div>
              <ul class="findings-list">
                <li v-for="(f, i) in log.findings" :key="i">{{ f }}</li>
              </ul>
            </div>

            <div class="section" style="margin-top: 16px;">
              <div class="section-title">CLAUDE.md 指令</div>
              <pre class="instructions-block">{{ log.claudeMdInstructions }}</pre>
            </div>
          </NCollapseItem>
        </NCollapse>
      </NCard>
    </NSpin>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #555;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.findings-list {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.8;
  color: #444;
}
.findings-list li::marker {
  color: #f0a020;
}
.instructions-block {
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.5;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  color: #333;
}
</style>
