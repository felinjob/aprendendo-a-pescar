<script lang="ts">
  export interface LegislationItem {
    id: string;
    commonName: string;
    scientificName: string;
    statusMMA2026: string;
    regimeCategory: 'proibida' | 'cota' | 'defeso' | 'monitorada';
    legalBasis: string;
    regime2026: string;
    closedSeason?: string;
    minMaxSize?: string;
    notes: string;
  }

  type FilterRegime = 'todas' | 'proibida' | 'cota' | 'defeso';

  interface CalendarRow {
    species: string;
    months: number[];
    regime: string;
    color: string;
  }

  interface ExclusionZone {
    name: string;
    location: string;
    radiusOrLimit: string;
    detail: string;
  }

  let { items }: { items: LegislationItem[] } = $props();

  let searchQuery = $state('');
  let activeFilter = $state<FilterRegime>('todas');

  const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const CALENDAR_ROWS: CalendarRow[] = [
    {
      species: 'Peroá / Miragaia / Mero / Pargo / Badejo-Mira',
      months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      regime: 'Captura zero (ano inteiro · Portarias 1.666 e 1.667/2026)',
      color: 'var(--oi-vermilion)',
    },
    {
      species: 'Marlin-Branco / Tarpon / Atum-Azul',
      months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      regime: 'Retenção proibida · Apenas C&R / Liberação imediata',
      color: 'var(--oi-orange)',
    },
    {
      species: 'Sirigado, Badejo-Quadrado & Caranha',
      months: [7, 8],
      regime: 'Defeso Grandes Recifais (Agosto e Setembro)',
      color: 'var(--oi-purple)',
    },
    {
      species: 'Cherne-Verdadeiro & Peixe-Batata',
      months: [8, 9],
      regime: 'Defeso Profundo SE/S (Setembro e Outubro)',
      color: 'var(--oi-blue)',
    },
    {
      species: 'Garoupa-Verdadeira (SE/S)',
      months: [10, 11, 0, 1],
      regime: 'Defeso 1º nov–28 fev · Fora do defeso: janela 47–73 cm',
      color: 'var(--oi-sky)',
    },
    {
      species: 'Robalo-Flecha & Peva (RJ/SP)',
      months: [10, 11],
      regime: 'Defeso reprodutivo estuarino (1º nov a 31 dez)',
      color: 'var(--oi-bluish-green)',
    },
    {
      species: 'Anchova (Sul / Sudeste)',
      months: [11, 0, 1, 2],
      regime: 'Defeso 1º dez a 31 mar · Mínimo 35 cm',
      color: 'var(--accent-ocean)',
    },
    {
      species: 'Piracema Continental (Água Doce)',
      months: [10, 11, 0, 1],
      regime: 'Defeso reprodutivo bacias nativas (1º nov a 28 fev)',
      color: 'var(--accent-salvage)',
    },
  ];

  const EXCLUSION_ZONES: ExclusionZone[] = [
    {
      name: 'MoNa Ilhas Cagarras (RJ)',
      location: 'Largo de Ipanema / Barra · Rio de Janeiro',
      radiusOrLimit: 'Raio 10 m das ilhas + zonas de exclusão',
      detail: 'Unidade de Proteção Integral com regras específicas no entorno imediato e fiscalização frequente de ICMBio e Marinha.',
    },
    {
      name: 'ESEC Tamoios (RJ)',
      location: 'Baía da Ilha Grande (Angra / Paraty)',
      radiusOrLimit: 'Raio de 1 km ao redor de 29 ilhas/lajes',
      detail: 'Proibição absoluta de pesca, fundeio e permanência dentro do raio de 1 km das ilhas da Estação Ecológica.',
    },
    {
      name: 'RESEX Marinha de Arraial do Cabo (RJ)',
      location: 'Cabo Frio / Arraial do Cabo',
      radiusOrLimit: 'Acesso restrito a pescadores artesanais',
      detail: 'Uso exclusivo de pescadores tradicionais cadastrados na reserva; embarcações esportivas visitantes estão proibidas de pescar na poligonal.',
    },
    {
      name: 'Alcatrazes & PEM Laje de Santos (SP)',
      location: 'Litoral Norte e Centro de São Paulo',
      radiusOrLimit: 'Poligonal integral de proteção',
      detail: 'Refúgio de Vida Silvestre de Alcatrazes e Parque Estadual Marinho da Laje de Santos vedam totalmente pesca recreativa e embarcada.',
    },
    {
      name: 'Plataformas de Petróleo & Gás (Bacias de Campos/Santos)',
      location: 'Águas jurisdicionais brasileiras',
      radiusOrLimit: 'Raio de 500 m (Normam / Marinha)',
      detail: 'Zona de segurança obrigatória ao redor de plataformas, FPSOs e monoboias. Apesar de concentrarem atuns e dourados, invadir os 500 m gera autuação federal imediata.',
    },
  ];

  const normalizedQuery = $derived(searchQuery.trim().toLowerCase());

  const filteredItems = $derived.by(() => {
    return items.filter((item) => {
      if (activeFilter !== 'todas' && item.regimeCategory !== activeFilter) {
        return false;
      }
      if (!normalizedQuery) return true;
      const haystack = `${item.commonName} ${item.scientificName} ${item.statusMMA2026} ${item.legalBasis} ${item.regime2026} ${item.notes}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  });

  const prohibitedCount = $derived(items.filter((i) => i.regimeCategory === 'proibida').length);
  const cotaCount = $derived(items.filter((i) => i.regimeCategory === 'cota').length);
  const defesoCount = $derived(items.filter((i) => i.regimeCategory === 'defeso').length);

  function statusLabel(cat: LegislationItem['regimeCategory']): { text: string; tone: string } {
    if (cat === 'proibida') return { text: 'PROIBIDA / CAPTURA ZERO', tone: 'text-salvage' };
    if (cat === 'cota') return { text: 'C&R / JANELA & COTA', tone: 'text-ocean' };
    return { text: 'DEFESO SAZONAL', tone: 'text-ink' };
  }
</script>

<section
  id="legislacao-2026"
  data-cais-keep
  aria-labelledby="legislacao-2026-title"
  class="console-band tufte-full-bleed"
>
  <header class="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5 mb-6">
    <div>
      <p class="m-0 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-salvage">
        Vigência Nacional · Portarias GM/MMA nº 1.666 e 1.667/2026 (27/10/2026)
      </p>
      <h2
        id="legislacao-2026-title"
        class="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1.5 mb-0"
      >
        Explorador Legal 2026/2027, Defesos &amp; Zonas de Exclusão
      </h2>
    </div>

    <input
      type="search"
      bind:value={searchQuery}
      placeholder="Buscar espécie (Peroá, Miragaia, Garoupa)..."
      aria-label="Buscar espécie na legislação 2026"
      class="w-64 sm:w-80 border-b border-line-strong bg-transparent px-1 py-1.5 font-mono text-xs text-ink placeholder:text-ink-muted focus:border-salvage focus:outline-none"
    />
  </header>

  <!-- Filtro por Regime -->
  <div class="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-3 mb-6">
    <div class="flex flex-wrap gap-5" role="tablist" aria-label="Filtrar espécies por regime legal">
      <button
        type="button"
        role="tab"
        aria-selected={activeFilter === 'todas'}
        onclick={() => (activeFilter = 'todas')}
        class="cursor-pointer bg-transparent border-0 pb-2 -mb-[13px] border-b-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors {activeFilter === 'todas'
          ? 'border-salvage text-ink'
          : 'border-transparent text-ink-muted hover:text-ink'}"
      >
        Todas ({items.length})
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeFilter === 'proibida'}
        onclick={() => (activeFilter = 'proibida')}
        class="cursor-pointer bg-transparent border-0 pb-2 -mb-[13px] border-b-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors {activeFilter === 'proibida'
          ? 'border-salvage text-salvage'
          : 'border-transparent text-ink-muted hover:text-ink'}"
      >
        Proibidas ({prohibitedCount})
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeFilter === 'cota'}
        onclick={() => (activeFilter = 'cota')}
        class="cursor-pointer bg-transparent border-0 pb-2 -mb-[13px] border-b-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors {activeFilter === 'cota'
          ? 'border-ocean text-ocean'
          : 'border-transparent text-ink-muted hover:text-ink'}"
      >
        C&amp;R / Janela ({cotaCount})
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeFilter === 'defeso'}
        onclick={() => (activeFilter = 'defeso')}
        class="cursor-pointer bg-transparent border-0 pb-2 -mb-[13px] border-b-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors {activeFilter === 'defeso'
          ? 'border-line-strong text-ink'
          : 'border-transparent text-ink-muted hover:text-ink'}"
      >
        Defeso Sazonal ({defesoCount})
      </button>
    </div>

    <span class="font-mono text-[11px] text-ink-muted tabular-telemetry">
      {filteredItems.length} registro(s)
    </span>
  </div>

  <!-- Tabela Editorial de Espécies Regulamentadas -->
  {#if filteredItems.length === 0}
    <p class="py-8 text-center font-mono text-xs text-ink-muted m-0">
      Nenhuma espécie corresponde aos critérios informados.
    </p>
  {:else}
    <div class="overflow-x-auto mb-10">
      <table class="editorial-table">
        <thead>
          <tr>
            <th class="min-w-[180px]">Espécie &amp; Status MMA</th>
            <th class="min-w-[140px]">Regime / Janela</th>
            <th class="min-w-[260px]">Norma 2026 &amp; Conduta no Convés</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredItems as item (item.id)}
            {@const meta = statusLabel(item.regimeCategory)}
            <tr>
              <td>
                <strong class="block font-display text-base font-semibold text-ink">
                  {item.commonName}
                </strong>
                <span class="block font-mono text-[11px] italic text-ocean">
                  {item.scientificName}
                </span>
                <span class="mt-1 inline-block font-mono text-[10px] font-semibold uppercase tracking-wider {meta.tone}">
                  {item.statusMMA2026}
                </span>
              </td>
              <td class="font-mono text-xs">
                <strong class="block text-ink">{meta.text}</strong>
                {#if item.closedSeason}
                  <span class="block text-[11px] text-ink-secondary mt-1">{item.closedSeason}</span>
                {/if}
                {#if item.minMaxSize}
                  <span class="block text-[11px] text-salvage font-semibold mt-0.5">{item.minMaxSize}</span>
                {/if}
              </td>
              <td>
                <p class="m-0 text-sm text-ink">{item.regime2026}</p>
                <p class="mt-1.5 mb-0 text-xs text-ink-secondary">{item.notes}</p>
                <p class="mt-1 mb-0 font-mono text-[10px] text-ink-muted">
                  Base: {item.legalBasis}
                </p>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <!-- Calendário Integrado de Defesos 2026/2027 (Jan–Dez) -->
  <div class="pt-6 border-t border-line-strong mb-10">
    <p class="m-0 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ocean">
      Calendário Integrado 2026 / 2027
    </p>
    <h3 class="font-display text-xl font-semibold text-ink mt-1 mb-4">
      Janelas de Defeso &amp; Moratórias (Jan a Dez)
    </h3>

    <div class="overflow-x-auto">
      <table class="editorial-table min-w-[660px]">
        <thead>
          <tr>
            <th class="w-56">Grupo / Espécie</th>
            {#each MONTHS as m}
              <th class="text-center !px-1">{m}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each CALENDAR_ROWS as row}
            <tr>
              <td>
                <strong class="block text-xs font-semibold text-ink">{row.species}</strong>
                <span class="block font-mono text-[10px] text-ink-muted mt-0.5">{row.regime}</span>
              </td>
              {#each MONTHS as _, monthIdx}
                {@const isClosed = row.months.includes(monthIdx)}
                <td class="text-center !px-1 align-middle">
                  <span
                    class="inline-block h-4 w-full"
                    style="background-color: {isClosed ? row.color : 'transparent'}; border-bottom: {isClosed ? 'none' : '1px dotted var(--border-hairline)'};"
                    title="{row.species} — {MONTHS[monthIdx]}: {isClosed ? 'Restrição / Defeso' : 'Aberto sob norma'}"
                  ></span>
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- 5 Zonas de Exclusão Críticas -->
  <div class="pt-6 border-t border-line">
    <p class="m-0 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-salvage">
      Restrição Geográfica Absoluta
    </p>
    <h3 class="font-display text-xl font-semibold text-ink mt-1 mb-4">
      5 Zonas de Exclusão &amp; Proibição Críticas no Sudeste
    </h3>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
      {#each EXCLUSION_ZONES as zone}
        <div class="border-t border-line pt-3">
          <strong class="block font-display text-base font-semibold text-ink">{zone.name}</strong>
          <span class="block font-mono text-[10px] uppercase tracking-wider text-ocean mt-0.5">
            {zone.location}
          </span>
          <span class="block font-mono text-xs font-semibold text-salvage mt-1">
            {zone.radiusOrLimit}
          </span>
          <p class="mt-1.5 mb-0 text-xs leading-relaxed text-ink-secondary">
            {zone.detail}
          </p>
        </div>
      {/each}
    </div>
  </div>
</section>
