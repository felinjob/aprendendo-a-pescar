<script lang="ts">
  export interface GlossaryEntry {
    id: string;
    term: string;
    category: 'Oceânica & Cais' | 'Água Doce & Costão' | 'Mecânica & Tralha' | 'Biologia & Lei';
    shortDef: string;
    causalMechanism: string;
  }

  type CatFilter = 'todos' | GlossaryEntry['category'];

  let { terms }: { terms: GlossaryEntry[] } = $props();

  let activeCat = $state<CatFilter>('todos');
  let query = $state('');

  const CATEGORIES: Array<{ id: CatFilter; label: string }> = [
    { id: 'todos', label: 'Todos' },
    { id: 'Oceânica & Cais', label: 'Oceânica & Cais' },
    { id: 'Água Doce & Costão', label: 'Água Doce & Costão' },
    { id: 'Mecânica & Tralha', label: 'Mecânica & Tralha' },
    { id: 'Biologia & Lei', label: 'Biologia & Lei' },
  ];

  const normalized = $derived(query.trim().toLowerCase());

  const filtered = $derived.by(() => {
    return [...terms]
      .filter((t) => {
        if (activeCat !== 'todos' && t.category !== activeCat) return false;
        if (!normalized) return true;
        return `${t.term} ${t.shortDef} ${t.causalMechanism} ${t.category}`
          .toLowerCase()
          .includes(normalized);
      })
      .sort((a, b) => a.term.localeCompare(b.term, 'pt-BR'));
  });
</script>

<section
  id="glossario-global"
  data-cais-keep
  aria-labelledby="glossary-explorer-title"
  class="console-band tufte-full-bleed"
>
  <header class="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5 mb-6">
    <div>
      <p class="m-0 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-salvage">
        Vocabulário Técnico &amp; Dicionário de Cais · {terms.length} Verbetes
      </p>
      <h2 id="glossary-explorer-title" class="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1.5 mb-0">
        Glossário Causal Completo
      </h2>
    </div>

    <input
      type="search"
      bind:value={query}
      placeholder="Buscar termo (ex.: sancocho, arbor slip)..."
      aria-label="Buscar termo no glossário"
      class="w-64 sm:w-80 border-b border-line-strong bg-transparent px-1 py-1.5 font-mono text-xs text-ink placeholder:text-ink-muted focus:border-salvage focus:outline-none"
    />
  </header>

  <div class="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-3 mb-6">
    <div class="flex flex-wrap gap-5" role="tablist" aria-label="Categorias do glossário">
      {#each CATEGORIES as cat}
        {@const active = activeCat === cat.id}
        <button
          type="button"
          role="tab"
          aria-selected={active}
          onclick={() => (activeCat = cat.id)}
          class="cursor-pointer bg-transparent border-0 pb-2 -mb-[13px] border-b-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors {active
            ? 'border-salvage text-ink'
            : 'border-transparent text-ink-muted hover:text-ink'}"
        >
          {cat.label}
        </button>
      {/each}
    </div>

    <span class="font-mono text-[11px] text-ink-muted tabular-telemetry">
      {filtered.length} termo(s)
    </span>
  </div>

  {#if filtered.length === 0}
    <p class="py-8 text-center font-mono text-xs text-ink-muted m-0">
      Nenhum verbete encontrado para "{query}".
    </p>
  {:else}
    <dl class="m-0 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-0">
      {#each filtered as entry (entry.id)}
        <div class="border-b border-line py-4">
          <dt class="flex flex-wrap items-baseline justify-between gap-2">
            <span class="font-display text-lg font-semibold text-ink">{entry.term}</span>
            <span class="font-mono text-[10px] uppercase tracking-wider text-ocean">
              {entry.category}
            </span>
          </dt>
          <dd class="m-0 mt-1.5 text-sm leading-relaxed text-ink">
            {entry.shortDef}
          </dd>
          <dd class="m-0 mt-2 text-xs leading-relaxed text-ink-secondary">
            <strong class="font-mono text-[10px] uppercase tracking-wider text-salvage mr-1">
              Causa → Efeito:
            </strong>
            {entry.causalMechanism}
          </dd>
        </div>
      {/each}
    </dl>
  {/if}
</section>
