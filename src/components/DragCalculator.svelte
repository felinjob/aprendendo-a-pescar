<script lang="ts">
  const LINE_CLASSES = [20, 30, 50, 80, 130] as const;
  type LineClass = (typeof LINE_CLASSES)[number];

  let lineClassLb = $state<LineClass>(50);
  let windOnMeters = $state<number>(9.14);
  let spoolFillPct = $state<number>(100);

  const LB_TO_KG = 0.45359237;

  const isHeavyClass = $derived(lineClassLb > 20);
  const maxSingleSegment = $derived(isHeavyClass ? 9.14 : 4.57);
  const maxCombinedLimit = $derived(isHeavyClass ? 12.19 : 6.10);

  const clampedWindOn = $derived(Math.min(windOnMeters, maxSingleSegment));
  const maxDoubleLine = $derived(
    Math.min(
      maxSingleSegment,
      Math.max(0, Number((maxCombinedLimit - clampedWindOn).toFixed(2)))
    )
  );

  const strikeMinLb = $derived(Number((lineClassLb * 0.25).toFixed(1)));
  const strikeMaxLb = $derived(Number((lineClassLb * 0.33).toFixed(1)));
  const strikeTargetLb = $derived(Number((lineClassLb * 0.30).toFixed(1)));

  const effectiveTensionLb = $derived(
    Number((strikeTargetLb * (100 / spoolFillPct)).toFixed(1))
  );
  const tensionRatioPct = $derived(
    Math.round((effectiveTensionLb / lineClassLb) * 100)
  );
  const isDangerZone = $derived(tensionRatioPct >= 75);

  function selectClass(cls: LineClass) {
    lineClassLb = cls;
    const cap = cls > 20 ? 9.14 : 4.57;
    if (windOnMeters > cap) {
      windOnMeters = cap;
    }
  }
</script>

<section
  id="calc-igfa"
  data-cais-keep
  aria-labelledby="calc-igfa-title"
  class="border border-line-strong bg-surface p-5 sm:p-6 my-8"
>
  <div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3 mb-5">
    <div>
      <p class="font-mono text-[11px] font-bold tracking-widest uppercase text-salvage m-0">
        INSTRUMENTO INTERATIVO · SVELTE 5 ISLAND
      </p>
      <h2 id="calc-igfa-title" class="font-sans text-lg font-bold tracking-tight text-ink mt-1 mb-0">
        Calculadora de Strike Drag, Bobina Vazia &amp; Teto IGFA
      </h2>
    </div>
    <span class="font-mono text-xs text-ink-muted tabular-telemetry">
      CLASSE SELECIONADA: {lineClassLb} LB ({(lineClassLb * LB_TO_KG).toFixed(1)} KG)
    </span>
  </div>

  <!-- Seletor de Classe de Linha -->
  <div class="mb-6">
    <span class="block font-mono text-xs uppercase tracking-wider text-ink-secondary mb-2">
      1. Classe de Linha IGFA (primeiros 5 m)
    </span>
    <div class="grid grid-cols-5 gap-1.5" role="group" aria-label="Classe de linha IGFA">
      {#each LINE_CLASSES as cls}
        <button
          type="button"
          onclick={() => selectClass(cls)}
          class="cursor-pointer border px-2 py-2 font-mono text-xs font-bold transition-colors {lineClassLb === cls
            ? 'border-line-strong bg-ink text-canvas'
            : 'border-line bg-elevated text-ink hover:border-line-strong'}"
          aria-pressed={lineClassLb === cls}
        >
          {cls} lb
        </button>
      {/each}
    </div>
  </div>

  <!-- Sliders de Campo -->
  <div class="grid gap-5 sm:grid-cols-2 mb-6">
    <label class="block">
      <div class="flex justify-between font-mono text-xs text-ink-secondary mb-1.5">
        <span>2. Nível da Bobina no Combate</span>
        <strong class="text-ink tabular-telemetry">{spoolFillPct}% do carretel</strong>
      </div>
      <input
        type="range"
        min="25"
        max="100"
        step="5"
        bind:value={spoolFillPct}
        class="w-full accent-salvage cursor-pointer"
      />
      <div class="flex justify-between font-mono text-[10px] text-ink-muted mt-1">
        <span>25% (Crítico)</span>
        <span>50% (Meia bobina)</span>
        <span>100% (Cheio)</span>
      </div>
    </label>

    <label class="block">
      <div class="flex justify-between font-mono text-xs text-ink-secondary mb-1.5">
        <span>3. Comprimento do Wind-On Leader</span>
        <strong class="text-ink tabular-telemetry">{clampedWindOn.toFixed(2)} m</strong>
      </div>
      <input
        type="range"
        min="0"
        max={maxSingleSegment}
        step="0.01"
        bind:value={windOnMeters}
        class="w-full accent-ocean cursor-pointer"
      />
      <div class="flex justify-between font-mono text-[10px] text-ink-muted mt-1">
        <span>0,00 m</span>
        <span>Teto único: {maxSingleSegment.toFixed(2)} m</span>
      </div>
    </label>
  </div>

  <!-- Leituras Calculadas -->
  <div class="grid gap-3 sm:grid-cols-3 border-t border-line pt-4 tabular-telemetry">
    <div class="border border-line bg-elevated p-3">
      <span class="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
        Strike na Balança (100%)
      </span>
      <p class="font-mono text-lg font-bold text-ocean mt-1 mb-0.5">
        {strikeMinLb}–{strikeMaxLb} lb
      </p>
      <p class="font-mono text-xs text-ink-secondary m-0">
        {(strikeMinLb * LB_TO_KG).toFixed(1)}–{(strikeMaxLb * LB_TO_KG).toFixed(1)} kg (25%–33%)
      </p>
    </div>

    <div
      class="border p-3 transition-colors {isDangerZone
        ? 'border-salvage bg-salvage-soft'
        : 'border-line bg-elevated'}"
    >
      <span class="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
        Tensão Real a {spoolFillPct}% (base 30%)
      </span>
      <p class="font-mono text-lg font-bold mt-1 mb-0.5 {isDangerZone ? 'text-salvage' : 'text-ink'}">
        {effectiveTensionLb} lb ({tensionRatioPct}%)
      </p>
      <p class="font-mono text-xs text-ink-secondary m-0">
        {isDangerZone
          ? 'ALERTA: Aliviar alavanca — risco de estouro!'
          : 'Margem estrutural segura no eixo'}
      </p>
    </div>

    <div class="border border-line bg-elevated p-3">
      <span class="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
        Máx. Linha Dupla (Bimini)
      </span>
      <p class="font-mono text-lg font-bold text-ink mt-1 mb-0.5">
        {maxDoubleLine.toFixed(2)} m
      </p>
      <p class="font-mono text-xs text-ink-secondary m-0">
        Teto combinado: {maxCombinedLimit.toFixed(2)} m
      </p>
    </div>
  </div>
</section>
