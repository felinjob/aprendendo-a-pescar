<script lang="ts">
  import { FSRS_UPDATED_EVENT, isIndexedDbAvailable } from '../../lib/db';
  import {
    formatIntervalPt,
    getDueCardsSummary,
    previewCardIntervals,
    scheduleCardReview,
    type DueCardsSummary,
    type ReviewGrade,
  } from '../../lib/scheduler';

  export interface PromptItem {
    id: string;
    module: string;
    type: 'retrieval' | 'visual-occlusion' | 'calculation';
    question: string;
    answer: string;
    mnemonicCue?: string;
  }

  let {
    prompts,
    moduleFilter,
    heading = 'Revisão Espaçada FSRS · Retenção Ativa',
  }: {
    prompts: PromptItem[];
    moduleFilter?: string;
    heading?: string;
  } = $props();

  const scopedPrompts = $derived(
    moduleFilter ? prompts.filter((p) => p.module === moduleFilter) : prompts
  );
  const promptById = $derived(new Map(scopedPrompts.map((p) => [p.id, p])));

  let summary = $state<DueCardsSummary | null>(null);
  let intervals = $state<Record<ReviewGrade, string>>({
    1: '10 min',
    2: '12 h',
    3: '1 dia',
    4: '4 dias',
  });
  let isLoading = $state(true);
  let dbWarning = $state<string | null>(null);
  let revealed = $state(false);
  let practiceMode = $state(false);
  let practiceIndex = $state(0);
  let lastFeedback = $state<string | null>(null);

  const activePrompt = $derived.by(() => {
    if (summary && summary.dueCardIds.length > 0) {
      return promptById.get(summary.dueCardIds[0]) ?? null;
    }
    if (practiceMode && scopedPrompts.length > 0) {
      return scopedPrompts[practiceIndex % scopedPrompts.length];
    }
    return null;
  });

  async function refreshDeck() {
    const ids = scopedPrompts.map((p) => p.id);
    if (!isIndexedDbAvailable()) {
      dbWarning = 'IndexedDB indisponível neste navegador; revisões apenas na sessão.';
    }
    try {
      const nextSummary = await getDueCardsSummary(ids);
      summary = nextSummary;
      const firstId =
        nextSummary.dueCardIds[0] ??
        (practiceMode && scopedPrompts.length > 0
          ? scopedPrompts[practiceIndex % scopedPrompts.length].id
          : null);
      if (firstId) {
        intervals = await previewCardIntervals(firstId);
      }
      dbWarning = null;
    } catch {
      dbWarning = 'Modo volátil temporário: IndexedDB indisponível.';
    } finally {
      isLoading = false;
    }
  }

  async function handleGrade(grade: ReviewGrade) {
    if (!activePrompt) return;
    const labels: Record<ReviewGrade, string> = {
      1: 'Esqueci',
      2: 'Difícil',
      3: 'Bom',
      4: 'Fácil',
    };

    try {
      const result = await scheduleCardReview(activePrompt.id, grade, activePrompt.module);
      lastFeedback = `Avaliado como ${labels[grade]} · próxima revisão em ${result.intervalLabel}.`;
    } catch {
      lastFeedback = `Avaliado como ${labels[grade]} (sessão atual).`;
    }

    revealed = false;
    if (practiceMode) {
      practiceIndex = (practiceIndex + 1) % Math.max(1, scopedPrompts.length);
    }
    await refreshDeck();
  }

  $effect(() => {
    void refreshDeck();
    if (typeof window === 'undefined') return;
    const onExternalUpdate = () => void refreshDeck();
    window.addEventListener(FSRS_UPDATED_EVENT, onExternalUpdate);
    return () => window.removeEventListener(FSRS_UPDATED_EVENT, onExternalUpdate);
  });
</script>

<section
  id={moduleFilter ? `fsrs-${moduleFilter}` : 'fsrs-deck'}
  data-study-only
  aria-labelledby="fsrs-deck-title"
  class="console-band"
