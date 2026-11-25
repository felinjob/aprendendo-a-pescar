<script lang="ts">
  type ExplorerTab = 'mar' | 'optica';

  interface DepthPreset {
    label: string;
    depthM: number;
  }

  interface ColorSwatch {
    name: string;
    rangeLabel: string;
    fadeStartM: number;
    fadeEndM: number;
    baseL: number;
    baseC: number;
    baseH: number;
    note: string;
  }

  const PRESETS: DepthPreset[] = [
    { label: '0 m · Superfície', depthM: 0 },
    { label: '5 m · Fim Vermelho', depthM: 5 },
    { label: '12 m · Fim Amarelo', depthM: 12 },
    { label: '20 m · Isca Cinza', depthM: 20 },
    { label: '30 m · Só Azul', depthM: 30 },
    { label: '150 m · O Corte', depthM: 150 },
    { label: '1000 m · Abissal', depthM: 1000 },
  ];

  const SWATCHES: ColorSwatch[] = [
    {
      name: 'Vermelho',
      rangeLabel: '4,5–6 m',
      fadeStartM: 2,
      fadeEndM: 6,
      baseL: 0.56,
      baseC: 0.22,
      baseH: 27,
      note: 'A 20 m uma isca vermelha viva vira cinza escuro / preto para o peixe.',
    },
    {
      name: 'Laranja',
      rangeLabel: '9–12 m',
      fadeStartM: 5,
      fadeEndM: 11,
      baseL: 0.67,
      baseC: 0.19,
      baseH: 52,
      note: 'Perde saturação rápida logo após a primeira camada de corrico.',
    },
    {
      name: 'Amarelo',
      rangeLabel: '10–14 m',
      fadeStartM: 7,
      fadeEndM: 14,
      baseL: 0.84,
      baseC: 0.17,
      baseH: 96,
      note: 'Mantém brilho claro até ~12 m antes de acinzentar.',
    },
    {
      name: 'Verde',
      rangeLabel: '20–24 m',
      fadeStartM: 12,
      fadeEndM: 24,
      baseL: 0.65,
      baseC: 0.17,
      baseH: 148,
      note: 'Segura contraste até 20–24 m; comum em jigs e saias de meia-água.',
    },
    {
      name: 'Azul / Violeta',
      rangeLabel: '> 30 m',
      fadeStartM: 25,
      fadeEndM: 180,
      baseL: 0.55,
      baseC: 0.17,
      baseH: 255,
      note: 'Último espectro visível abaixo de 30 m até o crepúsculo mesopelágico.',
    },
    {
      name: 'Preto (Silhueta)',
      rangeLabel: 'Sempre',
      fadeStartM: 150,
      fadeEndM: 900,
      baseL: 0.17,
      baseC: 0.01,
      baseH: 252,
      note: 'Não depende de cor refletida: recorta contra a luz difusa de cima.',
    },
  ];

  // Slider piecewise (0..55 => 0..55m com resolução 1:1; 55..100 => 55..1000m)
  function sliderToDepth(val: number): number {
    if (val <= 55) return Math.round(val * 2) / 2;
    const t = (val - 55) / 45;
    return Math.round(55 + Math.pow(t, 2.2) * 945);
  }

  function depthToSlider(depth: number): number {
    const clamped = Math.max(0, Math.min(1000, depth));
    if (clamped <= 55) return clamped;
    const t = Math.pow((clamped - 55) / 945, 1 / 2.2);
    return Number((55 + t * 45).toFixed(1));
  }

  let activeTab = $state<ExplorerTab>('mar');
  let sliderValue = $state(20); // Inicia exatamente em 20 m (marco didático da isca vermelha)

  const depthM = $derived(sliderToDepth(sliderValue));
  const hydrostaticAtm = $derived(1 + depthM / 10);
  const deltaWaterAtm = $derived(depthM / 10);
  const baroMultiple = $derived(Math.round((depthM * 100) / 3));

  // Interpolação OKLCH contínua de 0 m até 1000 m
  const waterColumnColor = $derived.by(() => {
    const d = depthM;
    if (d <= 30) {
      const t = d / 30;
      const l = 0.62 - t * 0.30;
      const c = 0.12 - t * 0.03;
      const h = 228 + t * 26;
      return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
    }
    if (d <= 200) {
      const t = (d - 30) / 170;
      const l = 0.32 - t * 0.14;
      const c = 0.09 - t * 0.045;
      const h = 254 + t * 4;
      return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
    }
    const t = (d - 200) / 800;
    const l = 0.18 - t * 0.08;
    const c = 0.045 - t * 0.028;
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} 258)`;
  });

  const waterSurfaceColor = $derived.by(() => {
    const d = Math.min(depthM, 200);
    const t = d / 200;
    const l = 0.72 - t * 0.45;
    const c = 0.11 - t * 0.04;
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} 228)`;
  });

  const zoneLabel = $derived.by(() => {
    if (depthM < 6) return 'Eufótica Rasa (Espectro Total)';
    if (depthM < 15) return 'Queda de Vermelho/Laranja';
    if (depthM <= 24) return 'Corte do Amarelo/Verde';
    if (depthM <= 200) return 'Zona Azul/Violeta & Talude';
    if (depthM <= 600) return 'Zona Crepuscular (Mesopelágica)';
    return 'Zona Afótica / Breu Abissal';
  });

  const survivingSpectrum = $derived.by(() => {
    if (depthM <= 4.5) return 'Vermelho, Laranja, Amarelo, Verde, Azul';
    if (depthM <= 9) return 'Laranja, Amarelo, Verde, Azul (Vermelho apagou)';
    if (depthM <= 14) return 'Verde, Azul/Violeta (Vermelho/Laranja/Amarelo apagados)';
    if (depthM <= 24) return 'Azul/Violeta dominante (Verde no limite)';
    if (depthM <= 200) return 'Apenas Azul/Violeta residual + Silhuetas';
    return 'Zero luz solar (apenas bioluminescência)';
  });

  // Posição Y no gráfico batimétrico (0m = y 44, 1000m = y 276) com escala visual clara para o corte
  const markerY = $derived.by(() => {
    if (depthM <= 200) {
      return 44 + (depthM / 200) * 116;
    }
    return 160 + ((depthM - 200) / 800) * 116;
  });

  function perceivedSwatchColor(swatch: ColorSwatch, currentDepth: number): string {
    if (currentDepth <= swatch.fadeStartM) {
      return `oklch(${swatch.baseL} ${swatch.baseC} ${swatch.baseH})`;
    }
    const progress = Math.min(
      1,
      (currentDepth - swatch.fadeStartM) / Math.max(1, swatch.fadeEndM - swatch.fadeStartM)
    );
    const abyssalFade = Math.min(1, Math.max(0, (currentDepth - 120) / 880));
    const chroma = swatch.baseC * (1 - progress * 0.96);
    const targetGrayL = currentDepth <= 60 ? 0.34 : 0.22 - abyssalFade * 0.12;
    const lightness = Math.max(
      0.1,
      swatch.baseL * (1 - progress * 0.58) + targetGrayL * (progress * 0.58) - abyssalFade * 0.14
    );
    return `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} 252)`;
  }

  function perceivedStatus(swatch: ColorSwatch, currentDepth: number): string {
    if (swatch.name.startsWith('Preto')) {
      return currentDepth > 400 ? 'Breu total' : 'Silhueta intacta';
    }
    if (currentDepth < swatch.fadeStartM) return 'Cor viva';
    if (currentDepth < swatch.fadeEndM) return 'Perdendo croma';
    if (currentDepth < 200) return 'Cinza escuro / preto';
    return 'Invisível (breu)';
  }
