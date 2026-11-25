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
  class="console-band tufte-full-bleed"
>
  <header class="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5 mb-5">
    <div>
      <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-salvage m-0">
        Manutenção Pós-Mar · Persistência Local (IndexedDB)
      </p>
      <h2
        id="checklist-pos-mar-title"
        class="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1.5 mb-0"
      >
        Checklist Pós-Mar de Lavagem &amp; Preservação da Tralha
      </h2>
      <p class="text-sm text-ink-secondary mt-1.5 mb-0 max-w-[66ch]">
        Sequência obrigatória no cais antes de guardar carretilhas e molinetes. Progresso salvo localmente mesmo sem sinal no mar.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-4 tabular-telemetry">
      <span class="font-mono text-xs font-semibold {allDone ? 'text-ocean' : 'text-ink'}">
        {completedCount}/{totalCount} concluídos ({progressPct}%)
      </span>

      <button
        type="button"
        onclick={resetForNewTrip}
        class="px-3 py-1.5 border border-line-strong bg-elevated font-mono text-xs font-semibold uppercase tracking-wider text-ink cursor-pointer hover:border-salvage hover:text-salvage transition-colors"
      >
        Resetar p/ Nova Saída
      </button>
    </div>
  </header>

  <div class="mb-6">
    <div class="h-1.5 w-full bg-canvas overflow-hidden">
      <div
        class="h-full transition-all {allDone ? 'bg-ocean' : 'bg-salvage'}"
        style="width: {progressPct}%"
      ></div>
    </div>
    {#if isLoading}
      <p class="font-mono text-xs text-ink-muted mt-2 mb-0">Carregando progresso salvo...</p>
    {:else if statusNote}
      <p class="font-mono text-xs font-semibold text-ocean mt-2 mb-0" role="status">{statusNote}</p>
    {:else if allDone}
      <p class="font-mono text-xs font-semibold text-ocean mt-2 mb-0" role="status">
        Tralha lavada, seca e com drag aliviado — pronta para a próxima saída.
      </p>
    {/if}
  </div>

  <ul class="list-none p-0 m-0 divide-y divide-line">
    {#each STEPS as step (step.id)}
      {@const checked = Boolean(completedMap[step.id])}
      <li>
        <label class="flex items-start gap-4 py-4 cursor-pointer transition-colors {checked ? 'opacity-75' : ''}">
          <input
            type="checkbox"
            checked={checked}
            onchange={() => toggleItem(step.id)}
            class="mt-1 h-4 w-4 shrink-0 accent-salvage cursor-pointer"
          />

          <div class="min-w-0 flex-1 max-w-[66ch]">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <span
                class="font-display text-lg font-semibold {checked
                  ? 'line-through text-ink-secondary'
                  : 'text-ink'}"
              >
                {step.order}. {step.title}
              </span>
              {#if checked && updatedMap[step.id]}
                <span class="font-mono text-[11px] font-semibold text-ocean tabular-telemetry">
                  Concluído às {updatedMap[step.id]}
                </span>
              {/if}
            </div>

            <p class="text-sm leading-relaxed text-ink-secondary mt-1 mb-0">
              {step.detail}
            </p>

            {#if step.criticalAlert}
              <p class="mt-2.5 mb-0 pt-2 border-t border-salvage/40 font-mono text-xs font-semibold text-salvage leading-snug">
                {step.criticalAlert}
              </p>
            {/if}
          </div>
        </label>
      </li>
    {/each}
  </ul>
</section>

