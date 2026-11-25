<script lang="ts">
  import {
    FSRS_UPDATED_EVENT,
    getDb,
    isIndexedDbAvailable,
    notifyFsrsUpdated,
  } from '../../lib/db';

  interface ChecklistStep {
    id: string;
    order: number;
    title: string;
    detail: string;
    criticalAlert?: string;
  }

  const STEPS: ChecklistStep[] = [
    {
      id: 'post-mar-01-fechar-drag',
      order: 1,
      title: 'Fechar o drag antes de molhar',
      detail:
        'Trave totalmente a alavanca ou a estrela do freio antes de encostar água doce. Comprimir o conjunto de discos veda o pacote e bloqueia a entrada de água e sal nas arruelas internas.',
    },
    {
      id: 'post-mar-02-nevoa-suave',
      order: 2,
      title: 'Enxaguar com névoa suave (nunca jato forte nem balde)',
      detail:
        'Use borrifador ou chuveirinho suave de água doce, girando o line roller dos molinetes com o dedo sob a névoa para expulsar o sal cristalizado.',
      criticalAlert:
        'PROIBIDO JATO DE MANGUEIRA OU IMERSÃO EM BALDE: pressão ou mergulho empurram água salgada e areia para dentro dos retentores e rolamentos.',
    },
    {
      id: 'post-mar-03-secar-sombra',
      order: 3,
      title: 'Secar à sombra com microfibra',
      detail:
        'Enxugue com pano de microfibra limpo e deixe secar em local ventilado à sombra. Nunca guarde equipamento úmido em saco plástico fechado nem aplique secador quente.',
    },
    {
      id: 'post-mar-04-soltar-drag',
      order: 4,
      title: 'Soltar totalmente o drag para guardar',
      detail:
        'Com a carretilha seca, alivie alavanca ou estrela até o mínimo. Deixar o freio fechado no armário comprime e deforma os discos de carbono/feltro, causando trancos na próxima briga.',
    },
    {
      id: 'post-mar-05-lubrificar-criterio',
      order: 5,
      title: 'Lubrificar com critério (Zero WD-40 / Zero óleo em MagSealed)',
      detail:
        'Aplique apenas óleo fino específico nos pontos externos indicados pelo fabricante.',
      criticalAlert:
        'PROIBIDO WD-40 E ÓLEO EM DAIWA MAGSEALED: desengripantes multiuso lavam a graxa original das engrenagens; roletes e rolamentos MagSealed recebem só água doce suave externamente (óleo comum destrói o fluido magnético).',
    },
  ];

  let completedMap = $state<Record<string, boolean>>({});
  let updatedMap = $state<Record<string, string>>({});
  let isLoading = $state(true);
  let statusNote = $state<string | null>(null);

  const completedCount = $derived(
    STEPS.filter((step) => Boolean(completedMap[step.id])).length
  );
  const totalCount = STEPS.length;
  const progressPct = $derived(Math.round((completedCount / totalCount) * 100));
  const allDone = $derived(completedCount === totalCount);

  async function loadChecklistFromDb() {
    if (!isIndexedDbAvailable()) {
      isLoading = false;
      return;
    }
    try {
      const db = getDb();
      const rows = await db.checklistProgress.toArray();
      const nextCompleted: Record<string, boolean> = {};
      const nextUpdated: Record<string, string> = {};
      for (const row of rows) {
        nextCompleted[row.itemId] = Boolean(row.completed);
        if (row.updatedAt instanceof Date && !Number.isNaN(row.updatedAt.getTime())) {
          nextUpdated[row.itemId] = row.updatedAt.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      }
      completedMap = nextCompleted;
      updatedMap = nextUpdated;
    } catch {
      statusNote = 'IndexedDB indisponível neste navegador; estado apenas na sessão.';
    } finally {
      isLoading = false;
    }
  }

  async function toggleItem(itemId: string) {
    const nextVal = !completedMap[itemId];
    const now = new Date();
    completedMap = { ...completedMap, [itemId]: nextVal };
    updatedMap = {
      ...updatedMap,
      [itemId]: now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    statusNote = null;

    if (!isIndexedDbAvailable()) return;
    try {
      const db = getDb();
      await db.checklistProgress.put({
        itemId,
        completed: nextVal,
        updatedAt: now,
      });
      notifyFsrsUpdated();
    } catch {
      statusNote = 'Falha ao gravar progresso local no IndexedDB.';
    }
  }

  async function resetForNewTrip() {
    const now = new Date();
    const nextCompleted: Record<string, boolean> = {};
    for (const step of STEPS) {
      nextCompleted[step.id] = false;
    }
    completedMap = nextCompleted;
    updatedMap = {};
    statusNote = 'Checklist zerado para a próxima saída ao mar.';

    if (!isIndexedDbAvailable()) return;
    try {
      const db = getDb();
      await db.transaction('rw', db.checklistProgress, async () => {
        await db.checklistProgress.bulkPut(
          STEPS.map((step) => ({
            itemId: step.id,
            completed: false,
            updatedAt: now,
          }))
        );
      });
      notifyFsrsUpdated();
    } catch {
      statusNote = 'Falha ao resetar registros locais no IndexedDB.';
    }
  }

  $effect(() => {
    void loadChecklistFromDb();

    if (typeof window === 'undefined') return;
    const onExternalUpdate = () => {
      void loadChecklistFromDb();
    };
    window.addEventListener(FSRS_UPDATED_EVENT, onExternalUpdate);

    return () => {
      window.removeEventListener(FSRS_UPDATED_EVENT, onExternalUpdate);
    };
  });
</script>

<section
  id="checklist-pos-mar"
  data-cais-keep
  aria-labelledby="checklist-pos-mar-title"
  class="tufte-full-bleed border border-line-strong bg-elevated p-4 sm:p-6 my-8"
>
  <header class="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4 mb-5">
    <div>
      <p class="font-mono text-[11px] font-bold uppercase tracking-widest text-salvage m-0">
        MANUTENÇÃO PÓS-MAR · LOCAL-FIRST (INDEXEDDB)
      </p>
      <h2
        id="checklist-pos-mar-title"
        class="font-sans text-xl sm:text-2xl font-bold tracking-tight text-ink mt-1 mb-0"
      >
        Checklist Pós-Mar de Lavagem &amp; Preservação da Tralha
      </h2>
      <p class="font-sans text-xs sm:text-sm text-ink-secondary mt-1 mb-0">
        Ordem obrigatória no cais antes de guardar as carretilhas e molinetes. Persistido localmente em <code>PescaEstudoDB</code> mesmo sem sinal.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2.5 tabular-telemetry">
      <span
        class="px-2.5 py-1 border font-mono text-xs font-bold {allDone
          ? 'border-ocean bg-ocean text-elevated'
          : 'border-line-strong bg-surface text-ink'}"
      >
        {completedCount}/{totalCount} CONCLUÍDOS ({progressPct}%)
      </span>

      <button
        type="button"
        onclick={resetForNewTrip}
        class="px-3 py-1.5 border border-line-strong bg-surface font-mono text-xs font-bold uppercase tracking-wider text-ink cursor-pointer hover:border-salvage hover:text-salvage transition-colors"
      >
        Resetar p/ Nova Saída
      </button>
    </div>
  </header>

  <!-- Barra de Progresso -->
  <div class="mb-5">
    <div class="h-2.5 w-full border border-line-strong bg-surface overflow-hidden">
      <div
        class="h-full transition-all {allDone ? 'bg-ocean' : 'bg-salvage'}"
        style="width: {progressPct}%"
      ></div>
    </div>
    {#if isLoading}
      <p class="font-mono text-[11px] text-ink-muted mt-1.5 mb-0">
        Carregando progresso salvo do IndexedDB...
      </p>
    {:else if statusNote}
      <p class="font-mono text-[11px] font-bold text-ocean mt-1.5 mb-0" role="status">
        {statusNote}
      </p>
    {:else if allDone}
      <p class="font-mono text-[11px] font-bold text-ocean mt-1.5 mb-0" role="status">
        TRALHA LAVADA, SECA E COM DRAG ALIVIADO · PRONTA PARA PRÓXIMA SAÍDA.
      </p>
    {/if}
  </div>

  <!-- Os 5 Passos de Convés -->
  <ul class="list-none p-0 m-0 flex flex-col gap-3">
    {#each STEPS as step (step.id)}
      {@const checked = Boolean(completedMap[step.id])}
      <li>
        <label
          class="flex items-start gap-3.5 border p-4 cursor-pointer transition-colors {checked
            ? 'border-ocean bg-ocean-soft'
            : 'border-line-strong bg-surface hover:border-salvage'}"
        >
          <input
            type="checkbox"
            checked={checked}
            onchange={() => toggleItem(step.id)}
            class="mt-1 h-4 w-4 shrink-0 accent-salvage cursor-pointer"
          />

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <span
                class="font-sans text-base font-bold {checked
                  ? 'line-through text-ink-secondary'
                  : 'text-ink'}"
              >
                {step.order}. {step.title}
              </span>
              {#if checked && updatedMap[step.id]}
                <span class="font-mono text-[10px] font-bold text-ocean tabular-telemetry">
                  CONCLUÍDO ÀS {updatedMap[step.id]}
                </span>
              {/if}
            </div>

            <p class="font-editorial text-sm leading-relaxed text-ink-secondary mt-1 mb-0">
              {step.detail}
            </p>

            {#if step.criticalAlert}
              <p class="mt-2 mb-0 border-l-4 border-salvage bg-salvage-soft px-3 py-2 font-mono text-[11px] font-bold text-salvage leading-snug">
                {step.criticalAlert}
              </p>
            {/if}
          </div>
        </label>
      </li>
    {/each}
  </ul>
</section>
