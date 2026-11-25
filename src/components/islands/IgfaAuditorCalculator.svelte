<script lang="ts">
  interface AuditScenario {
    id: string;
    label: string;
    verdict: 'DESCLASSIFICADO' | 'VÁLIDO';
    rule: string;
    detail: string;
  }

  const LINE_CLASSES = [2, 4, 6, 8, 12, 16, 20, 30, 50, 80, 130] as const;
  const LB_TO_KG = 0.45359237;

  const SCENARIOS: AuditScenario[] = [
    {
      id: 'toque-dupla',
      label: 'Toque na linha dupla pelo marinheiro',
      verdict: 'DESCLASSIFICADO',
      rule: 'IGFA · Assistência Proibida na Linha Principal/Dupla',
      detail:
        'O marinheiro só pode segurar exclusivamente o líder (ou wind-on após a emenda passar pela ponteira). Encostar na double line ou na linha principal durante a briga anula o peixe no ato.',
    },
    {
      id: 'apoio-borda',
      label: 'Apoio da vara na borda ou amurada',
      verdict: 'DESCLASSIFICADO',
      rule: 'IGFA · Proibição de Apoio Estrutural',
      detail:
        'Apoiar o cabo ou o blank na amurada/borda do barco transfere carga mecânica para fora do corpo do pescador. Só são aceitos cinto de combate (gimbal) ou cadeira de briga homologada.',
    },
    {
      id: 'mutilacao-tubarao',
      label: 'Mutilação por tubarão pré-embarque',
      verdict: 'DESCLASSIFICADO',
      rule: 'IGFA · Peixe Mutilado Antes do Embarque',
      detail:
        'Qualquer mordida de tubarão, golfinho ou outro predador que arranque carne ou mutile o peixe antes de chegar ao convés invalida recordes e torneios (exceto cicatrizes antigas já cicatrizadas).',
    },
    {
      id: 'passagem-vara',
      label: 'Passagem de vara após a batida',
      verdict: 'DESCLASSIFICADO',
      rule: 'IGFA · Regra de Pescador Único',
      detail:
        'Do instante da batida até o embarque ou liberação, somente o pescador titular pode tocar a vara, a carretilha e a linha. Passar a vara no cockpit invalida a captura — exceto troca pré-strike no suporte.',
    },
    {
      id: 'garateia-natural',
      label: 'Garateia em isca natural para bico',
      verdict: 'DESCLASSIFICADO',
      rule: 'IGFA · Obrigatoriedade de Circle Hook Sem Offset',
      detail:
        'Em torneios IGFA de peixes de bico com isca natural (viva ou morta), é obrigatório usar anzol circular (circle hook) sem offset. Garateia em ballyhoo ou peixe vivo gera desclassificação imediata.',
    },
    {
      id: 'lider-valido',
      label: 'Marinheiro segura apenas o líder (≤ 9,14 m)',
      verdict: 'VÁLIDO',
      rule: 'IGFA · Manuseio Legal de Líder',
      detail:
        'Com a linha dupla fora da mão e o líder dentro do teto da classe (até 9,14 m em salgada > 20 lb), o marinheiro pode liderar o peixe para marcação, soltura ou embique sem violar o regulamento.',
    },
  ];

  let waterType = $state<'saltwater' | 'freshwater'>('saltwater');
  let lineClassLb = $state<number>(50);
  let spoolPct = $state<number>(100);
  let leaderM = $state<number>(9.14);
  let doubleLineM = $state<number>(3.05);
  let selectedScenarioId = $state<string>(SCENARIOS[0].id);

  // Tetos exatos IGFA por ambiente e classe
  const maxSingleSegment = $derived(
    waterType === 'freshwater' ? 1.82 : lineClassLb > 20 ? 9.14 : 4.57
  );
  const maxCombinedLimit = $derived(
    waterType === 'freshwater' ? 3.04 : lineClassLb > 20 ? 12.19 : 6.1
  );

  const combinedM = $derived(Number((leaderM + doubleLineM).toFixed(2)));
  const maxDoubleAllowed = $derived(
    Math.max(
      0,
      Math.min(maxSingleSegment, Number((maxCombinedLimit - leaderM).toFixed(2)))
    )
  );

  const leaderExceedsSingle = $derived(leaderM > maxSingleSegment + 0.001);
  const doubleExceedsSingle = $derived(doubleLineM > maxSingleSegment + 0.001);
  const combinedExceeds = $derived(combinedM > maxCombinedLimit + 0.001);
  const isRiggingIllegal = $derived(
    leaderExceedsSingle || doubleExceedsSingle || combinedExceeds
  );
  const excessM = $derived(
    Math.max(0, Number((combinedM - maxCombinedLimit).toFixed(2)))
  );

  // Strike Drag (25%–33% da classe com bobina cheia) + Física do braço de alavanca
  const strikeMinLb = $derived(Number((lineClassLb * 0.25).toFixed(2)));
  const strikeMaxLb = $derived(Number((lineClassLb * 0.33).toFixed(2)));
  const strike30Lb = $derived(Number((lineClassLb * 0.3).toFixed(2)));
  const realAxisTensionLb = $derived(
    Number((strike30Lb * (100 / spoolPct)).toFixed(2))
  );
  const effectiveLinePct = $derived(
    Math.round((realAxisTensionLb / lineClassLb) * 100)
  );
  const isSpoolCritical = $derived(effectiveLinePct >= 65);

  const activeScenario = $derived(
    SCENARIOS.find((s) => s.id === selectedScenarioId) ?? SCENARIOS[0]
  );

  function switchWater(next: 'saltwater' | 'freshwater') {
    waterType = next;
    if (next === 'freshwater') {
      leaderM = Math.min(leaderM, 1.82);
      doubleLineM = Math.min(doubleLineM, 1.22);
    } else if (lineClassLb > 20) {
      leaderM = 9.14;
      doubleLineM = 3.05;
    } else {
      leaderM = 3.05;
      doubleLineM = 3.05;
    }
  }

  function selectClass(cls: number) {
    lineClassLb = cls;
    if (waterType === 'saltwater') {
      if (cls <= 20 && combinedM > 6.1) {
        leaderM = 3.05;
        doubleLineM = 3.05;
      } else if (cls > 20 && leaderM <= 9.14 && doubleLineM <= 9.14) {
        // mantém escolha atual se válida
      }
    }
  }

  function applyWindOnPreset() {
    if (waterType === 'saltwater' && lineClassLb > 20) {
      leaderM = 9.14;
      doubleLineM = 3.05;
    } else if (waterType === 'saltwater') {
      leaderM = 4.57;
      doubleLineM = 1.53;
    } else {
      leaderM = 1.82;
      doubleLineM = 1.22;
    }
  }

  function autoFixRigging() {
    if (leaderM > maxSingleSegment) {
      leaderM = maxSingleSegment;
    }
    doubleLineM = Math.max(
      0,
      Math.min(maxSingleSegment, Number((maxCombinedLimit - leaderM).toFixed(2)))
    );
  }
