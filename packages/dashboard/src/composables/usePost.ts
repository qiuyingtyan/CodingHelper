import { ref } from 'vue';

export function usePost<TBody, TResult>(url: string) {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const result = ref<TResult | null>(null);

  async function execute(body: TBody): Promise<TResult | null> {
    loading.value = true;
    error.value = null;
    result.value = null;
    try {
      const res = await globalThis.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as Record<string, string>).error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as TResult;
      result.value = data;
      return data;
    } catch (e) {
      error.value = (e as Error).message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, result, execute };
}
