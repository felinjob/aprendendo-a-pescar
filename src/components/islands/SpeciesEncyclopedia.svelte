<script lang="ts">
  export interface SpeciesEntry {
    id: string;
    commonName: string;
    scientificName: string;
    biome: 'Água Doce' | 'Estuário & Costão' | 'Oceânico';
    weightRange: string;
    rodPowerLb: [number, number];
    habitat: string;
    primaryLures: string;
    diagnosticTip: string;
    biologyAndLaw: string;
  }

  type BiomeFilter = 'todos' | SpeciesEntry['biome'];

  let { speciesList }: { speciesList: SpeciesEntry[] } = $props();

  let activeBiome = $state<BiomeFilter>('todos');
  let query = $state('');
  let selectedId = $state<string | null>(null);

  const BIOMES: Array<{ id: BiomeFilter; label: string }> = [
    { id: 'todos', label: 'Todas (22)' },
    { id: 'Água Doce', label: 'Água Doce' },
    { id: 'Estuário & Costão', label: 'Estuário & Costão' },
    { id: 'Oceânico', label: 'Oceânico' },
  ];

  const normalizedQuery = $derived(query.trim().toLowerCase());

  const filteredSpecies = $derived.by(() => {
    return speciesList.filter((sp) => {
      if (activeBiome !== 'todos' && sp.biome !== activeBiome) return false;
      if (!normalizedQuery) return true;
      const haystack = `${sp.commonName} ${sp.scientificName} ${sp.habitat} ${sp.primaryLures} ${sp.diagnosticTip} ${sp.biologyAndLaw}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  });

  const sortedByPower = $derived(
    [...filteredSpecies].sort((a, b) => b.rodPowerLb[1] - a.rodPowerLb[1])
  );

  const MAX_LB = 130;

  function biomeAccent(biome: SpeciesEntry['biome']): string {
    if (biome === 'Oceânico') return 'var(--oi-blue)';
    if (biome === 'Estuário & Costão') return 'var(--oi-bluish-green)';
    return 'var(--oi-orange)';
  }
</script>

<section
  id="enciclopedia-especies"
  data-cais-keep
  aria-labelledby="species-enc-title"
  class="console-band tufte-full-bleed"
>
  <header class="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5 mb-6">
    <div>
      <p class="m-0 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-salvage">
        Atlas Biológico &amp; Tático · 22 Espécies Brasileiras
      </p>
      <h2 id="species-enc-title" class="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1.5 mb-0">
        Enciclopédia Estratégica de Espécies
      </h2>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <label class="sr-only" for="species-search">Filtrar espécies</label>
      <input
        id="species-search"
        type="search"
        bind:value={query}
        placeholder="Buscar espécie, isca ou habitat..."
        class="w-60 sm:w-72 border-b border-line-strong bg-transparent px-1 py-1.5 font-mono text-xs text-ink placeholder:text-ink-muted focus:border-salvage focus:outline-none"
      />
    </div>
  </header>

  <!-- Filtro por bioma (filete horizontal limpo, sem cápsulas) -->
  <div class="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-3 mb-6">
    <div class="flex flex-wrap gap-5" role="tablist" aria-label="Filtrar por bioma">
      {#each BIOMES as b}
        {@const active = activeBiome === b.id}
        <button
          type="button"
          role="tab"
          aria-selected={active}
          onclick={() => (activeBiome = b.id)}
          class="cursor-pointer bg-transparent border-0 pb-2 -mb-[13px] border-b-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors {active
            ? 'border-salvage text-ink'
            : 'border-transparent text-ink-muted hover:text-ink'}"
        >
          {b.label}
        </button>
      {/each}
    </div>

    <span class="font-mono text-[11px] text-ink-muted tabular-telemetry">
      Exibindo {filteredSpecies.length} de {speciesList.length} espécies
    </span>
  </div>

  <!-- Gráfico Comparativo de Escala de Combate (4 lb -> 130 lb) -->
  {#if sortedByPower.length > 0}
    <div class="mb-8 pb-6 border-b border-line">
      <div class="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <p class="m-0 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          Escala de Potência Recomendada da Vara (lb) · Clique numa faixa para destacar ficha
        </p>
        <div class="flex flex-wrap items-center gap-4 font-mono text-[10px] text-ink-secondary">
          <span class="inline-flex items-center gap-1.5">
            <span class="inline-block w-2.5 h-2.5" style="background: var(--oi-blue);"></span>
            Oceânico
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="inline-block w-2.5 h-2.5" style="background: var(--oi-bluish-green);"></span>
            Estuário &amp; Costão
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="inline-block w-2.5 h-2.5" style="background: var(--oi-orange);"></span>
            Água Doce
          </span>
        </div>
      </div>

      <div class="flex flex-col gap-1.5 tabular-telemetry">
        {#each sortedByPower as sp (sp.id)}
          {@const leftPct = (sp.rodPowerLb[0] / MAX_LB) * 100}
          {@const widthPct = Math.max(4, ((sp.rodPowerLb[1] - sp.rodPowerLb[0]) / MAX_LB) * 100)}
          {@const isSelected = selectedId === sp.id}
          <button
            type="button"
            onclick={() => (selectedId = isSelected ? null : sp.id)}
            class="grid grid-cols-[150px_1fr_76px] sm:grid-cols-[190px_1fr_84px] items-center gap-3 py-1 px-1.5 text-left cursor-pointer border-0 transition-colors {isSelected
              ? 'bg-elevated'
              : 'bg-transparent hover:bg-elevated/60'}"
          >
            <span class="font-sans text-xs font-medium text-ink truncate">
              {sp.commonName}
            </span>
            <span class="relative block h-2.5 w-full bg-canvas/80">
              <span
                class="absolute top-0 bottom-0 block transition-all"
                style="left: {leftPct}%; width: {widthPct}%; background-color: {biomeAccent(sp.biome)};"
              ></span>
            </span>
            <span class="font-mono text-[11px] font-semibold text-ink-secondary text-right">
              {sp.rodPowerLb[0]}–{sp.rodPowerLb[1]} lb
            </span>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Fichas Editoriais Abertas (Sem Caixas Uniformes) -->
  {#if filteredSpecies.length === 0}
    <p class="py-8 text-center font-mono text-xs text-ink-muted m-0">
      Nenhuma espécie corresponde à busca "{query}".
    </p>
  {:else}
    <div class="divide-y divide-line">
      {#each filteredSpecies as sp (sp.id)}
        {@const highlighted = selectedId === sp.id}
        <article
          class="py-6 transition-colors {highlighted ? 'bg-elevated px-4 -mx-4' : ''}"
        >
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
            <div class="lg:col-span-4">
              <p class="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                {sp.biome} · {sp.rodPowerLb[0]}–{sp.rodPowerLb[1]} lb
              </p>
              <h3 class="font-display text-xl font-semibold text-ink mt-1 mb-0.5">
                {sp.commonName}
              </h3>
              <p class="m-0 font-mono text-xs italic text-ocean">
                {sp.scientificName}
              </p>
              <p class="mt-2 mb-0 font-mono text-xs text-ink-secondary tabular-telemetry">
                Porte típico: <strong class="text-ink">{sp.weightRange}</strong>
              </p>
            </div>

            <div class="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm leading-relaxed">
              <div>
                <span class="block font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-0.5">
                  Habitat &amp; Leitura
                </span>
                <p class="m-0 text-ink-secondary">{sp.habitat}</p>
              </div>
              <div>
                <span class="block font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-0.5">
                  Iscas &amp; Apresentação
                </span>
                <p class="m-0 text-ink-secondary">{sp.primaryLures}</p>
              </div>
              <div>
                <span class="block font-mono text-[10px] font-semibold uppercase tracking-wider text-salvage mb-0.5">
                  Diagnóstico de Especialista
                </span>
                <p class="m-0 text-ink">{sp.diagnosticTip}</p>
              </div>
              <div>
                <span class="block font-mono text-[10px] font-semibold uppercase tracking-wider text-ocean mb-0.5">
                  Biologia &amp; Norma 2026
                </span>
                <p class="m-0 text-ink-secondary">{sp.biologyAndLaw}</p>
              </div>
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>
