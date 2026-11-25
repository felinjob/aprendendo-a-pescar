<script lang="ts">
  type FlagStatus = 'retido' | 'liberado' | 'marcado';

  interface SpeciesSpec {
    id: string;
    name: string;
    rank: number;
    colorToken: string;
    bgToken: string;
    shortCode: string;
    prohibitRetentionBr?: boolean;
  }

  interface HalyardFlag {
    uid: number;
    speciesId: string;
    name: string;
    rank: number;
    status: FlagStatus;
    colorToken: string;
    bgToken: string;
    shortCode: string;
    addedAt: number;
  }

  const SPECIES_CATALOG: SpeciesSpec[] = [
    {
      id: 'marlin-azul',
      name: 'Marlin Azul',
      rank: 1,
      colorToken: 'var(--accent-ocean)',
      bgToken: 'var(--accent-ocean-soft)',
      shortCode: 'BLUE',
    },
    {
      id: 'marlin-branco',
      name: 'Marlin Branco',
      rank: 2,
      colorToken: 'var(--oi-sky)',
      bgToken: 'var(--accent-ocean-soft)',
      shortCode: 'WHITE',
      prohibitRetentionBr: true,
    },
    {
      id: 'sailfish',
      name: 'Sailfish (Agulhão)',
      rank: 3,
      colorToken: 'var(--oi-purple)',
      bgToken: 'var(--bg-surface)',
      shortCode: 'SAIL',
    },
    {
      id: 'atuns',
      name: 'Atuns (Yellowfin / Bigeye)',
      rank: 4,
      colorToken: 'var(--oi-bluish-green)',
      bgToken: 'var(--bg-surface)',
      shortCode: 'TUNA',
    },
    {
      id: 'wahoo',
      name: 'Wahoo (Cavala-impigem)',
      rank: 5,
      colorToken: 'var(--oi-orange)',
      bgToken: 'var(--bg-surface)',
      shortCode: 'WAHOO',
    },
    {
      id: 'dourado',
      name: 'Dourado',
      rank: 6,
      colorToken: 'var(--oi-bluish-green)',
      bgToken: 'var(--accent-ocean-soft)',
      shortCode: 'MAHI',
    },
    {
      id: 'tubarao',
      name: 'Tubarão (Base absoluta)',
      rank: 7,
      colorToken: 'var(--fg-primary)',
      bgToken: 'var(--bg-surface)',
      shortCode: 'SHARK',
    },
  ];

  const STATUS_META: Record<
    FlagStatus,
    { label: string; orientation: string; badgeClass: string }
  > = {
    retido: {
      label: 'Retido (Em pé)',
      orientation: '0° · Embarcado',
      badgeClass: 'bg-ink text-canvas',
    },
    liberado: {
      label: 'Liberado (Ponta-cabeça)',
      orientation: '180° · C&R',
      badgeClass: 'bg-ocean text-elevated',
    },
    marcado: {
      label: 'Marcado (Invertida + T)',
      orientation: '180° + Flâmula T',
      badgeClass: 'bg-salvage text-elevated',
    },
  };

  let nextUid = 10;
  let selectedSpeciesId = $state<string>('marlin-azul');
  let selectedStatus = $state<FlagStatus>('liberado');

  let flags = $state<HalyardFlag[]>([
    createFlag('marlin-azul', 'liberado', 1, 1),
    createFlag('marlin-branco', 'marcado', 2, 2),
    createFlag('dourado', 'retido', 3, 3),
    createFlag('tubarao', 'liberado', 4, 4),
  ]);

  function createFlag(
    speciesId: string,
    status: FlagStatus,
    uid: number,
    addedAt: number
  ): HalyardFlag {
    const spec =
      SPECIES_CATALOG.find((s) => s.id === speciesId) ?? SPECIES_CATALOG[0];
    return {
      uid,
      speciesId: spec.id,
      name: spec.name,
      rank: spec.rank,
      status,
      colorToken: spec.colorToken,
      bgToken: spec.bgToken,
      shortCode: spec.shortCode,
      addedAt,
    };
  }

  // Hierarquia automática estrita: Rank 1 (Marlin Azul) no topo -> Rank 7 (Tubarão) na base
  const sortedFlags = $derived(
    [...flags].sort((a, b) => a.rank - b.rank || a.addedAt - b.addedAt)
  );

  const selectedSpec = $derived(
    SPECIES_CATALOG.find((s) => s.id === selectedSpeciesId) ?? SPECIES_CATALOG[0]
  );

  const hasIllegalWhiteMarlinRetention = $derived(
    flags.some(
      (f) => f.speciesId === 'marlin-branco' && f.status === 'retido'
    ) ||
      (selectedSpeciesId === 'marlin-branco' && selectedStatus === 'retido')
  );

  function addFlag() {
    nextUid += 1;
    flags = [
      ...flags,
      createFlag(selectedSpeciesId, selectedStatus, nextUid, Date.now() + nextUid),
    ];
  }

  function removeFlag(uid: number) {
    flags = flags.filter((f) => f.uid !== uid);
  }

  function loadDefaultHalyard() {
    nextUid += 10;
    flags = [
      createFlag('marlin-azul', 'liberado', nextUid + 1, 1),
      createFlag('marlin-branco', 'marcado', nextUid + 2, 2),
      createFlag('dourado', 'retido', nextUid + 3, 3),
      createFlag('tubarao', 'liberado', nextUid + 4, 4),
    ];
  }

  function clearAll() {
    flags = [];
  }

  const svgHeight = $derived(Math.max(320, 72 + sortedFlags.length * 64));
