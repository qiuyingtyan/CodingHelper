import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import Overview from './views/Overview.vue';
import Tasks from './views/Tasks.vue';
import Spec from './views/Spec.vue';
import Logs from './views/Logs.vue';
import DebugLogs from './views/DebugLogs.vue';
import Reviews from './views/Reviews.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Overview },
    { path: '/tasks', component: Tasks },
    { path: '/spec', component: Spec },
    { path: '/logs', component: Logs },
    { path: '/debug', component: DebugLogs },
    { path: '/reviews', component: Reviews },
  ],
});

createApp(App).use(router).mount('#app');
