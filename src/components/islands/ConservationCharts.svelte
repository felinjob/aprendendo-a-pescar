<script lang="ts">
  interface HookMetricRow {
    metric: string;
    subtitle: string;
    inlinePct: number;
    offsetPct: number;
    jHookPct: number;
    highlightNote?: string;
  }

  const HOOK_METRICS: HookMetricRow[] = [
    {
      metric: 'Fisgada na Boca (Canto)',
      subtitle: 'Zona ideal de soltura limpa e rápida',
      inlinePct: 85,
      offsetPct: 52,
      jHookPct: 27,
    },
    {
      metric: 'Fisgada Profunda (Garganta / Esôfago)',
      subtitle: 'Principal causa de mortalidade pós-soltura',
      inlinePct: 2,
      offsetPct: 44,
      jHookPct: 44,
      highlightNote: 'Offset de apenas 15° dispara de 2% para 44% e iguala o anzol J!',
    },
    {
      metric: 'Sangramento Severo',
      subtitle: 'Hemorragia branquial ou cardíaca',
      inlinePct: 4,
      offsetPct: 22,
      jHookPct: 26,
    },
  ];
</script>

<section
  id="conservacao-dados"
  data-study-only
  aria-labelledby="conservacao-dados-title"
  class="console-band tufte-full-bleed"
