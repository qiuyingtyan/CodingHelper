<script setup lang="ts">
import { NCard, NSpin, NAlert, NTabs, NTabPane, NEmpty } from 'naive-ui';
import { useApi } from '../composables/useApi';

const { data: spec, loading: specLoading, error: specError } = useApi<{ content: string }>('/api/spec', { content: '' });
const { data: req, loading: reqLoading, error: reqError } = useApi<{ content: string }>('/api/requirements', { content: '' });
</script>

<template>
  <div>
    <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 700; color: #1a1a1a;">规范文档</h2>
    <NTabs type="line" animated>
      <NTabPane name="spec" tab="技术规范">
        <NSpin :show="specLoading">
          <NAlert v-if="specError" type="error" :title="specError" style="margin-bottom: 16px" />
          <NCard style="border-radius: 10px;">
            <NEmpty v-if="!specLoading && !spec.content" description="暂无规范文档" />
            <div v-else class="doc-content">{{ spec.content }}</div>
          </NCard>
        </NSpin>
      </NTabPane>
      <NTabPane name="requirements" tab="需求文档">
        <NSpin :show="reqLoading">
          <NAlert v-if="reqError" type="error" :title="reqError" style="margin-bottom: 16px" />
          <NCard style="border-radius: 10px;">
            <NEmpty v-if="!reqLoading && !req.content" description="暂无需求文档" />
            <div v-else class="doc-content">{{ req.content }}</div>
          </NCard>
        </NSpin>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.doc-content {
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.7;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
