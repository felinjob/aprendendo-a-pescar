<script lang="ts">
  import { scaleLinear } from 'd3-scale';

  interface PeLineEntry {
    id: string;
    pe: number;
    diameterMm: number;
    strength4xLb: number;
  }

  interface Props {
    peLines?: PeLineEntry[];
  }

  let { peLines = [] }: Props = $props();

  // 1. Conversor PE / mm / lb
  let peValue = $state(2.0);
  const diameterMm = $derived(Number((0.165 * Math.sqrt(peValue)).toFixed(3)));
  const est4xLb = $derived(Math.round(peValue * 13 + 3));
  const est8xLb = $derived(Math.round(peValue * 15 + 4));

  const peApplication = $derived.by(() => {
    if (peValue <= 0.8) return 'Molinetes 1000–2500 · Ultralight, micro-jig e robalo peva.';
    if (peValue <= 1.5) return 'Molinetes 2500–3000 · Robalo em mangue, slow pitch leve.';
    if (peValue <= 2.5) return 'Molinetes 3000–4000 · Coringa de costão e slow pitch médio.';
    if (peValue <= 4.0) return 'Molinetes 4000–8000 · Speed jigging, olhete, namorado e tucunaré-açu.';
    if (peValue <= 6.0) return 'Molinetes 10000–14000 · Popping pesado, olho-de-boi e atuns.';
    return 'Molinetes 18000+ / Elétricas · Deep drop e grandes pelágicos.';
  });

  const matchedCatalogRow = $derived(
    peLines.length > 0
      ? peLines.reduce((best, item) =>
          Math.abs(item.pe - peValue) < Math.abs(best.pe - peValue) ? item : best
        )
      : null
  );

  // 2. Calculadora IPT / CPT
  let spoolDiameterMm = $state(32);
  let gearRatio = $state(8.4);

  const cptCm = $derived(
    Number((((spoolDiameterMm / 10) * Math.PI) * gearRatio).toFixed(1))
  );
  const iptIn = $derived(Number((cptCm / 2.54).toFixed(1)));

  function applyReelPreset(diameter: number, ratio: number) {
    spoolDiameterMm = diameter;
    gearRatio = ratio;
  }

  // 3. Comparador 50W (Gráfico de Barras Alinhadas com d3-scale)
  type DuelMetric = 'dragLb' | 'capacityYd' | 'weightOz' | 'highGear';

  interface Reel50W {
    model: string;
    dragLb: number;
    capacityYd: number;
    weightOz: number;
    weightKg: string;
    highGear: number;
    badge?: string;
    tradeoff: string;
  }

  const REELS_50W: Reel50W[] = [
    {
      model: 'Shimano Tiagra 50W',
      dragLb: 57,
      capacityYd: 1200,
      weightOz: 86,
      weightKg: '~2,44 kg',
      highGear: 3.1,
      badge: 'Freio constante',
      tradeoff: 'Mais pesada (86 oz), porém entrega cliques idênticos de calibração e sistema Hydrothermal.',
    },
    {
      model: 'Penn International 50W',
      dragLb: 45,
      capacityYd: 1800,
      weightOz: 67,
      weightKg: '~1,90 kg',
      highGear: 3.5,
      badge: '1.800 yd · Mais rápida',
      tradeoff: 'Mais leve que a Tiagra e líder em capacidade (1.800 yd); variante 50VISX eleva o freio a 60 lb.',
    },
    {
      model: 'Okuma Makaira 50W',
      dragLb: 60,
      capacityYd: 1200,
      weightOz: 65,
      weightKg: '~1,84 kg',
      highGear: 3.2,
      badge: '65 oz · Freio extremo',
      tradeoff: 'Menor peso com freio extremo (60 lb nominais, até 85 lb no limite absoluto).',
    },
  ];

  const METRIC_META: Record<
    DuelMetric,
    { label: string; unit: string; domainMax: number; note: string }
  > = {
    dragLb: {
      label: 'Freio Máximo (lb)',
      unit: 'lb',
      domainMax: 70,
      note: 'Maior é mais forte (Penn 50VISX atinge 60 lb).',
    },
    capacityYd: {
      label: 'Capacidade Multi 100 lb (yd)',
      unit: 'yd',
      domainMax: 2000,
      note: 'Maior garante folga em corridas longas de marlin azul.',
    },
    weightOz: {
      label: 'Peso do Equipamento (oz)',
      unit: 'oz',
      domainMax: 100,
      note: 'Menor reduz fadiga no stand-up; peso extra na Tiagra vem do chassi.',
    },
    highGear: {
      label: 'Recolhimento Marcha Alta (:1)',
      unit: ':1',
      domainMax: 4.0,
      note: 'Maior recupera linha rápido quando o peixe corre para o barco.',
    },
  };

  let activeMetric = $state<DuelMetric>('dragLb');

  const currentMetricMeta = $derived(METRIC_META[activeMetric]);
  const barScale = $derived(
    scaleLinear().domain([0, currentMetricMeta.domainMax]).range([0, 310])
  );
  const axisTicks = $derived(barScale.ticks(4));
</script>

