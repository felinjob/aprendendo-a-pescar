<script lang="ts">
  import { onMount } from 'svelte';
  import {
    exportDatabaseBackup,
    FSRS_UPDATED_EVENT,
    importDatabaseBackup,
  } from '../../lib/db';
  import { getDueCardsSummary } from '../../lib/scheduler';

  interface Props {
    cardIds: string[];
  }

  let { cardIds }: Props = $props();

  let dueToday = $state<number | null>(null);
  let totalReviews = $state(0);
  let statusMessage = $state('');
  let isError = $state(false);
  let busy = $state(false);
  let fileInput: HTMLInputElement | undefined = $state();

  async function refreshStatus() {
    try {
      const summary = await getDueCardsSummary(cardIds);
      dueToday = summary.dueToday;
      totalReviews = summary.totalReviews;
    } catch {
      dueToday = cardIds.length;
    }
  }

  function showNotice(message: string, error = false) {
    statusMessage = message;
    isError = error;
    setTimeout(() => {
      if (statusMessage === message) {
        statusMessage = '';
      }
    }, 3500);
  }

  async function handleExport() {
    if (busy) return;
    busy = true;
    try {
      const stats = await exportDatabaseBackup();
      showNotice(`JSON salvo (${stats.cardStatesCount} cards)`);
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Falha ao exportar.', true);
    } finally {
      busy = false;
    }
  }

  function triggerImport() {
    fileInput?.click();
  }

  async function handleFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    busy = true;
    try {
      const restored = await importDatabaseBackup(file);
      await refreshStatus();
      showNotice(`Restaurado (${restored.cardStatesCount} cards)`);
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Backup inválido.', true);
    } finally {
      input.value = '';
      busy = false;
    }
  }

  onMount(() => {
    void refreshStatus();
    const handler = () => void refreshStatus();
    window.addEventListener(FSRS_UPDATED_EVENT, handler);
    return () => window.removeEventListener(FSRS_UPDATED_EVENT, handler);
  });
</script>

<div
  class="mt-4 border border-line bg-surface p-2.5 tabular-telemetry"
  aria-label="Status FSRS e backup local"
>
  <div class="flex items-center justify-between gap-2">
    <div>
      <span class="block font-mono text-[9px] font-bold uppercase tracking-widest text-ink-muted">
        REVISÕES HOJE
      </span>
      <span
        class="font-mono text-base font-bold {dueToday && dueToday > 0
          ? 'text-salvage'
          : 'text-ocean'}"
      >
        {dueToday === null ? '—' : dueToday}
      </span>
      <span class="font-mono text-[10px] text-ink-muted ml-1">
        ({totalReviews} logs)
      </span>
    </div>

    <div class="flex items-center gap-1">
      <button
        type="button"
        onclick={handleExport}
        disabled={busy}
        title="Exportar backup JSON do IndexedDB"
        aria-label="Exportar backup JSON"
        class="cursor-pointer border border-line bg-elevated p-1.5 text-ink-secondary transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path d="M8 2v8M5 7l3 3 3-3M3 13h10" />
        </svg>
      </button>

      <button
        type="button"
        onclick={triggerImport}
        disabled={busy}
        title="Importar backup JSON para o IndexedDB"
        aria-label="Importar backup JSON"
        class="cursor-pointer border border-line bg-elevated p-1.5 text-ink-secondary transition-colors hover:border-salvage hover:text-salvage disabled:opacity-50"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path d="M8 10V2M5 5l3-3 3 3M3 13h10" />
        </svg>
      </button>
    </div>
  </div>

  <input
    bind:this={fileInput}
    type="file"
    accept="application/json,.json"
    class="sr-only"
    onchange={handleFileChange}
    aria-label="Selecionar arquivo JSON de backup"
  />

  {#if statusMessage}
    <p
      class="mt-1.5 mb-0 font-mono text-[10px] leading-tight {isError
        ? 'text-salvage'
        : 'text-ocean'}"
      role="status"
    >
      {statusMessage}
    </p>
  {/if}
</div>