>
  <header class="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4 mb-6">
    <div>
      <p class="m-0 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-salvage">
        Meio Mnemônico Local-First · ts-fsrs
      </p>
      <h2 id="fsrs-deck-title" class="font-display text-xl sm:text-2xl font-semibold text-ink mt-1 mb-0">
        {heading}
      </h2>
    </div>
    <div class="flex items-center gap-4 font-mono text-xs tabular-telemetry">
      <span class="text-ocean font-semibold">{summary?.dueToday ?? scopedPrompts.length} pendente(s)</span>
      <span class="text-ink-muted">{scopedPrompts.length} no caderno</span>
    </div>
  </header>

  {#if dbWarning}
    <p class="mb-4 font-mono text-xs text-salvage" role="status">{dbWarning}</p>
  {/if}

  {#if isLoading}
    <p class="font-mono text-xs text-ink-muted py-6 m-0">Carregando fila FSRS local...</p>
  {:else if activePrompt}
    <div class="max-w-[66ch]">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
        <span>{activePrompt.module.toUpperCase()} · {activePrompt.type}</span>
        <span class="tabular-telemetry">
          {summary ? `${summary.totalReviews} revisões registradas` : ''}
        </span>
      </div>

      <p class="font-display text-lg sm:text-xl font-medium leading-snug text-ink mt-0 mb-5">
        {activePrompt.question}
      </p>

      {#if !revealed}
        <button
          type="button"
          onclick={() => (revealed = true)}
          class="cursor-pointer border border-line-strong bg-ink px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-canvas hover:bg-salvage hover:border-salvage transition-colors"
        >
          Revelar Resposta
        </button>
      {:else}
        <div class="border-t border-line-strong pt-4 mb-5">
          <p class="m-0 font-mono text-[10px] font-semibold uppercase tracking-wider text-ocean">
            Resposta Causal
          </p>
          <p class="mt-1.5 mb-0 text-sm sm:text-base leading-relaxed text-ink">
            {activePrompt.answer}
          </p>
          {#if activePrompt.mnemonicCue}
            <p class="mt-2.5 mb-0 font-mono text-xs text-salvage">
              Âncora: {activePrompt.mnemonicCue}
            </p>
          {/if}
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="Avaliar retenção">
          <button
            type="button"
            onclick={() => handleGrade(1)}
            class="cursor-pointer border border-salvage bg-salvage-soft px-3 py-2 text-left text-ink hover:bg-salvage hover:text-elevated transition-colors"
          >
            <span class="block font-mono text-xs font-bold">1 · Esqueci</span>
            <span class="block font-mono text-[10px] opacity-80 tabular-telemetry">
              {intervals[1]}
            </span>
          </button>

          <button
            type="button"
            onclick={() => handleGrade(2)}
            class="cursor-pointer border border-line-strong bg-elevated px-3 py-2 text-left text-ink hover:border-salvage transition-colors"
          >
            <span class="block font-mono text-xs font-bold">2 · Difícil</span>
            <span class="block font-mono text-[10px] text-ink-muted tabular-telemetry">
              {intervals[2]}
            </span>
          </button>

          <button
            type="button"
            onclick={() => handleGrade(3)}
            class="cursor-pointer border border-ocean bg-ocean-soft px-3 py-2 text-left text-ink hover:bg-ocean hover:text-elevated transition-colors"
          >
            <span class="block font-mono text-xs font-bold">3 · Bom</span>
            <span class="block font-mono text-[10px] opacity-80 tabular-telemetry">
              {intervals[3]}
            </span>
          </button>

          <button
            type="button"
            onclick={() => handleGrade(4)}
            class="cursor-pointer border border-line-strong bg-elevated px-3 py-2 text-left text-ink hover:border-ocean transition-colors"
          >
            <span class="block font-mono text-xs font-bold">4 · Fácil</span>
            <span class="block font-mono text-[10px] text-ink-muted tabular-telemetry">
              {intervals[4]}
            </span>
          </button>
        </div>
      {/if}
    </div>
  {:else}
    <div class="py-4 max-w-[66ch]">
      <p class="m-0 font-display text-lg font-semibold text-ocean">
        Fila em dia neste caderno.
      </p>
      <p class="mt-1.5 mb-4 text-sm text-ink-secondary">
        {#if summary?.nextDueAt}
          Próxima revisão agendada em <strong class="font-mono text-ink">{formatIntervalPt(new Date(), summary.nextDueAt)}</strong>.
        {:else}
          Todos os cartões deste módulo foram concluídos.
        {/if}
      </p>
      <button
        type="button"
        onclick={() => {
          practiceMode = true;
          practiceIndex = 0;
          revealed = false;
          void refreshDeck();
        }}
        class="cursor-pointer border border-line-strong bg-elevated px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink hover:border-salvage transition-colors"
      >
        Revisar antecipado ({scopedPrompts.length})
      </button>
    </div>
  {/if}

  {#if lastFeedback}
    <p class="mt-4 mb-0 pt-3 border-t border-line font-mono text-xs text-ocean" role="status">
      {lastFeedback}
    </p>
  {/if}
</section>
