<script lang="ts">
  export interface LegislationEntry {
    id: string;
    commonName: string;
    scientificName: string;
    statusMMA2026: string;
    legalRegime: string;
    closedSeason: string;
  }

  interface CalendarMonth {
    code: string;
    isCurrent: boolean;
  }

  interface CalendarRow {
    label: string;
    rule: string;
    cells: Array<{ text: string; tone: 'prohibited' | 'closed' | 'catch-release' | 'open' | 'peak' }>;
  }

  interface ExclusionZone {
    id: string;
    name: string;
    uf: string;
    category: string;
    rule: string;
    cx: number;
    cy: number;
    r: number;
  }

  let { entries = [] }: { entries: LegislationEntry[] } = $props();

  const MONTHS: CalendarMonth[] = [
    { code: 'NOV/26', isCurrent: true },
    { code: 'DEZ/26', isCurrent: false },
    { code: 'JAN/27', isCurrent: false },
    { code: 'FEV/27', isCurrent: false },
    { code: 'MAR/27', isCurrent: false },
    { code: 'ABR/27', isCurrent: false },
    { code: 'MAI/27', isCurrent: false },
    { code: 'JUN/27', isCurrent: false },
    { code: 'JUL/27', isCurrent: false },
    { code: 'AGO/27', isCurrent: false },
    { code: 'SET/27', isCurrent: false },
    { code: 'OUT/27', isCurrent: false },
  ];

  const CALENDAR_ROWS: CalendarRow[] = [
    {
      label: 'Peroá / Miragaia / Mero',
      rule: 'Port. GM/MMA 1.666 e 1.667/2026 (vigor 27/10/2026)',
      cells: Array.from({ length: 12 }, () => ({
        text: 'PROIB.',
        tone: 'prohibited',
      })),
    },
    {
      label: 'Garoupa-verdadeira',
      rule: 'Defeso Nov–Fev · Janela 47–73 cm (50 cm RJ)',
      cells: MONTHS.map((_, i) =>
        i <= 3
          ? { text: 'DEFESO', tone: 'closed' }
          : { text: '47–73', tone: 'open' }
      ),
    },
    {
      label: 'Marlin-branco',
      rule: 'Excluído Port. 1.667/26 · IN SEAP 12/2005 ativa',
      cells: Array.from({ length: 12 }, () => ({
        text: '100% C&R',
        tone: 'catch-release',
      })),
    },
    {
      label: 'Piracema (Bacias SE/CO)',
      rule: 'Defeso continental Nov–Fev',
      cells: MONTHS.map((_, i) =>
        i <= 3
          ? { text: 'DEFESO', tone: 'closed' }
          : { text: 'ABERTA', tone: 'open' }
      ),
    },
    {
      label: 'Marlin Azul (RJ / O Corte)',
      rule: 'Janela oceânica 43–55 NM (C&R esportivo)',
      cells: MONTHS.map((_, i) =>
        i <= 4
          ? { text: 'PICO', tone: 'peak' }
          : { text: 'BAIXA', tone: 'open' }
      ),
    },
  ];

  const EXCLUSION_ZONES: ExclusionZone[] = [
    {
      id: 'resex-arraial',
      name: 'RESEX Marinha de Arraial do Cabo',
      uf: 'RJ',
      category: 'Reserva Extrativista Federal',
      rule: 'Uso exclusivo de pescadores artesanais cadastrados nas áreas restritas; embarcações esportivas de fora sofrem proibição severa e fiscalização costeira constante.',
      cx: 486,
      cy: 86,
      r: 20,
    },
    {
      id: 'plataformas-500m',
      name: 'Anéis de 500 m das Plataformas (Campos/Santos)',
      uf: 'OFFSHORE',
      category: 'Zona de Segurança NORMAM / Marinha',
      rule: 'É proibido navegar, fundear, amarrar ou pescar dentro do raio de 500 metros de qualquer plataforma de petróleo, FPSO ou monoboia. Aproximação gera multa pesada e perda da arrais.',
      cx: 545,
      cy: 185,
      r: 24,
    },
    {
      id: 'cagarras',
      name: 'MoNa das Ilhas Cagarras',
      uf: 'RJ',
      category: 'Monumento Natural Federal',
      rule: 'Perímetro protegido em frente a Ipanema/Rio com zonas de exclusão de pesca e regras estritas de fundeio para proteger colônias de atobás, fragatas e trinta-réis.',
      cx: 356,
      cy: 112,
      r: 17,
    },
    {
      id: 'tamoios',
      name: 'ESEC de Tamoios (Baía da Ilha Grande)',
      uf: 'RJ',
      category: 'Estação Ecológica (Exclusão Total)',
      rule: 'Proteção integral absoluta em 29 ilhas/lajes e raios de 1 km no entorno: proibida qualquer modalidade de pesca (até C&R), desembarque ou fundeio.',
      cx: 242,
      cy: 136,
      r: 20,
    },
    {
      id: 'alcatrazes',
      name: 'REVIS do Arquipélago de Alcatrazes',
      uf: 'SP',
      category: 'Refúgio de Vida Silvestre (Exclusão Total)',
      rule: 'Proibição absoluta de pesca comercial e esportiva em todo o polígono do arquipélago, com navegação controlada e tolerância zero contra fundeio ilegal.',
      cx: 122,
      cy: 194,
      r: 22,
    },
  ];

  let searchQuery = $state('');
  let categoryFilter = $state<'all' | 'prohibition' | 'cr' | 'defeso'>('all');
  let selectedZoneId = $state<string>(EXCLUSION_ZONES[0].id);

  function classifyRegime(entry: LegislationEntry): 'prohibition' | 'cr' | 'defeso' {
    if (entry.id === 'peroa' || entry.id === 'miragaia' || entry.id === 'mero') {
      return 'prohibition';
    }
    if (entry.id === 'marlin-branco') {
      return 'cr';
    }
    return 'defeso';
  }

  const filteredEntries = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((item) => {
      const kind = classifyRegime(item);
      if (categoryFilter !== 'all' && kind !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = `${item.commonName} ${item.scientificName} ${item.statusMMA2026} ${item.legalRegime} ${item.closedSeason}`.toLowerCase();
      return haystack.includes(q);
    });
  });

  const activeZone = $derived(
    EXCLUSION_ZONES.find((z) => z.id === selectedZoneId) ?? EXCLUSION_ZONES[0]
  );

  function cellStyleClass(tone: CalendarRow['cells'][number]['tone']): string {
    if (tone === 'prohibited') return 'bg-salvage text-elevated font-bold';
    if (tone === 'closed') return 'bg-salvage-soft text-salvage font-bold';
    if (tone === 'catch-release') return 'bg-ocean-soft text-ocean font-bold';
    if (tone === 'peak') return 'bg-ocean text-elevated font-bold';
    return 'bg-surface text-ink-secondary';
  }