>
  <header class="border-b border-line pb-4 mb-5">
    <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-salvage m-0">
      Evidência Empírica · Small Multiples (Paleta Okabe-Ito)
    </p>
    <h2
      id="conservacao-dados-title"
      class="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1.5 mb-0"
    >
      Geometria do Anzol (Circle vs. Offset 15° vs. J) &amp; Manejo Pós-Captura
    </h2>
    <p class="text-sm text-ink-secondary mt-1.5 mb-0 max-w-[66ch]">
      A ciência desmente a farpa e o boga grip na vertical: dados medidos substituem o achismo no convés.
    </p>
  </header>

  <!-- Legenda Okabe-Ito colorblind-safe -->
  <div class="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line pb-3 mb-6 font-mono text-xs">
    <span class="font-semibold text-ink-muted uppercase text-[10px] tracking-wider">Legenda Okabe-Ito:</span>
    <span class="inline-flex items-center gap-1.5 font-bold text-ink">
      <span class="inline-block w-3 h-3" style="background-color: var(--oi-blue);"></span>
      Circle Inline (0° offset)
    </span>
    <span class="inline-flex items-center gap-1.5 font-bold text-ink">
      <span class="inline-block w-3 h-3" style="background-color: var(--oi-orange);"></span>
      Circle Offset (15°)
    </span>
    <span class="inline-flex items-center gap-1.5 font-bold text-ink">
      <span class="inline-block w-3 h-3" style="background-color: var(--oi-vermilion);"></span>
      Anzol J / Com Farpa / Vertical
    </span>
    <span class="inline-flex items-center gap-1.5 font-bold text-ink">
      <span class="inline-block w-3 h-3" style="background-color: var(--oi-bluish-green);"></span>
      Sem Farpa (Amassada)
    </span>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
    <!-- PAINEL 1: CIRCLE HOOK VS J VS OFFSET 15° -->
    <div class="lg:col-span-7 flex flex-col justify-between gap-4">
      <div>
        <p class="font-mono text-[11px] font-bold uppercase tracking-wider text-ocean m-0">
          PAINEL A · ANATOMIA DA FISGADA (%)
        </p>
        <h3 class="font-sans text-base font-bold text-ink mt-1 mb-3">
          Circle Hook Inline vs. Offset (15°) vs. Anzol J
        </h3>

        <svg
          viewBox="0 0 540 276"
          class="w-full h-auto block border border-line bg-canvas"
          role="img"
          aria-label="Gráfico de barras horizontais comparando fisgada na boca, fisgada profunda e sangramento entre Circle Inline, Circle Offset 15 graus e Anzol J"
        >
          <!-- Grade vertical 0%, 50%, 100% -->
          {#each [0, 50, 100] as tick}
            {@const gx = 175 + (tick / 100) * 315}
            <line
              x1={gx}
              y1="20"
              x2={gx}
              y2="246"
              stroke="var(--border-hairline)"
              stroke-dasharray="3 3"
            />
            <text
              x={gx}
              y="264"
              text-anchor="middle"
              font-family="var(--font-mono)"
              font-size="9.5"
              fill="var(--fg-muted)"
            >
              {tick}%
            </text>
          {/each}

          {#each HOOK_METRICS as row, idx}
            {@const baseY = 26 + idx * 74}
            <text
              x="12"
              y={baseY + 12}
              font-family="var(--font-sans)"
              font-size="11"
              font-weight="700"
              fill="var(--fg-primary)"
            >
              {row.metric}
            </text>

            <!-- Barra 1: Circle Inline -->
            <text x="166" y={baseY + 30} text-anchor="end" font-family="var(--font-mono)" font-size="9" fill="var(--fg-secondary)">
              Circle 0°
            </text>
            <rect
              x="175"
              y={baseY + 21}
              width={(row.inlinePct / 100) * 315}
              height="11"
              fill="var(--oi-blue)"
            />
            <text
              x={181 + (row.inlinePct / 100) * 315}
              y={baseY + 30}
              font-family="var(--font-mono)"
              font-size="9.5"
              font-weight="700"
              fill="var(--oi-blue)"
            >
              {row.inlinePct}%
            </text>

            <!-- Barra 2: Offset 15° -->
            <text x="166" y={baseY + 45} text-anchor="end" font-family="var(--font-mono)" font-size="9" fill="var(--fg-secondary)">
              Offset 15°
            </text>
            <rect
              x="175"
              y={baseY + 36}
              width={(row.offsetPct / 100) * 315}
              height="11"
              fill="var(--oi-orange)"
            />
            <text
              x={181 + (row.offsetPct / 100) * 315}
              y={baseY + 45}
              font-family="var(--font-mono)"
              font-size="9.5"
              font-weight="700"
              fill="var(--oi-orange)"
            >
              {row.offsetPct}%
            </text>

            <!-- Barra 3: Anzol J -->
            <text x="166" y={baseY + 60} text-anchor="end" font-family="var(--font-mono)" font-size="9" fill="var(--fg-secondary)">
              Anzol J
            </text>
            <rect
              x="175"
              y={baseY + 51}
              width={(row.jHookPct / 100) * 315}
              height="11"
              fill="var(--oi-vermilion)"
            />
            <text
              x={181 + (row.jHookPct / 100) * 315}
              y={baseY + 60}
              font-family="var(--font-mono)"
              font-size="9.5"
              font-weight="700"
              fill="var(--oi-vermilion)"
            >
              {row.jHookPct}%
            </text>
          {/each}
        </svg>
      </div>

      <div class="border-t-2 border-salvage pt-3 tabular-telemetry">
        <p class="font-mono text-xs font-bold text-salvage m-0">
          O ERRO DO OFFSET: 15° DE TORÇÃO IGUALAM O ANZOL J (2% → 44% NO ESÔFAGO)
        </p>
        <p class="text-xs sm:text-sm leading-relaxed text-ink mt-1.5 mb-0">
          O anzol circular só desliza até o canto da boca (<strong>85%</strong> vs. <strong>27%</strong> no J) quando a ponta está alinhada (inline 0°). Basta entortar 15° para a fisgada profunda saltar de <strong>2% para 44%</strong>.
        </p>
      </div>
    </div>

    <!-- PAINEL 2: COOKE ET AL. (2022) — FARPA & LIP GRIPPER -->
    <div class="lg:col-span-5 flex flex-col justify-between gap-4">
      <div class="flex flex-col gap-4">
        <div>
          <p class="font-mono text-[11px] font-bold uppercase tracking-wider text-ocean m-0">
            PAINEL B · MANEJO PÓS-CAPTURA (COOKE ET AL., 2022)
          </p>
          <h3 class="font-sans text-base font-bold text-ink mt-1 mb-3">
            Farpa Amassada &amp; Lesão por Lip Gripper
          </h3>

          <svg
            viewBox="0 0 420 206"
            class="w-full h-auto block border border-line bg-canvas tabular-telemetry"
            role="img"
            aria-label="Small multiples de Cooke et al. 2022 mostrando rasgo esofágico de 6,5% sem farpa contra 39,1% com farpa, e 100% de lesão mandibular no lip gripper vertical"
          >
            <!-- Subgráfico 1: Rasgo Esofágico -->
            <text x="14" y="22" font-family="var(--font-sans)" font-size="11" font-weight="700" fill="var(--fg-primary)">
              1. Rasgo Esofágico na Retirada do Anzol
            </text>

            <text x="14" y="45" font-family="var(--font-mono)" font-size="9.5" fill="var(--fg-secondary)">
              Sem Farpa (amassada)
            </text>
            <rect x="160" y="34" width={(6.5 / 100) * 205} height="13" fill="var(--oi-bluish-green)" />
            <text x={166 + (6.5 / 100) * 205} y="45" font-family="var(--font-mono)" font-size="10" font-weight="700" fill="var(--oi-bluish-green)">
              6,5%
            </text>

            <text x="14" y="67" font-family="var(--font-mono)" font-size="9.5" fill="var(--fg-secondary)">
              Com Farpa
            </text>
            <rect x="160" y="56" width={(39.1 / 100) * 205} height="13" fill="var(--oi-vermilion)" />
            <text x={166 + (39.1 / 100) * 205} y="67" font-family="var(--font-mono)" font-size="10" font-weight="700" fill="var(--oi-vermilion)">
              39,1% (6× pior)
            </text>

            <line x1="14" y1="90" x2="406" y2="90" stroke="var(--border-hairline)" />

            <!-- Subgráfico 2: Lip Gripper Vertical -->
            <text x="14" y="114" font-family="var(--font-sans)" font-size="11" font-weight="700" fill="var(--fg-primary)">
              2. Lesão Mandibular / Coluna por Contenção
            </text>

            <text x="14" y="139" font-family="var(--font-mono)" font-size="9.5" fill="var(--fg-secondary)">
              Apoio Horizontal (mão)
            </text>
            <rect x="160" y="128" width="4" height="13" fill="var(--oi-blue)" />
            <text x="170" y="139" font-family="var(--font-mono)" font-size="10" font-weight="700" fill="var(--oi-blue)">
              ~0% trauma
            </text>

            <text x="14" y="162" font-family="var(--font-mono)" font-size="9.5" fill="var(--fg-secondary)">
              Lip Gripper na Vertical
            </text>
            <rect x="160" y="151" width="205" height="13" fill="var(--oi-vermilion)" />
            <text x="370" y="162" font-family="var(--font-mono)" font-size="10" font-weight="700" fill="var(--oi-vermilion)">
              100%
            </text>

            <text x="14" y="192" font-family="var(--font-mono)" font-size="8.5" fill="var(--fg-muted)">
              Fonte: Cooke et al. (2022) · Amassar farpa reduz lesão esofágica de 39,1% p/ 6,5%.
            </text>
          </svg>
        </div>
      </div>

      <div class="border-t-2 border-line-strong pt-3">
        <p class="font-mono text-[11px] font-semibold uppercase tracking-wider text-salvage m-0">
          Protocolo Seco de Convés
        </p>
        <p class="text-sm leading-relaxed text-ink-secondary mt-1.5 mb-0">
          <strong>Fisgada funda:</strong> corte o líder rente à boca imediatamente — meter o alicate pelas guelras rasga arcos branquiais e mata o peixe por dentro. <strong>Lip Gripper:</strong> pendurar o peixe na vertical causa lesão na coluna ou rasga a membrana mandibular em <strong>100% das vezes</strong>.
        </p>
      </div>
    </div>
  </div>
</section>
