<script setup lang="ts">
import { NLayout, NLayoutSider, NLayoutContent, NMenu } from 'naive-ui';
import { useRouter, useRoute } from 'vue-router';
import { computed, h } from 'vue';

const router = useRouter();
const route = useRoute();

/* SVG icon helper */
function icon(path: string) {
  return () =>
    h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: 18, height: 18, fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: path }),
    ]);
}

const menuOptions = [
  { label: '概览', key: '/', icon: icon('M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10') },
  { label: '任务', key: '/tasks', icon: icon('M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11') },
  { label: '规范', key: '/spec', icon: icon('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8') },
  { label: '调试', key: '/debug', icon: icon('M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 8v4 M12 16h.01') },
  { label: '审查', key: '/reviews', icon: icon('M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z') },
  { label: '日志', key: '/logs', icon: icon('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8') },
];

const activeKey = computed(() => route.path);

function handleMenuUpdate(key: string) {
  router.push(key);
}
</script>

<template>
  <NLayout has-sider style="height: 100vh">
    <NLayoutSider bordered :width="190" content-style="padding: 12px 0;" style="background: #fafbfc;">
      <div class="brand">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#18a058" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 18l6-6-6-6 M8 6l-6 6 6 6" />
        </svg>
        <span>CodingHelper</span>
      </div>
      <NMenu
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuUpdate"
      />
    </NLayoutSider>
    <NLayoutContent content-style="padding: 28px 32px; background: #f5f6f8; overflow-y: auto;">
      <router-view />
    </NLayoutContent>
  </NLayout>
</template>

<style scoped>
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 20px 14px;
  font-weight: 700;
  font-size: 16px;
  color: #1a1a1a;
  letter-spacing: -0.3px;
}
</style>