</script>

<section
  id="coluna-agua"
  data-study-only
  aria-labelledby="coluna-agua-title"
  class="console-band tufte-full-bleed"
>
  <header class="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4 mb-5">
    <div>
      <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-salvage m-0">
        Oceanografia &amp; Física da Água · 0 m a 1.000 m
      </p>
      <h2
        id="coluna-agua-title"
        class="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1.5 mb-0"
      >
        Explorador Batimétrico, Ressurgência (14°C) &amp; Absorção Óptica
      </h2>
    </div>

    <div role="tablist" aria-label="Modo de leitura da coluna d'água" class="flex gap-5">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'mar'}
        onclick={() => (activeTab = 'mar')}
        class="cursor-pointer bg-transparent border-0 pb-1.5 border-b-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors {activeTab === 'mar'
          ? 'border-ocean text-ink'
          : 'border-transparent text-ink-muted hover:text-ink'}"
      >
        Mar (Talude &amp; Ressurgência)
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'optica'}
        onclick={() => (activeTab = 'optica')}
        class="cursor-pointer bg-transparent border-0 pb-1.5 border-b-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors {activeTab === 'optica'
          ? 'border-salvage text-ink'
          : 'border-transparent text-ink-muted hover:text-ink'}"
      >
        Óptica (Absorção)
      </button>
    </div>
  </header>

  <!-- CONTROLE REVERSÍVEL DE PROFUNDIDADE (0 m a 1000 m) -->
  <div
    class="border border-line-strong p-4 mb-5 transition-colors"
    style="background: linear-gradient(95deg, {waterSurfaceColor} 0%, {waterColumnColor} 100%);"
  >
    <div class="bg-elevated/92 border border-line-strong p-3 sm:p-4">
      <div class="flex flex-wrap items-baseline justify-between gap-3 mb-2">
        <label
          for="depth-scrubber"
          class="font-mono text-xs font-bold uppercase tracking-wider text-ink"
        >
          Sondagem da Coluna d'Água (Reversível 0 m → 1000 m)
        </label>
        <div class="flex flex-wrap items-baseline gap-4 tabular-telemetry font-mono">
          <span class="text-xl sm:text-2xl font-bold text-salvage">{depthM} m</span>
          <span class="text-xs font-bold text-ocean">{hydrostaticAtm.toFixed(2)} atm</span>
          <span class="text-xs text-ink-secondary">{zoneLabel}</span>
        </div>
      </div>

      <input
        id="depth-scrubber"
        type="range"
        min="0"
        max="100"
        step="0.5"
        bind:value={sliderValue}
        class="w-full accent-salvage cursor-pointer"
        aria-valuetext="{depthM} metros de profundidade, {hydrostaticAtm.toFixed(2)} atmosferas"
      />

      <div class="mt-2.5 flex flex-wrap gap-1.5">
        {#each PRESETS as preset}
          {@const active = Math.abs(depthM - preset.depthM) <= (preset.depthM > 55 ? 4 : 0.5)}
          <button
            type="button"
            onclick={() => (sliderValue = depthToSlider(preset.depthM))}
            class="px-2 py-1 border font-mono text-[11px] font-bold cursor-pointer tabular-telemetry transition-colors {active
              ? 'border-salvage bg-salvage text-elevated'
              : 'border-line bg-surface text-ink hover:border-line-strong'}"
          >
            {preset.label}
          </button>
        {/each}
      </div>

      <p class="mt-2.5 mb-0 font-mono text-[11px] text-ink-secondary tabular-telemetry">
        <strong class="text-ink">Espectro restante a {depthM} m:</strong> {survivingSpectrum}
      </p>
    </div>
  </div>

  <!-- CONTEÚDO DA ABA 1: MAR (TALUDE & RESSURGÊNCIA) -->
  {#if activeTab === 'mar'}
    <div role="tabpanel" class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div class="lg:col-span-7 border border-line bg-surface p-3">
        <div class="flex items-center justify-between font-mono text-[10px] text-ink-muted mb-2">
          <span>PERFIL BATIMÉTRICO · COSTA RJ / CABO FRIO → O CORTE</span>
          <span class="tabular-telemetry">PROFUNDIDADE ATIVA: {depthM} m</span>
        </div>

        <svg
          viewBox="0 0 640 310"
          class="w-full h-auto block border border-line"
          role="img"
          aria-label="Perfil batimétrico da plataforma continental de 43 a 55 milhas náuticas até a queda abrupta do talude de 100 a 1000 metros com ressurgência de 14 graus Celsius"
        >
          <defs>
            <linearGradient id="ocean-depth-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="oklch(0.62 0.12 228)" />
              <stop offset="28%" stop-color="oklch(0.40 0.11 248)" />
              <stop offset="58%" stop-color="oklch(0.24 0.07 256)" />
              <stop offset="100%" stop-color="oklch(0.11 0.02 256)" />
            </linearGradient>
          </defs>

          <!-- Atmosfera / Ar -->
          <rect x="0" y="0" width="640" height="44" fill="var(--bg-canvas)" />
          <!-- Coluna d'água -->
          <rect x="0" y="44" width="640" height="266" fill="url(#ocean-depth-grad)" />

          <!-- Linha de 0 m / Superfície -->
          <line x1="0" y1="44" x2="640" y2="44" stroke="var(--border-strong)" stroke-width="1.5" />

          <!-- Vento Nordeste (NE) empurrando água quente superficial -->
          <g class="upwelling-flow">
            <line x1="120" y1="24" x2="265" y2="24" stroke="var(--accent-salvage)" stroke-width="2.2" />
            <polygon points="274,24 263,19 263,29" fill="var(--accent-salvage)" />
            <text
              x="120"
              y="15"
              font-family="var(--font-mono)"
              font-size="9.5"
              font-weight="700"
              fill="var(--accent-salvage)"
            >
              VENTO NE → EMPURRA ÁGUA QUENTE PARA O LARGO
            </text>
          </g>

          <!-- Perfil Geológico: Costa + Plataforma (43-55 NM) + O Corte (100-200m -> 1000m) -->
          <path
            d="M 0,26 L 38,44 L 315,108 L 368,142 L 420,276 L 640,282 L 640,310 L 0,310 Z"
            fill="var(--bg-surface)"
            stroke="var(--border-strong)"
            stroke-width="2"
          />

          <!-- Rótulos da Plataforma e Talude -->
          <text x="165" y="138" font-family="var(--font-mono)" font-size="9.5" font-weight="700" fill="var(--fg-primary)">
            PLATAFORMA (43–55 NM)
          </text>
          <text x="165" y="152" font-family="var(--font-mono)" font-size="8.5" fill="var(--fg-secondary)">
            Fundo raso 40–100 m
          </text>

          <!-- Setas de Ressurgência fria (14°C) subindo pelo corte -->
          <path
            d="M 412,262 Q 375,185 322,126 T 205,74"
            fill="none"
            stroke="oklch(0.84 0.11 215)"
            stroke-width="2.6"
            stroke-dasharray="7 4"
          />
          <polygon points="196,70 209,69 204,80" fill="oklch(0.84 0.11 215)" />

          <rect x="330" y="76" width="166" height="32" rx="2" fill="oklch(0.18 0.04 252 / 0.88)" stroke="oklch(0.84 0.11 215)" stroke-width="1" />
          <text x="413" y="90" text-anchor="middle" font-family="var(--font-mono)" font-size="9" font-weight="700" fill="oklch(0.92 0.04 215)">
            RESSURGÊNCIA · 14°C
          </text>
          <text x="413" y="102" text-anchor="middle" font-family="var(--font-mono)" font-size="8" fill="oklch(0.86 0.05 215)">
            Água profunda rica em nutrientes
          </text>

          <!-- Anotação "O CORTE" -->
          <line x1="368" y1="142" x2="495" y2="142" stroke="oklch(0.90 0.03 84)" stroke-dasharray="3 3" stroke-width="1" />
          <text x="502" y="145" font-family="var(--font-mono)" font-size="9.5" font-weight="700" fill="oklch(0.95 0.02 84)">
            O CORTE (100→1000 m)
          </text>

          <!-- Escala vertical de profundidade -->
          <text x="630" y="54" text-anchor="end" font-family="var(--font-mono)" font-size="8.5" fill="oklch(0.92 0.02 84)">0 m</text>
          <text x="630" y="160" text-anchor="end" font-family="var(--font-mono)" font-size="8.5" fill="oklch(0.88 0.02 84)">200 m</text>
          <text x="630" y="274" text-anchor="end" font-family="var(--font-mono)" font-size="8.5" fill="oklch(0.82 0.02 84)">1000 m</text>

          <!-- Linha horizontal móvel sincronizada com depthM -->
          <line
            x1="0"
            y1={markerY}
            x2="640"
            y2={markerY}
            stroke="var(--accent-salvage)"
            stroke-width="2"
          />
          <rect x="8" y={Math.max(46, markerY - 19)} width="142" height="17" rx="2" fill="var(--accent-salvage)" />
          <text
            x="14"
            y={Math.max(58, markerY - 7)}
            font-family="var(--font-mono)"
            font-size="9.5"
            font-weight="700"
            fill="var(--bg-elevated)"
          >
            SONDA: {depthM} m ({hydrostaticAtm.toFixed(1)} atm)
          </text>
        </svg>
      </div>

      <!-- Texto Técnico: Ressurgência + Falácia Barométrica -->
      <div class="lg:col-span-5 flex flex-col gap-6">
        <div class="border-t border-line pt-3">
          <p class="font-mono text-[11px] font-semibold uppercase tracking-widest text-ocean m-0">
            Dinâmica do Talude (43–55 NM)
          </p>
          <h3 class="font-display text-lg font-semibold text-ink mt-1 mb-2">
            Por que o Peixe de Bico Concentra no "Corte"
          </h3>
          <p class="text-sm leading-relaxed text-ink-secondary m-0">
            Ao largo do Rio e de Cabo Frio, entre <strong>43 e 55 milhas náuticas</strong> da costa, a plataforma continental termina de golpe no talude — despencando de 100–200 m para além de 1.000 m. Quando o <strong>vento Nordeste</strong> sopra contínuo, ele empurra a água quente da superfície para fora e suga do abismo uma massa fria de <strong>14°C</strong> carregada de nutrientes, detonando a cadeia alimentar no degrau.
          </p>
        </div>

        <div class="border-t-2 border-salvage pt-3">
          <p class="font-mono text-[11px] font-semibold uppercase tracking-widest text-salvage m-0">
            Desmistificação · Física de Pressão
          </p>
          <h3 class="font-display text-lg font-semibold text-ink mt-1 mb-2">
            A Falácia Barométrica (0,09 inHg = 3 cm)
          </h3>
          <p class="text-sm leading-relaxed text-ink m-0">
            Esqueça a desculpa do barômetro caindo antes da frente fria. Uma queda barométrica brutal de tempestade (<strong>0,09 inHg</strong> / ~3 hPa) reduz a pressão sobre o peixe no equivalente a apenas <strong>3 centímetros de coluna d'água</strong> (0,003 atm). O que realmente liga ou apaga a pescaria são <strong>temperatura</strong>, <strong>luminosidade</strong> (nuvens/turbidez) e o avanço da <strong>ressurgência a 14°C</strong>.
          </p>
        </div>
      </div>
    </div>

  <!-- CONTEÚDO DA ABA 2: ÓPTICA (ABSORÇÃO) -->
  {:else}
    <div role="tabpanel" class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- Lado Esquerdo: Ligações O-H e Simulador de Cor da Isca a {depthM}m -->
      <div class="lg:col-span-7 flex flex-col gap-4">
        <div class="border border-line bg-surface p-4">
          <div class="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <div>
              <p class="font-mono text-[11px] font-bold uppercase tracking-widest text-salvage m-0">
                ABSORÇÃO FÍSICA (LIGAÇÕES O–H DA ÁGUA)
              </p>
              <h3 class="font-sans text-base font-bold text-ink mt-1 mb-0">
                Cor na Bancada (0 m) vs. Percepção do Peixe a <span class="text-salvage tabular-telemetry">{depthM} m</span>
              </h3>
            </div>
            <span class="font-mono text-[11px] text-ink-secondary">
              O–H converte vermelho em calor ~100× mais rápido que azul
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {#each SWATCHES as swatch}
              {@const perceived = perceivedSwatchColor(swatch, depthM)}
              {@const status = perceivedStatus(swatch, depthM)}
              <div class="border border-line-strong bg-elevated p-2.5 flex flex-col gap-2">
                <div class="flex items-center justify-between font-mono text-[11px]">
                  <strong class="text-ink">{swatch.name}</strong>
                  <span class="text-ink-muted tabular-telemetry">{swatch.rangeLabel}</span>
                </div>

                <!-- Duas metades lado a lado: 0 m vs profundidade atual -->
                <div class="grid grid-cols-2 h-11 border border-line">
                  <div
                    class="flex items-end p-1 font-mono text-[9px] font-bold"
                    style="background-color: oklch({swatch.baseL} {swatch.baseC} {swatch.baseH}); color: oklch(0.98 0.01 84); text-shadow: 0 1px 2px oklch(0.12 0.02 252);"
                  >
                    0 m
                  </div>
                  <div
                    class="flex items-end p-1 font-mono text-[9px] font-bold transition-colors"
                    style="background-color: {perceived}; color: oklch(0.96 0.01 84); text-shadow: 0 1px 2px oklch(0.10 0.02 252);"
                  >
                    {depthM} m
                  </div>
                </div>

                <p class="font-mono text-[10px] font-bold text-ocean m-0">{status}</p>
                <p class="font-sans text-[11px] leading-snug text-ink-secondary m-0">{swatch.note}</p>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Lado Direito: Faixas Espectrais + Comparador Hidrostático vs Barômetro -->
      <div class="lg:col-span-5 flex flex-col gap-4">
        <div class="border border-line bg-surface p-4">
          <p class="font-mono text-[11px] font-bold uppercase tracking-widest text-ocean m-0">
            CURVA DE ATENUAÇÃO ESPECTRAL
          </p>
          <h3 class="font-sans text-base font-bold text-ink mt-1 mb-2">
            Por que Vermelho Vira Cinza Escuro a 20 m
          </h3>
          <p class="font-editorial text-sm leading-relaxed text-ink-secondary mt-0 mb-3">
            As ligações hidrogênio-oxigênio (<strong>O–H</strong>) da molécula de água absorvem energia vibracional dos fótons de onda longa (vermelho) cerca de <strong>100× mais rápido</strong> do que dos fótons azuis. Abaixo de 6 m não sobra luz vermelha para refletir na tinta da isca — uma <em>jighead</em> ou saia vermelha viva a 20 m retorna apenas silhueta <strong>cinza-chumbo ou preta</strong>.
          </p>

          <ul class="list-none p-0 m-0 flex flex-col gap-2 font-mono text-xs tabular-telemetry">
            <li class="flex justify-between border-b border-line pb-1">
              <span class="text-salvage font-bold">Vermelho (620–750 nm)</span>
              <span class="text-ink font-bold">Some 4,5–6 m</span>
            </li>
            <li class="flex justify-between border-b border-line pb-1">
              <span class="text-ink font-bold">Laranja / Amarelo</span>
              <span class="text-ink font-bold">Some 9–14 m</span>
            </li>
            <li class="flex justify-between border-b border-line pb-1">
              <span class="text-ocean font-bold">Verde (495–570 nm)</span>
              <span class="text-ink font-bold">Some 20–24 m</span>
            </li>
            <li class="flex justify-between">
              <span class="text-ocean font-bold">Azul / Violeta</span>
              <span class="text-ink font-bold">Sobrevive &gt; 30 m</span>
            </li>
          </ul>
        </div>

        <div class="border border-line-strong bg-elevated p-4 tabular-telemetry">
          <p class="font-mono text-[11px] font-bold uppercase tracking-widest text-salvage m-0">
            PRESSÃO HIDROSTÁTICA VS. BARÔMETRO
          </p>
          <div class="mt-2 grid grid-cols-2 gap-3 font-mono">
            <div class="border border-line bg-surface p-2.5">
              <span class="block text-[10px] text-ink-muted">Δ PRESSÃO A {depthM} M</span>
              <strong class="text-lg text-ocean">+{deltaWaterAtm.toFixed(2)} atm</strong>
            </div>
            <div class="border border-line bg-surface p-2.5">
              <span class="block text-[10px] text-ink-muted">VS. QUEDA 0,09 INHG</span>
              <strong class="text-lg text-salvage">{baroMultiple.toLocaleString('pt-BR')}× maior</strong>
            </div>
          </div>
          <p class="mt-2.5 mb-0 font-sans text-xs text-ink-secondary">
            Uma queda barométrica severa de 0,09 inHg equivale a descer 3 cm (0,003 atm). Descer a {depthM} m impõe {baroMultiple.toLocaleString('pt-BR')}× essa variação.
          </p>
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  @media (prefers-reduced-motion: reduce) {
    .upwelling-flow {
      animation: none !important;
    }
  }
</style>
