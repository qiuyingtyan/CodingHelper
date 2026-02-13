<script setup lang="ts">
import { NLayout, NLayoutSider, NLayoutContent, NMenu } from 'naive-ui';
import { useRouter, useRoute } from 'vue-router';
import { computed } from 'vue';

const router = useRouter();
const route = useRoute();

const menuOptions = [
  { label: '概览', key: '/' },
  { label: '任务', key: '/tasks' },
  { label: '规范', key: '/spec' },
  { label: '调试', key: '/debug' },
  { label: '审查', key: '/reviews' },
  { label: '日志', key: '/logs' },
];

const activeKey = computed(() => route.path);

function handleMenuUpdate(key: string) {
  router.push(key);
}
</script>

<template>
  <NLayout has-sider style="height: 100vh">
    <NLayoutSider bordered :width="180" content-style="padding: 12px 0;">
      <div style="padding: 16px; font-weight: bold; font-size: 16px;">CodingHelper</div>
      <NMenu
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuUpdate"
      />
    </NLayoutSider>
    <NLayoutContent content-style="padding: 24px;">
      <router-view />
    </NLayoutContent>
  </NLayout>
</template>
