<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { FSRS_UPDATED_EVENT } from '../../lib/db';
  import {
    getDueCardsSummary,
    previewCardIntervals,
    scheduleCardReview,
    type ReviewGrade,
  } from '../../lib/scheduler';

  export interface FsrsPrompt {
    id: string;
    moduleId: string;
    category: string;
    question: string;
    answer: string;
    causalExplanation: string;
  }

  interface Props {
    prompts: FsrsPrompt[];
  }

  let { prompts }: Props = $props();

  const RATING_OPTIONS: Array<{
    grade: ReviewGrade;
    keyLabel: string;
    label: string;
    toneClass: string;
  }> = [
    {
      grade: 1,
      keyLabel: '1',
      label: 'Errei',
      toneClass: 'border-salvage text-salvage hover:bg-salvage hover:text-canvas',
    },
    {
      grade: 2,
      keyLabel: '2',
      label: 'Difícil',
      toneClass: 'border-line-strong text-ink hover:bg-surface',
    },
    {
      grade: 3,
      keyLabel: '3',
      label: 'Bom',
      toneClass: 'border-ocean text-ocean hover:bg-ocean hover:text-canvas',
    },
    {
      grade: 4,
      keyLabel: '4',
      label: 'Fácil',
      toneClass: 'border-line-strong bg-ink text-canvas hover:opacity-90',
    },
  ];

  let queue = $state<FsrsPrompt[]>([]);
  let currentIndex = $state(0);
  let revealed = $state(false);
  let loading = $state(true);
  let busy = $state(false);
  let instantTransition = $state(false);
  let cardRenderTick = $state(0);
  let sessionDone = $state(0);
  let nextDueAt = $state<Date | null>(null);
  let lastFeedback = $state('');
  let intervals = $state<Record<ReviewGrade, string>>({
    1: '1 min',
    2: '6 min',
    3: '10 min',
    4: '4 dias',
  });
  let deckRoot: HTMLElement | undefined = $state();

  const currentPrompt = $derived(queue[currentIndex] ?? null);
  const totalInQueue = $derived(queue.length);

  async function refreshQueue(preservePractice = false) {
    const ids = prompts.map((p) => p.id);
    const summary = await getDueCardsSummary(ids);
    nextDueAt = summary.nextDueAt;

    if (!preservePractice) {
      const dueSet = new Set(summary.dueCardIds);
      queue = prompts.filter((p) => dueSet.has(p.id));
      currentIndex = 0;
      revealed = false;
    }
    loading = false;
  }

  async function loadIntervalsForCurrent() {
    if (!currentPrompt) return;
    intervals = await previewCardIntervals(currentPrompt.id);
  }

  $effect(() => {
    const active = currentPrompt;
    if (active && typeof indexedDB !== 'undefined') {
      void loadIntervalsForCurrent();
    }
  });

  onMount(() => {
    void refreshQueue(false);

    const onExternalUpdate = () => {
      if (!busy) {
        void refreshQueue(false);
      }
    };
    window.addEventListener(FSRS_UPDATED_EVENT, onExternalUpdate);
    return () => {
      window.removeEventListener(FSRS_UPDATED_EVENT, onExternalUpdate);
    };
  });

  async function revealAnswer(viaKeyboard = false) {
    if (!currentPrompt || revealed) return;
    instantTransition = viaKeyboard;
    revealed = true;
    await tick();
  }

  async function handleGrade(grade: ReviewGrade, viaKeyboard = false) {
    if (!currentPrompt || !revealed || busy) return;
    busy = true;
    instantTransition = viaKeyboard;

    try {
      const result = await scheduleCardReview(
        currentPrompt.id,
        grade,
        currentPrompt.moduleId
      );
      sessionDone += 1;
      lastFeedback = `${currentPrompt.category}: reagendado para ${result.intervalLabel}`;

      const remaining = queue.filter((p) => p.id !== currentPrompt.id);
      queue = remaining;
      currentIndex = 0;
      revealed = false;
      cardRenderTick += 1;

      const summary = await getDueCardsSummary(prompts.map((p) => p.id));
      nextDueAt = summary.nextDueAt;
    } finally {
      busy = false;
      if (viaKeyboard) {
        requestAnimationFrame(() => {
          instantTransition = false;
        });
      }
    }
  }

  function startPracticeAll() {
    instantTransition = false;
    queue = [...prompts];
    currentIndex = 0;
    revealed = false;
    cardRenderTick += 1;
    lastFeedback = 'Modo treino livre ativado (fila completa).';
  }

  function isElementInViewport(el: HTMLElement | undefined): boolean {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }
    if (document.documentElement.dataset.mode === 'cais') return;
    if (!currentPrompt || !isElementInViewport(deckRoot)) return;

    if (event.code === 'Space' && !revealed) {
      event.preventDefault();
      void revealAnswer(true);
      return;
    }

    if (revealed && ['1', '2', '3', '4'].includes(event.key)) {
      event.preventDefault();
      const grade = Number(event.key) as ReviewGrade;
      void handleGrade(grade, true);
    }
  }

  function formatNextDue(date: Date | null): string {
    if (!date) return 'agora';
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<section
  bind:this={deckRoot}
  id="revisao-fsrs"
  data-study-only
  aria-labelledby="fsrs-deck-title"
  class="my-10 border border-line-strong bg-surface p-5 sm:p-6"
>
  <div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3 mb-5">
    <div>
      <p class="font-mono text-[11px] font-bold uppercase tracking-widest text-salvage m-0">
        MEIO MNEMÔNICO · FSRS (RETENÇÃO ALVO 90%)
      </p>
      <h2 id="fsrs-deck-title" class="font-sans text-lg font-bold tracking-tight text-ink mt-1 mb-0">
        Recuperação Ativa de Convés
      </h2>
    </div>

    <div class="flex items-center gap-3 font-mono text-xs tabular-telemetry">
      <span class="text-ink-muted">
        FILA: <strong class="text-ink">{totalInQueue}</strong>
      </span>
      <span class="text-ink-muted">
        FEITAS: <strong class="text-ocean">{sessionDone}</strong>
      </span>
    </div>
  </div>

  {#if loading}
    <div class="border border-line bg-elevated p-5 font-mono text-xs text-ink-muted">
      Sincronizando estado FSRS local no IndexedDB...
    </div>
  {:else if currentPrompt}
    {#key cardRenderTick}
      <div
        class="mnemonic-card border border-line bg-elevated p-5 {instantTransition
          ? 'is-instant'
          : 'is-animated'}"
      >
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span class="font-mono text-[11px] font-bold uppercase tracking-wider text-ocean">
            {currentPrompt.category} · {currentPrompt.moduleId.toUpperCase()}
          </span>
          <span class="font-mono text-[11px] text-ink-muted tabular-telemetry">
            CARTÃO {String(currentIndex + 1).padStart(2, '0')} / {String(totalInQueue).padStart(2, '0')}
          </span>
        </div>

        <p class="font-editorial text-lg sm:text-xl leading-snug text-ink m-0">
          {currentPrompt.question}
        </p>

        {#if !revealed}
          <div class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <button
              type="button"
              onclick={() => revealAnswer(false)}
              class="cursor-pointer border border-line-strong bg-ink px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-canvas transition-colors hover:bg-salvage hover:border-salvage"
            >
              Revelar Resposta
            </button>
            <span class="font-mono text-[11px] text-ink-muted">
              Atalho: <kbd class="border border-line bg-surface px-1.5 py-0.5 text-ink">Espaço</kbd>
            </span>
          </div>
        {:else}
          <div
            class="mnemonic-answer mt-5 border-t border-line pt-4 {instantTransition
              ? 'is-instant'
              : 'is-animated'}"
          >
            <div class="border-l-3 border-salvage bg-salvage-soft/45 px-3.5 py-2.5 mb-3">
              <span class="block font-mono text-[10px] font-bold uppercase tracking-widest text-salvage mb-1">
                RESPOSTA DIRETA
              </span>
              <p class="font-sans text-sm sm:text-base font-bold leading-snug text-ink m-0">
                {currentPrompt.answer}
              </p>
            </div>

            <div class="mb-5">
              <span class="block font-mono text-[10px] font-bold uppercase tracking-widest text-ocean mb-1">
                MECANISMO CAUSAL
              </span>
              <p class="font-sans text-sm leading-relaxed text-ink-secondary m-0">
                {currentPrompt.causalExplanation}
              </p>
            </div>

            <div class="border-t border-line pt-3.5">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <span class="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  AVALIE SUA EVOCAÇÃO (FSRS)
                </span>
                <span class="font-mono text-[10px] text-ink-muted">
                  Atalhos 1–4 aplicam resposta instantânea (0 ms)
                </span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 tabular-telemetry">
                {#each RATING_OPTIONS as opt}
                  <button
                    type="button"
                    disabled={busy}
                    onclick={() => handleGrade(opt.grade, false)}
                    class="cursor-pointer border px-3 py-2 text-left transition-colors disabled:opacity-50 {opt.toneClass}"
                  >
                    <span class="flex items-center justify-between font-mono text-xs font-bold">
                      <span>{opt.label}</span>
                      <kbd class="border border-current/30 px-1 text-[10px] leading-tight">
                        {opt.keyLabel}
                      </kbd>
                    </span>
                    <span class="block font-mono text-[10px] opacity-80 mt-1">
                      {intervals[opt.grade]}
                    </span>
                  </button>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/key}
  {:else}
    <div class="border border-line bg-elevated p-5">
      <p class="font-mono text-xs font-bold uppercase tracking-wider text-ocean m-0">
        CONVOCAÇÃO CONCLUÍDA · SEM CARTÕES VENCIDOS
      </p>
      <p class="font-sans text-sm text-ink-secondary mt-2 mb-4">
        Todas as revisões programadas pelo algoritmo FSRS foram processadas neste navegador.
        {#if nextDueAt}
          Próxima janela prevista: <strong class="font-mono text-ink">{formatNextDue(nextDueAt)}</strong>.
        {/if}
      </p>
      <button
        type="button"
        onclick={startPracticeAll}
        class="cursor-pointer border border-line-strong bg-surface px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:border-salvage hover:text-salvage"
      >
        Revisar Baralho Novamente ({prompts.length})
      </button>
    </div>
  {/if}

  {#if lastFeedback}
    <p class="mt-3 font-mono text-[11px] text-ink-muted m-0" role="status">
      // {lastFeedback}
    </p>
  {/if}
</section>

<style>
  @keyframes ap-card-enter {
    from {
      opacity: 0.72;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .mnemonic-card.is-animated,
  .mnemonic-answer.is-animated {
    animation: ap-card-enter 200ms cubic-bezier(0.22, 1, 0.36, 1) both;
    transition: opacity 200ms cubic-bezier(0.22, 1, 0.36, 1),
      transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .mnemonic-card.is-instant,
  .mnemonic-answer.is-instant,
  .mnemonic-card.is-instant *,
  .mnemonic-answer.is-instant * {
    animation: none !important;
    transition: none !important;
  }
</style>