</script>

<section
  id="legislacao-2026"
  data-cais-keep
  aria-labelledby="legislacao-2026-title"
  class="tufte-full-bleed border border-line-strong bg-elevated p-4 sm:p-6 my-8"
>
  <header class="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4 mb-5">
    <div>
      <p class="font-mono text-[11px] font-bold uppercase tracking-widest text-salvage m-0">
        CONFORMIDADE AMBIENTAL · PORTARIAS GM/MMA 1.666 &amp; 1.667/2026
      </p>
      <h2
        id="legislacao-2026-title"
        class="font-sans text-xl sm:text-2xl font-bold tracking-tight text-ink mt-1 mb-0"
      >
        Explorador de Legislação 2026/2027, Calendário &amp; Zonas de Exclusão
      </h2>
      <p class="font-sans text-xs sm:text-sm text-ink-secondary mt-1 mb-0">
        Peroá, Miragaia e Mero são Proibição Total em vigor desde 27/10/2026. Marlin-branco segue intocável para retenção pela IN SEAP nº 12/2005.
      </p>
    </div>

    <span class="px-2.5 py-1 border border-salvage bg-salvage-soft font-mono text-xs font-bold text-salvage tabular-telemetry">
      MÊS VIGENTE: NOVEMBRO / 2026
    </span>
  </header>

  <!-- BLOCO 1: CALENDÁRIO INTEGRADO 2026/2027 -->
  <div class="mb-6">
    <div class="flex flex-wrap items-baseline justify-between gap-2 mb-2">
      <h3 class="font-mono text-xs font-bold uppercase tracking-wider text-ink m-0">
        1. Calendário Integrado 2026/2027 (Defesos vs. Janelas Esportivas)
      </h3>
      <span class="font-mono text-[10px] text-ink-muted">
        COLUNA DESTACADA = NOV/26 (DEFESO GAROUPA &amp; PIRACEMA ATIVOS)
      </span>
    </div>

    <div class="overflow-x-auto border border-line-strong bg-surface">
      <table class="w-full border-collapse text-left font-mono text-[11px] tabular-telemetry">
        <thead>
          <tr class="border-b-2 border-line-strong bg-elevated">
            <th class="px-3 py-2 text-ink min-w-[200px]">Espécie / Regime</th>
            {#each MONTHS as m}
              <th
                class="px-1.5 py-2 text-center whitespace-nowrap {m.isCurrent
                  ? 'bg-salvage text-elevated font-bold'
                  : 'text-ink-secondary'}"
              >
                {m.code}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          {#each CALENDAR_ROWS as row}
            <tr>
              <td class="px-3 py-2 bg-elevated">
                <strong class="block font-sans text-xs text-ink">{row.label}</strong>
                <span class="block text-[10px] text-ink-muted font-sans">{row.rule}</span>
              </td>
              {#each row.cells as cell, idx}
                <td
                  class="px-1 py-2 text-center border-l {MONTHS[idx].isCurrent
                    ? 'border-x-2 border-salvage'
                    : 'border-line'} {cellStyleClass(cell.tone)}"
                >
                  {cell.text}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- BLOCO 2: BUSCADOR DE ESPÉCIES E LEIS (DADOS DA CONTENT LAYER) -->
  <div class="mb-6 border border-line bg-surface p-4">
    <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
      <label class="flex-1 min-w-[240px]">
        <span class="block font-mono text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
          2. Buscador de Espécies, Status &amp; Portarias ({filteredEntries.length}/{entries.length})
        </span>
        <input
          type="search"
          bind:value={searchQuery}
          placeholder="Buscar por espécie, 1666, 1667, 12/2005, peroá, miragaia..."
          class="w-full border border-line-strong bg-elevated px-3 py-2 font-sans text-sm text-ink placeholder:text-ink-muted"
        />
      </label>

      <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filtro de regime legal">
        <button
          type="button"
          aria-pressed={categoryFilter === 'all'}
          onclick={() => (categoryFilter = 'all')}
          class="px-2.5 py-1.5 border font-mono text-[11px] font-bold cursor-pointer {categoryFilter ===
          'all'
            ? 'border-line-strong bg-ink text-canvas'
            : 'border-line bg-elevated text-ink-secondary'}"
        >
          Todas
        </button>
        <button
          type="button"
          aria-pressed={categoryFilter === 'prohibition'}
          onclick={() => (categoryFilter = 'prohibition')}
          class="px-2.5 py-1.5 border font-mono text-[11px] font-bold cursor-pointer {categoryFilter ===
          'prohibition'
            ? 'border-salvage bg-salvage text-elevated'
            : 'border-line bg-elevated text-salvage'}"
        >
          Proibição Total
        </button>
        <button
          type="button"
          aria-pressed={categoryFilter === 'cr'}
          onclick={() => (categoryFilter = 'cr')}
          class="px-2.5 py-1.5 border font-mono text-[11px] font-bold cursor-pointer {categoryFilter ===
          'cr'
            ? 'border-ocean bg-ocean text-elevated'
            : 'border-line bg-elevated text-ocean'}"
        >
          100% C&amp;R (IN 12/2005)
        </button>
        <button
          type="button"
          aria-pressed={categoryFilter === 'defeso'}
          onclick={() => (categoryFilter = 'defeso')}
          class="px-2.5 py-1.5 border font-mono text-[11px] font-bold cursor-pointer {categoryFilter ===
          'defeso'
            ? 'border-salvage bg-salvage-soft text-salvage'
            : 'border-line bg-elevated text-ink-secondary'}"
        >
          Defeso / Janela
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      {#each filteredEntries as item (item.id)}
        {@const kind = classifyRegime(item)}
        <article
          class="border p-3.5 flex flex-col gap-2 {kind === 'prohibition'
            ? 'border-2 border-salvage bg-salvage-soft'
            : kind === 'cr'
              ? 'border-2 border-ocean bg-ocean-soft'
              : 'border-line-strong bg-elevated'}"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h4 class="font-sans text-base font-bold text-ink m-0">{item.commonName}</h4>
              <p class="font-editorial italic text-xs text-ink-secondary m-0">
                {item.scientificName} · {item.statusMMA2026}
              </p>
            </div>

            {#if kind === 'prohibition'}
              <span class="px-2 py-0.5 bg-salvage font-mono text-[10px] font-bold uppercase text-elevated">
                PROIBIÇÃO TOTAL
              </span>
            {:else if kind === 'cr'}
              <span class="px-2 py-0.5 bg-ocean font-mono text-[10px] font-bold uppercase text-elevated">
                INTOCÁVEL P/ RETENÇÃO · 100% C&amp;R
              </span>
            {:else}
              <span class="px-2 py-0.5 bg-salvage text-elevated font-mono text-[10px] font-bold uppercase">
                DEFESO ATIVO (NOV–FEV)
              </span>
            {/if}
          </div>

          <p class="font-sans text-xs leading-relaxed text-ink m-0">
            {item.legalRegime}
          </p>

          {#if item.id === 'peroa' || item.id === 'miragaia'}
            <p class="font-mono text-[11px] font-bold text-salvage m-0">
              VIGÊNCIA IMEDIATA: Proibição Total em vigor desde 27 de outubro de 2026 — retenção a bordo gera apreensão e auto de infração.
            </p>
          {:else if item.id === 'marlin-branco'}
            <p class="font-mono text-[11px] font-bold text-ocean m-0">
              RESSALVA CRÍTICA: Excluído da Portaria 1.667/2026, porém a IN SEAP nº 12/2005 segue vigente — retenção continua estritamente proibida.
            </p>
          {/if}

          <p class="font-mono text-[11px] text-ink-secondary border-t border-line pt-1.5 m-0 tabular-telemetry">
            <strong>Defeso / Vigência:</strong> {item.closedSeason}
          </p>
        </article>
      {/each}
    </div>
  </div>

  <!-- BLOCO 3: MAPA SVG ESQUEMÁTICO DE EXCLUSÃO (RJ / SP + ANÉIS 500 M) -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
    <div class="lg:col-span-7 border border-line bg-surface p-3">
      <div class="flex items-center justify-between font-mono text-[10px] text-ink-muted mb-2">
        <span>3. MAPA ESQUEMÁTICO DE EXCLUSÃO (SP / RJ / BACIA DE CAMPOS)</span>
        <span>CLIQUE NA ZONA PARA INSPECIONAR</span>
      </div>

      <svg
        viewBox="0 0 640 260"
        class="w-full h-auto block border border-line bg-canvas"
        role="img"
        aria-label="Mapa esquemático das unidades de conservação marinhas de SP e RJ e anéis de segurança de 500 metros ao redor das plataformas offshore"
      >
        <!-- Mar aberto -->
        <rect x="0" y="0" width="640" height="260" fill="var(--accent-ocean-soft)" fill-opacity="0.55" />

        <!-- Linha de Costa Esquemática (Litoral Norte SP -> Ilha Grande -> Rio -> Arraial/Cabo Frio) -->
        <path
          d="M 0,180 Q 65,168 125,138 Q 185,112 248,108 Q 315,96 362,84 Q 430,78 492,58 L 542,0 L 0,0 Z"
          fill="var(--bg-surface)"
          stroke="var(--border-strong)"
          stroke-width="2"
        />

        <!-- Rótulos costeiros -->
        <text x="64" y="118" font-family="var(--font-mono)" font-size="9.5" font-weight="700" fill="var(--fg-secondary)">
          LITORAL SP
        </text>
        <text x="215" y="88" font-family="var(--font-mono)" font-size="9.5" font-weight="700" fill="var(--fg-secondary)">
          ANGRA / ILHA GRANDE
        </text>
        <text x="342" y="64" font-family="var(--font-mono)" font-size="9.5" font-weight="700" fill="var(--fg-secondary)">
          RIO DE JANEIRO
        </text>
        <text x="458" y="42" font-family="var(--font-mono)" font-size="9.5" font-weight="700" fill="var(--fg-secondary)">
          CABO FRIO / ARRAIAL
        </text>

        <!-- Quebra do Talude (43-55 NM) -->
        <path
          d="M 160,256 Q 350,210 620,126"
          fill="none"
          stroke="var(--accent-ocean)"
          stroke-width="1.2"
          stroke-dasharray="5 4"
        />
        <text x="275" y="238" font-family="var(--font-mono)" font-size="8.5" fill="var(--accent-ocean)">
          QUEBRA DO TALUDE / ÁGUAS PROFUNDAS (43–55 NM)
        </text>

        <!-- Zonas Selecionáveis -->
        {#each EXCLUSION_ZONES as zone}
          {@const active = selectedZoneId === zone.id}
          <g
            class="cursor-pointer"
            role="button"
            tabindex="0"
            aria-label="Inspecionar {zone.name}"
            onclick={() => (selectedZoneId = zone.id)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectedZoneId = zone.id;
              }
            }}
          >
            <circle
              cx={zone.cx}
              cy={zone.cy}
              r={zone.r}
              fill="var(--accent-salvage)"
              fill-opacity={active ? 0.36 : 0.18}
              stroke="var(--accent-salvage)"
              stroke-width={active ? 2.6 : 1.5}
              stroke-dasharray={zone.id === 'plataformas-500m' ? '4 2' : 'none'}
            />
            <circle cx={zone.cx} cy={zone.cy} r="4.5" fill="var(--accent-salvage)" />
            <text
              x={zone.cx}
              y={zone.cy - zone.r - 5}
              text-anchor="middle"
              font-family="var(--font-mono)"
              font-size="8.5"
              font-weight="700"
              fill={active ? 'var(--accent-salvage)' : 'var(--fg-primary)'}
            >
              {zone.id === 'plataformas-500m'
                ? 'PLATAFORMAS (500 m)'
                : zone.id === 'cagarras'
                  ? 'CAGARRAS'
                  : zone.id === 'tamoios'
                    ? 'ESEC TAMOIOS'
                    : zone.id === 'alcatrazes'
                      ? 'ALCATRAZES'
                      : 'RESEX ARRAIAL'}
            </text>
          </g>
        {/each}
      </svg>
    </div>

    <!-- Painel lateral da UC / Zona selecionada -->
    <div class="lg:col-span-5 flex flex-col gap-3">
      <div class="flex flex-wrap gap-1.5">
        {#each EXCLUSION_ZONES as zone}
          <button
            type="button"
            aria-pressed={selectedZoneId === zone.id}
            onclick={() => (selectedZoneId = zone.id)}
            class="px-2.5 py-1 border font-mono text-[10px] font-bold cursor-pointer {selectedZoneId ===
            zone.id
              ? 'border-salvage bg-salvage text-elevated'
              : 'border-line bg-surface text-ink hover:border-line-strong'}"
          >
            {zone.uf} · {zone.name.split(' (')[0]}
          </button>
        {/each}
      </div>

      <div class="border-2 border-salvage bg-salvage-soft p-4">
        <span class="font-mono text-[10px] font-bold uppercase tracking-widest text-salvage">
          {activeZone.uf} · {activeZone.category}
        </span>
        <h4 class="font-sans text-base font-bold text-ink mt-1 mb-2">{activeZone.name}</h4>
        <p class="font-editorial text-sm leading-relaxed text-ink m-0">
          {activeZone.rule}
        </p>
      </div>
    </div>
  </div>
</section>
