<script lang="ts">
  import { scaleLinear } from 'd3-scale';
  import { curveCatmullRom, line } from 'd3-shape';

  interface ActionSpec {
    id: 'extra-fast' | 'fast' | 'moderate' | 'slow';
    name: string;
    flexStart: number;
    bendWeight: number;
    strokeWidth: number;
    dashArray?: string;
    colorVar: string;
    verdict: string;
  }

  const ACTIONS: ActionSpec[] = [
    {
      id: 'extra-fast',
      name: 'Extra-Rápida',
      flexStart: 0.72,
      bendWeight: 1.05,
      strokeWidth: 3.2,
      colorVar: 'var(--accent-salvage)',
      verdict: 'Dobra só no quarto superior. Crava jig/soft, mas rasga boca com garateias e quebra no high-sticking.',
    },
    {
      id: 'fast',
      name: 'Rápida',
      flexStart: 0.62,
      bendWeight: 0.96,
      strokeWidth: 2.5,
      colorVar: 'var(--accent-ocean)',
      verdict: 'Dobra no terço superior. Boa leitura de fundo, porém exige alívio de freio em peixes de boca macia.',
    },
    {
      id: 'moderate',
      name: 'Moderada',
      flexStart: 0.42,
      bendWeight: 0.88,
      strokeWidth: 2.5,
      dashArray: '6 3',
      colorVar: 'var(--fg-primary)',
      verdict: 'Avança até metade do blank. Trabalha como amortecedor contínuo, protegendo garateias e absorvendo pancadas.',
    },
    {
      id: 'slow',
      name: 'Lenta (Parabólica)',
      flexStart: 0.16,
      bendWeight: 0.8,
      strokeWidth: 2.2,
      dashArray: '2 3',
      colorVar: 'var(--fg-secondary)',
      verdict: 'Distribui carga até o cabo. Domina slow pitch jigging e linhas finas; não tem resposta seca para ferragem.',
    },
  ];

  let loadKg = $state(4.5);
  let rodAngleDeg = $state(45);

  const isHighSticking = $derived(
    loadKg >= 10.0 || (rodAngleDeg >= 65 && loadKg >= 5.5)
  );

  const xScale = scaleLinear().domain([0, 100]).range([78, 810]);
  const yScale = scaleLinear().domain([0, 100]).range([292, 42]);

  const pathGenerator = line<[number, number]>()
    .x((d) => xScale(d[0]))
    .y((d) => yScale(d[1]))
    .curve(curveCatmullRom.alpha(0.5));

  function buildCurveData(spec: ActionSpec, load: number, angleDeg: number) {
    const loadNorm = load / 15;
    const angleRad = (angleDeg * Math.PI) / 180;
    const angleFactor = 0.68 + (angleDeg - 25) / 140;
    const steps = 24;
    const points: Array<[number, number]> = [];
    const tipSectionPoints: Array<[number, number]> = [];

    for (let i = 0; i <= steps; i += 1) {
      const s = i / steps;
      const baseRise = s * 78 * Math.sin(angleRad);
      const baseRun = s * 74 * Math.cos(angleRad);

      const activeSpan = Math.max(0.08, 1 - spec.flexStart);
      const localS = Math.max(0, (s - spec.flexStart) / activeSpan);
      const bendCurve = Math.pow(localS, 2.05) * loadNorm * spec.bendWeight * angleFactor;

      const x = Math.min(97, 4 + baseRun + bendCurve * 24);
      const y = Math.max(6, 8 + baseRise - bendCurve * 58);
      points.push([x, y]);

      if (s >= 0.72) {
        tipSectionPoints.push([x, y]);
      }
    }

    const last = points[points.length - 1];
    return {
      d: pathGenerator(points) ?? '',
      tipD: pathGenerator(tipSectionPoints) ?? '',
      tipX: xScale(last[0]),
      tipY: yScale(last[1]),
    };
  }

  const curves = $derived(
    ACTIONS.map((spec) => ({
      spec,
      ...buildCurveData(spec, loadKg, rodAngleDeg),
    }))
  );

  const extraFastCurve = $derived(curves[0]);
