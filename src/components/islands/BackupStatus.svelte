<script lang="ts">
  import {
    FSRS_UPDATED_EVENT,
    exportDatabaseBackup,
    getDb,
    importDatabaseBackup,
    isIndexedDbAvailable,
  } from '../../lib/db';

  let cardCount = $state(0);
  let logCount = $state(0);
  let statusMessage = $state<string | null>(null);
  let fileInput: HTMLInputElement | undefined = $state();

  async function refreshCounts() {
    if (!isIndexedDbAvailable()) return;
    try {
      const db = getDb();
      cardCount = await db.cardStates.count();
      logCount = await db.reviewLogs.count();
    } catch {
      // silencioso
    }
  }

  async function handleExport() {
    try {
      const res = await exportDatabaseBackup();
      statusMessage = `Exportado (${res.cardStatesCount} cartões).`;
    } catch {
      statusMessage = 'Erro ao exportar backup.';
    }
  }

  async function handleImport(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    try {
      const res = await importDatabaseBackup(file);
      await refreshCounts();
      statusMessage = `Restaurado (${res.cardStatesCount} cartões).`;
    } catch {
      statusMessage = 'Arquivo JSON inválido.';
    } finally {
      target.value = '';
    }
  }

  $effect(() => {
    void refreshCounts();
    if (typeof window === 'undefined') return;
    const onUpdate = () => void refreshCounts();
    window.addEventListener(FSRS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(FSRS_UPDATED_EVENT, onUpdate);
  });
</script>

<div class="flex flex-col gap-2">
  <p class="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
    Memória Local
  </p>
  <p class="m-0 font-mono text-[11px] text-ink-secondary tabular-telemetry">
    {cardCount} rastreados · {logCount} revisões
  </p>
  <div class="flex items-center gap-3 pt-0.5">
    <button
      type="button"
      onclick={handleExport}
      class="cursor-pointer bg-transparent border-0 p-0 font-mono text-[10px] font-semibold uppercase tracking-wider text-ocean underline underline-offset-4 hover:text-salvage"
    >
      Exportar
    </button>
    <button
      type="button"
      onclick={() => fileInput?.click()}
      class="cursor-pointer bg-transparent border-0 p-0 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-secondary underline underline-offset-4 hover:text-ink"
    >
      Importar
    </button>
    <input
      bind:this={fileInput}
      type="file"
      accept="application/json"
      class="hidden"
      onchange={handleImport}
    />
  </div>
  {#if statusMessage}
    <p class="m-0 font-mono text-[10px] text-salvage" role="status">{statusMessage}</p>
  {/if}
</div>