<section
  id="tackle-calculators"
  data-cais-keep
  aria-labelledby="calc-panel-title"
  class="tufte-full-bleed border border-line-strong bg-surface p-5 sm:p-6 my-8"
>
  <div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3 mb-6">
    <div>
      <p class="font-mono text-[11px] font-bold uppercase tracking-widest text-salvage m-0">
        ENGENHARIA DA TRALHA · 3 INSTRUMENTOS DE CONVÉS
      </p>
      <h2 id="calc-panel-title" class="font-sans text-lg sm:text-xl font-bold tracking-tight text-ink mt-1 mb-0">
        Escala PE, Velocidade Real (CPT/IPT) e Duelo Classe 50W
      </h2>
    </div>
    <span class="font-mono text-[11px] text-ink-muted tabular-telemetry">
      PRECISÃO TABULAR · ZERO MARKETING
    </span>
  </div>

  <!-- Sub-painéis 1 e 2 lado a lado -->
  <div class="grid gap-5 md:grid-cols-2 mb-6">
    <!-- 1. Conversor PE / mm / lb -->
    <div class="border border-line bg-elevated p-4">
      <div class="flex items-baseline justify-between gap-2 mb-3">
        <h3 class="font-mono text-xs font-bold uppercase tracking-wider text-ocean m-0">
          1. Conversor Escala PE (d ≈ 0,165 × √PE)
        </h3>
        <strong class="font-mono text-sm text-ink tabular-telemetry">PE {peValue.toFixed(1)}</strong>
      </div>

      <label class="block mb-3">
        <span class="sr-only">Classificação japonesa PE</span>
        <input
          type="range"
          min="0.4"
          max="12.0"
          step="0.1"
          bind:value={peValue}
          class="w-full accent-ocean cursor-pointer"
        />
        <div class="flex justify-between font-mono text-[10px] text-ink-muted mt-1 tabular-telemetry">
          <span>PE 0.4</span>
          <span>PE 3.0</span>
          <span>PE 6.0</span>
          <span>PE 12.0</span>
        </div>
      </label>

      <div class="grid grid-cols-3 gap-2 border-t border-line pt-3 tabular-telemetry">
        <div class="border border-line bg-surface p-2">
          <span class="block font-mono text-[9px] uppercase text-ink-muted">Diâmetro</span>
          <strong class="font-mono text-sm text-ink">{diameterMm.toFixed(3)} mm</strong>
        </div>
        <div class="border border-line bg-surface p-2">
          <span class="block font-mono text-[9px] uppercase text-ink-muted">Ref. 4 Fios</span>
          <strong class="font-mono text-sm text-ocean">~{est4xLb} lb</strong>
        </div>
        <div class="border border-line bg-surface p-2">
          <span class="block font-mono text-[9px] uppercase text-ink-muted">Ref. 8 Fios</span>
          <strong class="font-mono text-sm text-salvage">~{est8xLb} lb</strong>
        </div>
      </div>

      <p class="font-sans text-xs leading-snug text-ink-secondary mt-3 mb-0">
        PE (<em>Gou</em>) mede espessura, não resistência em libras. {peApplication}
        {#if matchedCatalogRow}
          <span class="block font-mono text-[10px] text-ink-muted mt-1 tabular-telemetry">
            Tabela oficial mais próxima: PE {matchedCatalogRow.pe.toFixed(1)} ({matchedCatalogRow.diameterMm.toFixed(3)} mm · {matchedCatalogRow.strength4xLb} lb 4X).
          </span>
        {/if}
      </p>
    </div>

    <!-- 2. Calculadora IPT / CPT -->
    <div class="border border-line bg-elevated p-4">
      <div class="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h3 class="font-mono text-xs font-bold uppercase tracking-wider text-salvage m-0">
          2. Calculadora IPT / CPT (Carretel Cheio)
        </h3>
        <span class="font-mono text-[10px] text-ink-muted">
          CPT = (Dmm / 10) × π × Relação
        </span>
      </div>

      <div class="flex flex-wrap gap-1.5 mb-3">
        <button
          type="button"
          onclick={() => applyReelPreset(32, 8.4)}
          class="cursor-pointer border border-line bg-surface px-2 py-1 font-mono text-[10px] text-ink hover:border-line-strong"
        >
          Perfil Baixo 32 mm · 8.4:1
        </button>
        <button
          type="button"
          onclick={() => applyReelPreset(28, 8.4)}
          class="cursor-pointer border border-line bg-surface px-2 py-1 font-mono text-[10px] text-ink hover:border-line-strong"
        >
          Compacta 28 mm · 8.4:1
        </button>
        <button
          type="button"
          onclick={() => applyReelPreset(89, 3.1)}
          class="cursor-pointer border border-line bg-surface px-2 py-1 font-mono text-[10px] text-ink hover:border-line-strong"
        >
          Tiagra 50W · 3.1:1
        </button>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-3 tabular-telemetry">
        <label class="block">
          <span class="block font-mono text-[10px] uppercase text-ink-secondary mb-1">
            Diâmetro Carretel (mm)
          </span>
          <input
            type="number"
            min="20"
            max="120"
            step="1"
            bind:value={spoolDiameterMm}
            class="w-full border border-line-strong bg-canvas px-2.5 py-1.5 font-mono text-sm font-bold text-ink"
          />
        </label>

        <label class="block">
          <span class="block font-mono text-[10px] uppercase text-ink-secondary mb-1">
            Relação (:1)
          </span>
          <input
            type="number"
            min="1.3"
            max="10.5"
            step="0.1"
            bind:value={gearRatio}
            class="w-full border border-line-strong bg-canvas px-2.5 py-1.5 font-mono text-sm font-bold text-ink"
          />
        </label>
      </div>

      <div class="grid grid-cols-2 gap-2 border-t border-line pt-3 tabular-telemetry">
        <div class="border border-line bg-surface p-2">
          <span class="block font-mono text-[9px] uppercase text-ink-muted">CPT (cm / volta)</span>
          <strong class="font-mono text-base text-salvage">{cptCm.toFixed(1)} cm</strong>
        </div>
        <div class="border border-line bg-surface p-2">
          <span class="block font-mono text-[9px] uppercase text-ink-muted">IPT (pol / volta)</span>
          <strong class="font-mono text-base text-ink">{iptIn.toFixed(1)} in</strong>
        </div>
      </div>

      <p class="font-sans text-xs leading-snug text-ink-secondary mt-3 mb-0">
        Mesmo com relação idêntica (8.4:1), reduzir o carretel de 32 mm para 28 mm corta mais de 10 cm por manivelada.
      </p>
    </div>
  </div>

  <!-- 3. Gráfico de Barras Alinhadas: Duelo 50W (d3-scale) -->
  <div class="border border-line bg-elevated p-4">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3 mb-4">
      <div>
        <h3 class="font-mono text-xs font-bold uppercase tracking-wider text-ink m-0">
          3. Duelo das Carretilhas Classe 50W (Gráfico Alinhado · D3-Scale)
        </h3>
        <p class="font-sans text-xs text-ink-secondary mt-1 mb-0">
          {currentMetricMeta.note}
        </p>
      </div>

      <div class="flex flex-wrap gap-1" role="group" aria-label="Métrica do comparativo 50W">
        {#each Object.entries(METRIC_META) as [key, meta]}
          {@const metricKey = key as DuelMetric}
          <button
            type="button"
            onclick={() => (activeMetric = metricKey)}
            aria-pressed={activeMetric === metricKey}
            class="cursor-pointer border px-2 py-1 font-mono text-[10px] font-bold transition-colors {activeMetric === metricKey
              ? 'border-line-strong bg-ink text-canvas'
              : 'border-line bg-surface text-ink-secondary hover:border-line-strong'}"
          >
            {meta.label.split(' (')[0]}
          </button>
        {/each}
      </div>
    </div>

    <svg
      viewBox="0 0 640 164"
      class="w-full h-auto block tabular-telemetry"
      role="img"
      aria-label={`Gráfico de barras comparando Tiagra 50W, Penn International 50W e Okuma Makaira 50W por ${currentMetricMeta.label}`}
    >
      <!-- Linhas de grade verticais -->
      {#each axisTicks as tick}
        {@const x = 195 + barScale(tick)}
        <line
          x1={x}
          y1="8"
          x2={x}
          y2="132"
          stroke="var(--border-hairline)"
          stroke-dasharray="3 3"
        />
        <text
          x={x}
          y="150"
          text-anchor="middle"
          fill="var(--fg-muted)"
          font-family="var(--font-mono)"
          font-size="10"
        >
          {tick}{currentMetricMeta.unit}
        </text>
      {/each}

      {#each REELS_50W as reel, idx}
        {@const y = 16 + idx * 40}
        {@const val = reel[activeMetric]}
        {@const barWidth = Math.max(4, barScale(val))}
        {@const barColor =
          idx === 0
            ? 'var(--accent-ocean)'
            : idx === 1
              ? 'var(--accent-salvage)'
              : 'var(--fg-primary)'}

        <text
          x="4"
          y={y + 17}
          fill="var(--fg-primary)"
          font-family="var(--font-sans)"
          font-size="12"
          font-weight="700"
        >
          {reel.model}
        </text>

        <rect
          x="195"
          y={y + 2}
          width={barWidth}
          height="22"
          fill={barColor}
        />

        <text
          x={195 + barWidth + 8}
          y={y + 17}
          fill="var(--fg-primary)"
          font-family="var(--font-mono)"
          font-size="11"
          font-weight="700"
        >
          {val}{currentMetricMeta.unit}
          {#if activeMetric === 'weightOz'}
            ({reel.weightKg})
          {/if}
        </text>
      {/each}
    </svg>

    <div class="mt-3 grid gap-2 sm:grid-cols-3 border-t border-line pt-3">
      {#each REELS_50W as reel}
        <div class="border border-line bg-surface p-2.5">
          <span class="block font-mono text-[10px] font-bold uppercase text-salvage">
            {reel.model}
          </span>
          <p class="font-sans text-xs leading-snug text-ink-secondary mt-1 mb-0">
            {reel.tradeoff}
          </p>
        </div>
      {/each}
    </div>
  </div>
</section>