</script>

<section
  id="adrica-bandeiras"
  data-cais-keep
  aria-labelledby="adrica-bandeiras-title"
  class="tufte-full-bleed border border-line-strong bg-elevated p-4 sm:p-6 my-8"
>
  <header class="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4 mb-5">
    <div>
      <p class="font-mono text-[11px] font-bold uppercase tracking-widest text-salvage m-0">
        CÓDIGO PORTUÁRIO · TANGÃO DE BORESTE
      </p>
      <h2
        id="adrica-bandeiras-title"
        class="font-sans text-xl sm:text-2xl font-bold tracking-tight text-ink mt-1 mb-0"
      >
        Montador da Adriça de Bandeiras (Hierarquia 1 a 7)
      </h2>
      <p class="font-sans text-xs sm:text-sm text-ink-secondary mt-1 mb-0">
        Adicione capturas em qualquer ordem: o tangão reordena automaticamente de cima para baixo conforme o código portuário.
      </p>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        onclick={loadDefaultHalyard}
        class="px-2.5 py-1.5 border border-line-strong bg-surface font-mono text-[11px] font-bold text-ink cursor-pointer hover:border-ocean"
      >
        Exemplo de Torneio
      </button>
      <button
        type="button"
        onclick={clearAll}
        class="px-2.5 py-1.5 border border-line bg-canvas font-mono text-[11px] font-bold text-salvage cursor-pointer hover:border-salvage"
      >
        Arriar Tudo
      </button>
    </div>
  </header>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    <!-- PAINEL DE CONTROLE + HIERARQUIA -->
    <div class="lg:col-span-6 flex flex-col gap-4">
      <div class="border border-line bg-surface p-4 flex flex-col gap-3">
        <span class="font-mono text-xs font-bold uppercase tracking-wider text-ink">
          1. Lançar Captura na Adriça
        </span>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="block">
            <span class="block font-mono text-[11px] text-ink-secondary mb-1">
              Espécie (Ordem 1 → 7)
            </span>
            <select
              bind:value={selectedSpeciesId}
              class="w-full border border-line-strong bg-elevated px-2.5 py-2 font-mono text-xs text-ink"
            >
              {#each SPECIES_CATALOG as sp}
                <option value={sp.id}>#{sp.rank} · {sp.name}</option>
              {/each}
            </select>
          </label>

          <label class="block">
            <span class="block font-mono text-[11px] text-ink-secondary mb-1">
              Condição da Captura
            </span>
            <select
              bind:value={selectedStatus}
              class="w-full border border-line-strong bg-elevated px-2.5 py-2 font-mono text-xs text-ink"
            >
              <option value="liberado">Liberado (Ponta-cabeça / C&amp;R)</option>
              <option value="marcado">Marcado (Invertida + Flâmula T)</option>
              <option value="retido">Retido (Em pé · Embarcado)</option>
            </select>
          </label>
        </div>

        {#if hasIllegalWhiteMarlinRetention}
          <div class="border border-salvage bg-salvage-soft p-2.5">
            <p class="font-mono text-[11px] font-bold text-salvage m-0">
              ALERTA LEGAL (IN SEAP nº 12/2005): Retenção de {selectedSpec.id ===
              'marlin-branco'
                ? 'Marlin Branco'
                : 'Marlin Branco na adriça'} é proibida no Brasil. Deve subir apenas como Liberado ou Marcado.
            </p>
          </div>
        {/if}

        <button
          type="button"
          onclick={addFlag}
          class="w-full py-2 border border-salvage bg-salvage font-mono text-xs font-bold uppercase tracking-wider text-elevated cursor-pointer"
        >
          + Içar #{selectedSpec.rank} {selectedSpec.name} ({STATUS_META[selectedStatus].label})
        </button>
      </div>

      <!-- Lista ordenada ativa -->
      <div class="border border-line bg-surface p-4">
        <div class="flex items-center justify-between mb-2.5">
          <span class="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            Ordem Atual no Tangão ({sortedFlags.length})
          </span>
          <span class="font-mono text-[10px] text-ink-muted">TOPO → BASE</span>
        </div>

        {#if sortedFlags.length === 0}
          <p class="font-mono text-xs text-ink-muted py-4 text-center m-0 border border-dashed border-line">
            Adriça vazia. Nenhuma bandeira içada no tangão de boreste.
          </p>
        {:else}
          <ul class="list-none p-0 m-0 flex flex-col gap-1.5">
            {#each sortedFlags as flag, idx (flag.uid)}
              <li class="flex items-center justify-between gap-2 border border-line bg-elevated px-3 py-2 tabular-telemetry">
                <div class="flex items-center gap-2.5 min-w-0">
                  <span class="font-mono text-xs font-bold text-salvage w-6">
                    {idx + 1}º
                  </span>
                  <div class="min-w-0">
                    <strong class="block font-sans text-xs text-ink truncate">
                      {flag.name} <span class="font-mono text-[10px] text-ink-muted">(Rank #{flag.rank})</span>
                    </strong>
                    <span class="font-mono text-[10px] text-ink-secondary">
                      {STATUS_META[flag.status].orientation}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onclick={() => removeFlag(flag.uid)}
                  class="px-2 py-1 border border-line font-mono text-[10px] font-bold text-ink-muted hover:text-salvage hover:border-salvage cursor-pointer"
                  aria-label="Remover {flag.name}"
                >
                  Arriar
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <!-- Etiqueta Portuária (Fausto) -->
      <div class="border-l-4 border-salvage bg-surface p-3.5">
        <p class="font-mono text-[11px] font-bold uppercase tracking-wider text-salvage m-0">
          ETIQUETA PORTUÁRIA · REGRA DE CAIS
        </p>
        <p class="font-editorial text-sm leading-relaxed text-ink-secondary mt-1 mb-0">
          A ordem na adriça não é gosto pessoal — é código portuário de 1 a 7: <strong>Marlin Azul sempre no topo</strong>, <strong>Tubarão sempre na base</strong>. Bandeira sobe na entrada do canal e é arriada no final do dia. Deixar bandeira pendurada no tangão na tarde do dia seguinte é ostentação barata e rende punição no cais.
        </p>
      </div>
    </div>

    <!-- SVG DO TANGÃO DE BORESTE (TOPO -> BASE) -->
    <div class="lg:col-span-6 border border-line bg-surface p-3">
      <div class="flex items-center justify-between font-mono text-[10px] text-ink-muted mb-2">
        <span>ADRIÇA DE BORESTE (ORDENAÇÃO AUTOMÁTICA)</span>
        <span class="tabular-telemetry">{sortedFlags.length} BANDEIRA(S)</span>
      </div>

      <svg
        viewBox="0 0 420 {svgHeight}"
        class="w-full h-auto block border border-line bg-canvas"
        role="img"
        aria-label="Visualização vertical da adriça do tangão de boreste organizada automaticamente por hierarquia de espécies"
      >
        <!-- Topo do Tangão / Spreader -->
        <line x1="20" y1="26" x2="128" y2="12" stroke="var(--fg-primary)" stroke-width="4" />
        <circle cx="96" cy="17" r="5" fill="var(--accent-salvage)" />
        <text
          x="136"
          y="22"
          font-family="var(--font-mono)"
          font-size="10"
          font-weight="700"
          fill="var(--fg-primary)"
        >
          PONTA DO TANGÃO DE BORESTE (TOPO #1)
        </text>

        <!-- Cabo da adriça -->
        <line
          x1="96"
          y1="22"
          x2="96"
          y2={svgHeight - 24}
          stroke="var(--border-strong)"
          stroke-width="2"
          stroke-dasharray="4 2"
        />

        {#each sortedFlags as flag, index (flag.uid)}
          {@const yPos = 48 + index * 64}
          {@const isInverted = flag.status !== 'retido'}
          <g transform="translate(96, {yPos})">
            <!-- Clipe na adriça -->
            <circle cx="0" cy="18" r="3.5" fill="var(--fg-primary)" />

            <!-- Bandeira retangular (rotaciona 180° se Liberado ou Marcado) -->
            <g transform={isInverted ? 'translate(8, 0) rotate(180 54 18)' : 'translate(8, 0)'}>
              <rect
                x="0"
                y="0"
                width="108"
                height="36"
                fill={flag.bgToken}
                stroke={flag.colorToken}
                stroke-width="2"
              />
              <!-- Silhueta estilizada da espécie (invertida junto com o retângulo) -->
              <path
                d="M 18,22 Q 44,8 78,18 L 94,12 L 88,20 L 94,26 L 78,21 Q 44,29 18,22 Z"
                fill={flag.colorToken}
              />
              <!-- Pico/bico se peixe de bico (ranks 1-3) -->
              {#if flag.rank <= 3}
                <line x1="8" y1="22" x2="20" y2="21" stroke={flag.colorToken} stroke-width="2.2" />
              {/if}
            </g>

            <!-- Flâmula "T" vermelha imediatamente abaixo se Marcado -->
            {#if flag.status === 'marcado'}
              <polygon
                points="8,40 44,47 8,54"
                fill="var(--accent-salvage)"
                stroke="var(--border-strong)"
                stroke-width="1"
              />
              <text
                x="18"
                y="50"
                font-family="var(--font-mono)"
                font-size="9"
                font-weight="700"
                fill="var(--bg-elevated)"
              >
                T
              </text>
            {/if}

            <!-- Telemetria lateral da bandeira -->
            <text
              x="128"
              y="15"
              font-family="var(--font-mono)"
              font-size="11"
              font-weight="700"
              fill="var(--fg-primary)"
            >
              {index + 1}º · {flag.name}
            </text>
            <text
              x="128"
              y="30"
              font-family="var(--font-mono)"
              font-size="9.5"
              font-weight="700"
              fill={flag.status === 'marcado'
                ? 'var(--accent-salvage)'
                : flag.status === 'liberado'
                  ? 'var(--accent-ocean)'
                  : 'var(--fg-secondary)'}
            >
              {STATUS_META[flag.status].label.toUpperCase()} · HIERARQUIA #{flag.rank}
            </text>
          </g>
        {/each}

        <!-- Base do Cockpit -->
        <rect
          x="64"
          y={svgHeight - 24}
          width="64"
          height="14"
          fill="var(--bg-surface)"
          stroke="var(--border-strong)"
          stroke-width="1.5"
        />
        <text
          x="138"
          y={svgHeight - 13}
          font-family="var(--font-mono)"
          font-size="9.5"
          font-weight="700"
          fill="var(--fg-muted)"
        >
          BASE DO COCKPIT (TUBARÃO NA BASE #7)
        </text>
      </svg>
    </div>
  </div>
</section>