</script>

<section
  id="sim-blank"
  data-study-only
  aria-labelledby="sim-blank-title"
  class="tufte-full-bleed border border-line-strong bg-surface p-5 sm:p-6 my-8"
>
  <div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3 mb-5">
    <div>
      <p class="font-mono text-[11px] font-bold uppercase tracking-widest text-salvage m-0">
        SIMULADOR DE FLEXÃO · D3-SHAPE + SVELTE 5
      </p>
      <h2 id="sim-blank-title" class="font-sans text-lg sm:text-xl font-bold tracking-tight text-ink mt-1 mb-0">
        Curva de Ação do Blank &amp; Zona de Fratura por High-Sticking
      </h2>
    </div>
    <span
      class="font-mono text-xs font-bold px-2.5 py-1 border tabular-telemetry {isHighSticking
        ? 'border-salvage bg-salvage-soft text-salvage'
        : 'border-line bg-elevated text-ocean'}"
    >
      {isHighSticking
        ? `ALERTA CRÍTICO: ${loadKg.toFixed(1)} KG A ${rodAngleDeg}°`
        : `OPERAÇÃO SEGURA: ${loadKg.toFixed(1)} KG A ${rodAngleDeg}°`}
    </span>
  </div>

  <!-- Controles de Carga e Ângulo -->
  <div class="grid gap-5 sm:grid-cols-2 mb-5">
    <label class="block">
      <div class="flex justify-between font-mono text-xs text-ink-secondary mb-1.5">
        <span>Carga aplicada na linha</span>
        <strong class="text-ink tabular-telemetry">{loadKg.toFixed(1)} kg</strong>
      </div>
      <input
        type="range"
        min="0.5"
        max="15"
        step="0.5"
        bind:value={loadKg}
        class="w-full accent-salvage cursor-pointer"
      />
      <div class="flex justify-between font-mono text-[10px] text-ink-muted mt-1">
        <span>0,5 kg (Toque leve)</span>
        <span>7,5 kg</span>
        <span>15,0 kg (Sobrecarga)</span>
      </div>
    </label>

    <label class="block">
      <div class="flex justify-between font-mono text-xs text-ink-secondary mb-1.5">
        <span>Ângulo do cabo acima da água</span>
        <strong class="text-ink tabular-telemetry">{rodAngleDeg}°</strong>
      </div>
      <input
        type="range"
        min="25"
        max="85"
        step="5"
        bind:value={rodAngleDeg}
        class="w-full accent-ocean cursor-pointer"
      />
      <div class="flex justify-between font-mono text-[10px] text-ink-muted mt-1">
        <span>25° (Apontada baixa)</span>
        <span>45° (Ângulo de combate)</span>
        <span>85° (Vertical fatal)</span>
      </div>
    </label>
  </div>

  <!-- Gráfico SVG Interativo -->
  <div class="border border-line bg-canvas p-3 sm:p-4">
    <svg
      viewBox="0 0 920 340"
      class="w-full h-auto block"
      role="img"
      aria-label="Curvas de flexão comparadas para ações Extra-Rápida, Rápida, Moderada e Lenta sob carga"
    >
      <!-- Eixos de referência -->
      <line
        x1="78"
        y1="292"
        x2="880"
        y2="292"
        stroke="var(--border-hairline)"
        stroke-width="1"
      />
      <line
        x1="108"
        y1="30"
        x2="108"
        y2="292"
        stroke="var(--border-hairline)"
        stroke-width="1"
        stroke-dasharray="4 4"
      />
      <text
        x="116"
        y="44"
        fill="var(--fg-muted)"
        font-family="var(--font-mono)"
        font-size="10"
        font-weight="700"
      >
        EIXO VERTICAL (ZONA DE HIGH-STICKING &gt; 65°)
      </text>

      <!-- Cabo / Reel Seat -->
      <rect
        x="48"
        y="264"
        width="64"
        height="14"
        fill="var(--fg-primary)"
      />
      <text
        x="48"
        y="314"
        fill="var(--fg-muted)"
        font-family="var(--font-mono)"
        font-size="10"
        font-weight="700"
      >
        CABO / GIMBAL
      </text>

      <!-- 4 Curvas D3 -->
      {#each curves as item}
        <path
          d={item.d}
          fill="none"
          stroke={item.spec.colorVar}
          stroke-width={item.spec.strokeWidth}
          stroke-dasharray={item.spec.dashArray}
          stroke-linecap="round"
        />
        <!-- Linha de carga vertical na ponta -->
        <line
          x1={item.tipX}
          y1={item.tipY}
          x2={item.tipX}
          y2={Math.min(286, item.tipY + 34)}
          stroke={item.spec.colorVar}
          stroke-width="1"
          stroke-dasharray="2 2"
          opacity="0.7"
        />
        <!-- Rótulo direto na ponteira -->
        <text
          x={item.tipX + 8}
          y={item.tipY + 4}
          fill={item.spec.colorVar}
          font-family="var(--font-mono)"
          font-size="11"
          font-weight="700"
        >
          {item.spec.name}
        </text>
      {/each}

      <!-- Alerta piscante na ponteira Extra-Rápida durante High-Sticking -->
      {#if isHighSticking && extraFastCurve}
        <path
          d={extraFastCurve.tipD}
          fill="none"
          stroke="var(--accent-salvage)"
          stroke-width="6.5"
          stroke-linecap="round"
          class="tip-alert-stroke"
        />
        <circle
          cx={extraFastCurve.tipX}
          cy={extraFastCurve.tipY}
          r="11"
          fill="var(--accent-salvage-soft)"
          stroke="var(--accent-salvage)"
          stroke-width="2.5"
          class="tip-alert-ring"
        />
        <g transform="translate(470, 26)">
          <rect
            x="0"
            y="0"
            width="426"
            height="34"
            fill="var(--accent-salvage-soft)"
            stroke="var(--accent-salvage)"
            stroke-width="1.5"
          />
          <text
            x="12"
            y="21"
            fill="var(--accent-salvage)"
            font-family="var(--font-mono)"
            font-size="11"
            font-weight="700"
          >
            HIGH-STICKING: COLAPSO NA PONTEIRA DE CARBONO
          </text>
        </g>
      {/if}
    </svg>
  </div>

  <!-- Mecânica Seca de Convés (Fausto) -->
  <div class="mt-4 grid gap-3 sm:grid-cols-2 border-t border-line pt-4">
    <div class="border border-line bg-elevated p-3.5">
      <p class="font-mono text-[10px] font-bold uppercase tracking-wider text-salvage m-0">
        RESPOSTA DE ANZOL &amp; GARATEIA
      </p>
      <p class="font-sans text-xs sm:text-sm leading-relaxed text-ink-secondary mt-1.5 mb-0">
        <strong>Ação Rápida</strong> rasga a boca do peixe se você usar garateias pequenas em plugs — a pancada seca arranca o anzol antes de o peixe virar. <strong>Ação Moderada</strong> trabalha como amortecedor contínuo, absorvendo o choque inicial sem abrir a fisgada.
      </p>
    </div>

    <div
      class="border p-3.5 {isHighSticking
        ? 'border-salvage bg-salvage-soft'
        : 'border-line bg-elevated'}"
    >
      <p class="font-mono text-[10px] font-bold uppercase tracking-wider text-ink m-0">
        MECÂNICA DA FRATURA (HIGH-STICKING)
      </p>
      <p class="font-sans text-xs sm:text-sm leading-relaxed text-ink-secondary mt-1.5 mb-0">
        <strong>High-sticking</strong> concentra toda a carga na ponta fina e fratura o carbono por compressão; o <em>blank</em> não foi feito para trabalhar na vertical içando peso como guindaste. Aponte a vara em ângulo moderado e deixe o freio da carretilha trabalhar.
      </p>
    </div>
  </div>
</section>

<style>
  @keyframes ap-tip-alert {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.18;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .tip-alert-stroke,
    .tip-alert-ring {
      animation: ap-tip-alert 520ms cubic-bezier(0.22, 1, 0.36, 1) infinite;
    }
  }
</style>