</script>

<section
  id="auditor-igfa"
  data-cais-keep
  aria-labelledby="auditor-igfa-title"
  class="tufte-full-bleed border border-line-strong bg-elevated p-4 sm:p-6 my-8"
>
  <header class="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4 mb-5">
    <div>
      <p class="font-mono text-[11px] font-bold uppercase tracking-widest text-salvage m-0">
        CONFORMIDADE DE TORNEIO · AUDITOR DUPLO IGFA
      </p>
      <h2
        id="auditor-igfa-title"
        class="font-sans text-xl sm:text-2xl font-bold tracking-tight text-ink mt-1 mb-0"
      >
        Auditor de Rigging (2–130 lb), Strike Drag &amp; 6 Cenários de Desclassificação
      </h2>
      <p class="font-sans text-xs sm:text-sm text-ink-secondary mt-1 mb-0">
        Calibragem de 1/3 vale apenas para bobina cheia; no rigging, 9,14 m + 9,14 m passa o teto de 12,19 m e anula a equipe no vídeo.
      </p>
    </div>

    <div
      role="group"
      aria-label="Ambiente da prova IGFA"
      class="inline-flex border border-line-strong bg-surface p-0.5"
    >
      <button
        type="button"
        aria-pressed={waterType === 'saltwater'}
        onclick={() => switchWater('saltwater')}
        class="px-3 py-1.5 font-mono text-xs font-bold uppercase cursor-pointer transition-colors {waterType ===
        'saltwater'
          ? 'bg-ocean text-elevated'
          : 'bg-transparent text-ink-secondary hover:text-ink'}"
      >
        Água Salgada
      </button>
      <button
        type="button"
        aria-pressed={waterType === 'freshwater'}
        onclick={() => switchWater('freshwater')}
        class="px-3 py-1.5 font-mono text-xs font-bold uppercase cursor-pointer transition-colors {waterType ===
        'freshwater'
          ? 'bg-ocean text-elevated'
          : 'bg-transparent text-ink-secondary hover:text-ink'}"
      >
        Água Doce
      </button>
    </div>
  </header>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    <!-- CÁLCULO 1: DRAG & RIGGING (2 LB A 130 LB) -->
    <div class="lg:col-span-7 flex flex-col gap-4">
      <div class="border border-line bg-surface p-4">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span class="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            1. Classe de Linha IGFA (2 lb a 130 lb)
          </span>
          <span class="font-mono text-xs font-bold text-ocean tabular-telemetry">
            {lineClassLb} lb ({(lineClassLb * LB_TO_KG).toFixed(1)} kg)
          </span>
        </div>

        <div class="grid grid-cols-4 sm:grid-cols-6 gap-1.5" role="group" aria-label="Selecionar classe IGFA em libras">
          {#each LINE_CLASSES as cls}
            <button
              type="button"
              aria-pressed={lineClassLb === cls}
              onclick={() => selectClass(cls)}
              class="py-1.5 px-2 border font-mono text-xs font-bold cursor-pointer tabular-telemetry transition-colors {lineClassLb ===
              cls
                ? 'border-salvage bg-salvage text-elevated'
                : 'border-line bg-elevated text-ink hover:border-line-strong'}"
            >
              {cls} lb
            </button>
          {/each}
        </div>
      </div>

      <!-- Sliders de Rigging + Bobina -->
      <div class="border border-line bg-surface p-4 flex flex-col gap-4">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
          <span class="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            2. Matemática Seca do Rigging ({waterType === 'freshwater'
              ? 'Doce: teto 3,04 m'
              : lineClassLb > 20
                ? 'Salgada > 20 lb: teto 12,19 m'
                : 'Salgada ≤ 20 lb: teto 6,10 m'})
          </span>
          <button
            type="button"
            onclick={applyWindOnPreset}
            class="px-2.5 py-1 border border-ocean bg-ocean-soft font-mono text-[10px] font-bold text-ocean cursor-pointer hover:bg-ocean hover:text-elevated transition-colors"
          >
            {waterType === 'saltwater' && lineClassLb > 20
              ? 'Preset: Wind-On 9,14 m + Dupla 3,05 m'
              : 'Preset Teto Legal'}
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 tabular-telemetry">
          <label class="block">
            <div class="flex justify-between font-mono text-xs mb-1">
              <span class="text-ink-secondary">Líder / Wind-On (m)</span>
              <strong class={leaderExceedsSingle ? 'text-salvage' : 'text-ink'}>
                {leaderM.toFixed(2)} m (máx {maxSingleSegment.toFixed(2)})
              </strong>
            </div>
            <input
              type="range"
              min="0"
              max="10.5"
              step="0.01"
              bind:value={leaderM}
              class="w-full accent-ocean cursor-pointer"
            />
          </label>

          <label class="block">
            <div class="flex justify-between font-mono text-xs mb-1">
              <span class="text-ink-secondary">Linha Dupla / Bimini (m)</span>
              <strong class={doubleExceedsSingle ? 'text-salvage' : 'text-ink'}>
                {doubleLineM.toFixed(2)} m (disp. {maxDoubleAllowed.toFixed(2)})
              </strong>
            </div>
            <input
              type="range"
              min="0"
              max="10.5"
              step="0.01"
              bind:value={doubleLineM}
              class="w-full accent-salvage cursor-pointer"
            />
          </label>
        </div>

        <!-- Barra visual da soma combinada -->
        <div class="tabular-telemetry">
          <div class="flex justify-between font-mono text-[11px] mb-1">
            <span class="text-ink-secondary">
              Soma Combinada (Dupla + Líder): <strong class="text-ink">{combinedM.toFixed(2)} m</strong>
            </span>
            <span class="font-bold {isRiggingIllegal ? 'text-salvage' : 'text-ocean'}">
              Teto Combinado: {maxCombinedLimit.toFixed(2)} m
            </span>
          </div>
          <div class="h-3 w-full border border-line-strong bg-canvas flex overflow-hidden">
            <div
              class="h-full bg-salvage transition-all"
              style="width: {Math.min(100, (doubleLineM / maxCombinedLimit) * 100)}%"
              title="Linha Dupla"
            ></div>
            <div
              class="h-full bg-ocean transition-all"
              style="width: {Math.min(
                100 - Math.min(100, (doubleLineM / maxCombinedLimit) * 100),
                (leaderM / maxCombinedLimit) * 100
              )}%"
              title="Líder / Wind-On"
            ></div>
          </div>
        </div>

        {#if isRiggingIllegal}
          <div class="border-2 border-salvage bg-salvage-soft p-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="font-mono text-xs font-bold text-salvage m-0">
                DESCLASSIFICADO POR EXCESSO DE RIGGING
              </p>
              <p class="font-sans text-xs text-ink mt-1 mb-0">
                {#if leaderExceedsSingle}
                  Líder de {leaderM.toFixed(2)} m viola o máximo individual de {maxSingleSegment.toFixed(2)} m.
                {/if}
                {#if doubleExceedsSingle}
                  Linha dupla de {doubleLineM.toFixed(2)} m viola o máximo individual de {maxSingleSegment.toFixed(2)} m.
                {/if}
                {#if combinedExceeds}
                  Combinado em {combinedM.toFixed(2)} m excede em <strong>+{excessM.toFixed(2)} m</strong> o teto de {maxCombinedLimit.toFixed(2)} m.
                {/if}
              </p>
            </div>
            <button
              type="button"
              onclick={autoFixRigging}
              class="px-3 py-1.5 border border-salvage bg-salvage font-mono text-[11px] font-bold text-elevated cursor-pointer"
            >
              Auto-corrigir Dupla para {maxDoubleAllowed.toFixed(2)} m
            </button>
          </div>
        {:else}
          <div class="border border-ocean bg-ocean-soft p-3">
            <p class="font-mono text-xs font-bold text-ocean m-0">
              RIGGING HOMOLOGADO · {combinedM.toFixed(2)} m / {maxCombinedLimit.toFixed(2)} m
            </p>
            <p class="font-sans text-xs text-ink-secondary mt-1 mb-0">
              {#if waterType === 'saltwater' && lineClassLb > 20 && leaderM >= 9.0}
                Com {leaderM.toFixed(2)} m de wind-on/líder, sua linha dupla encurta obrigatoriamente para no máximo <strong>{maxDoubleAllowed.toFixed(2)} m</strong> (nunca 9,14 + 9,14).
              {:else}
                Folga restante no combinado: <strong>{Math.max(0, maxCombinedLimit - combinedM).toFixed(2)} m</strong>. Em água salgada &gt; 20 lb, usar 9,14 m de líder exige cortar a dupla para 3,05 m.
              {/if}
            </p>
          </div>
        {/if}

        <!-- Strike Drag + Efeito Bobina Vazia -->
        <div class="border-t border-line pt-4 tabular-telemetry">
          <div class="flex flex-wrap justify-between font-mono text-xs mb-1.5">
            <span class="text-ink-secondary font-bold">
              3. Nível da Bobina na Corrida (Braço de Alavanca)
            </span>
            <strong class={isSpoolCritical ? 'text-salvage' : 'text-ink'}>{spoolPct}% restante</strong>
          </div>
          <input
            type="range"
            min="25"
            max="100"
            step="5"
            bind:value={spoolPct}
            class="w-full accent-salvage cursor-pointer"
          />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div class="border border-line bg-elevated p-3">
              <span class="block font-mono text-[10px] uppercase text-ink-muted">
                Strike na Balança (100% cheia · 25%–33%)
              </span>
              <strong class="font-mono text-base text-ocean">
                {strikeMinLb}–{strikeMaxLb} lb ({(strikeMinLb * LB_TO_KG).toFixed(2)}–{(
                  strikeMaxLb * LB_TO_KG
                ).toFixed(2)} kg)
              </strong>
            </div>
            <div
              class="border p-3 {isSpoolCritical
                ? 'border-salvage bg-salvage-soft'
                : 'border-line bg-elevated'}"
            >
              <span class="block font-mono text-[10px] uppercase text-ink-muted">
                Tensão Real a {spoolPct}% (base 30%)
              </span>
              <strong class="font-mono text-base {isSpoolCritical ? 'text-salvage' : 'text-ink'}">
                {realAxisTensionLb} lb ({effectiveLinePct}% da classe)
              </strong>
            </div>
          </div>

          <p class="mt-2.5 mb-0 font-editorial text-xs sm:text-sm text-ink-secondary">
            A regra de 1/3 vale exclusivamente para a bobina cheia. Quando o peixe arranca linha, o diâmetro do rolo cai e a força multiplicada pelo braço de alavanca mais o arrasto da água estoura a tralha se você não afrouxar a alavanca.
          </p>
        </div>
      </div>
    </div>

    <!-- CÁLCULO 2: MINI-AUDITOR IGFA (6 CENÁRIOS) -->
    <div class="lg:col-span-5 border border-line bg-surface p-4 flex flex-col gap-3">
      <div>
        <p class="font-mono text-[11px] font-bold uppercase tracking-widest text-salvage m-0">
          MINI-AUDITOR DE CONVÉS · 6 CENÁRIOS
        </p>
        <h3 class="font-sans text-base font-bold text-ink mt-1 mb-0">
          Veredicto Instantâneo da Auditoria
        </h3>
      </div>

      <div class="flex flex-col gap-1.5" role="group" aria-label="Cenários de auditoria IGFA">
        {#each SCENARIOS as scenario}
          {@const selected = selectedScenarioId === scenario.id}
          <button
            type="button"
            aria-pressed={selected}
            onclick={() => (selectedScenarioId = scenario.id)}
            class="text-left px-3 py-2 border font-mono text-xs cursor-pointer transition-colors flex items-center justify-between gap-2 {selected
              ? scenario.verdict === 'DESCLASSIFICADO'
                ? 'border-salvage bg-salvage-soft text-ink font-bold'
                : 'border-ocean bg-ocean-soft text-ink font-bold'
              : 'border-line bg-elevated text-ink-secondary hover:border-line-strong hover:text-ink'}"
          >
            <span>{scenario.label}</span>
            <span
              class="shrink-0 px-1.5 py-0.5 text-[10px] font-bold {scenario.verdict ===
              'DESCLASSIFICADO'
                ? 'bg-salvage text-elevated'
                : 'bg-ocean text-elevated'}"
            >
              {scenario.verdict === 'DESCLASSIFICADO' ? 'DQ' : 'OK'}
            </span>
          </button>
        {/each}
      </div>

      <div
        class="border-2 p-3.5 mt-1 {activeScenario.verdict === 'DESCLASSIFICADO'
          ? 'border-salvage bg-salvage-soft'
          : 'border-ocean bg-ocean-soft'}"
      >
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <span
            class="px-2 py-0.5 font-mono text-[11px] font-bold {activeScenario.verdict ===
            'DESCLASSIFICADO'
              ? 'bg-salvage text-elevated'
              : 'bg-ocean text-elevated'}"
          >
            {activeScenario.verdict}
          </span>
          <span class="font-mono text-[10px] font-bold text-ink-secondary">
            {activeScenario.rule}
          </span>
        </div>
        <p class="font-editorial text-sm leading-relaxed text-ink m-0">
          {activeScenario.detail}
        </p>
      </div>
    </div>
  </div>
</section>
