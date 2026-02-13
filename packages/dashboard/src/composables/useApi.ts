import { ref, onMounted, type Ref } from 'vue';

export function useApi<T>(url: string, defaultValue: T) {
  const data = ref<T>(defaultValue) as Ref<T>;
  const loading = ref(true);
  const error = ref<string | null>(null);

  async function fetch() {
    loading.value = true;
    error.value = null;
    try {
      const res = await globalThis.fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data.value = await res.json();
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetch);

  return { data, loading, error, refresh: fetch };
}
