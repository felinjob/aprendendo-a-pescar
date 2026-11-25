<script lang="ts">
  import {
    calculateRetrievalSpeed,
    calculateShockLeader,
    estimatePeLine,
    recommendSlowJigGrams,
  } from '../../lib/fishingMath';

  export interface PeLineRow {
    id: string;
    pe: number;
    diameterMm: number;
    strength4xLb: number;
    strength8xLb: number;
    typicalUse: string;
  }

  let { peLines }: { peLines: PeLineRow[] } = $props();

  type CalcTab = 'pe' | 'cpt' | 'jig-shock' | 'duel';
  let activeTab = $state<CalcTab>('pe');

  let peNumber = $state(2.0);
  let spoolDiameterMm = $state(54);
  let gearRatio = $state(6.2);
  let jigDepthM = $state(90);
  let jigCurrent = $state(1.0);
  let sinkerGrams = $state(140);
  let surfRodM = $state(4.2);

  const peResult = $derived(estimatePeLine(peNumber));
  const retrieval = $derived(calculateRetrievalSpeed(spoolDiameterMm, gearRatio));
  const slowJig = $derived(recommendSlowJigGrams(jigDepthM, jigCurrent));
  const shockLeader = $derived(calculateShockLeader(sinkerGrams, surfRodM));

  const REELS_50W = [
    {
      model: 'Shimano Tiagra 50W LRS-A',
      weightG: 2447,
      gearHigh: '3.1:1',
      gearLow: '1.3:1',
      maxDragKg: '20 kg (44 lb)',
      profile: 'Referência de durabilidade em iate clubes; alavanca de engate linear e chassis forjado a frio.',
    },
    {
      model: 'Penn International 50VISW',
      weightG: 1843,
      gearHigh: '3.5:1',
      gearLow: '1.3:1',
      maxDragKg: '20,4 kg (45 lb)',
      profile: 'Mais leve da classe (usinada em alumínio aeronáutico); sistema Dura-Drag progressivo e botão Shift rápido.',
    },
    {
      model: 'Okuma Makaira MK-50WII',
      weightG: 1860,
      gearHigh: '3.2:1',
      gearLow: '1.3:1',
      maxDragKg: '38,5 kg (85 lb)',
      profile: 'Maior capacidade de freio bruto da categoria (Dual Force Drag); manivela inclinada ergonômica para stand-up.',
    },
  ];
</script>

<section
  id="calculadoras-tralha"
  data-cais-keep
  aria-labelledby="tackle-calc-title"
  class="console-band tufte-full-bleed"
>
  <header class="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5 mb-6">
    <div>
      <p class="m-0 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-salvage">
        Bancada de Engenharia · Cálculo Direto de Campo
      </p>
      <h2 id="tackle-calc-title" class="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1.5 mb-0">
        Calculadoras PE, CPT/IPT, Slow Jig / Shock Leader &amp; Duelo 50W
      </h2>
    </div>
  </header>

  <!-- Abas limpas por filete inferior -->
  <div class="flex flex-wrap gap-6 border-b border-line pb-3 mb-6" role="tablist" aria-label="Calculadoras de tralha">
    {#each [
      { id: 'pe', label: '01 · Escala PE & Tabela' },
      { id: 'cpt', label: '02 · CPT / IPT Real' },
      { id: 'jig-shock', label: '03 · Slow Jig & Shock Leader' },
      { id: 'duel', label: '04 · Duelo 50W (2-Speed)' },
    ] as tab}
      {@const active = activeTab === tab.id}
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onclick={() => (activeTab = tab.id as CalcTab)}
        class="cursor-pointer bg-transparent border-0 pb-2 -mb-[13px] border-b-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors {active
          ? 'border-salvage text-ink'
          : 'border-transparent text-ink-muted hover:text-ink'}"
      >
        {tab.label}
      </button>
    {/each}
  </div>

  {#if activeTab === 'pe'}
    <div role="tabpanel" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div class="lg:col-span-5 flex flex-col gap-5">
        <label class="block">
          <div class="flex justify-between font-mono text-xs text-ink-secondary mb-2">
            <span>Número PE (Gou japonês)</span>
            <strong class="text-ink tabular-telemetry">PE {peNumber.toFixed(1)}</strong>
          </div>
          <input
            type="range"
            min="0.4"
            max="10"
            step="0.2"
            bind:value={peNumber}
            class="w-full accent-salvage cursor-pointer"
          />
        </label>

        <div class="grid grid-cols-3 gap-4 border-t border-b border-line py-4 tabular-telemetry">
          <div>
            <span class="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">Diâmetro</span>
            <strong class="block font-mono text-xl text-ink mt-1">{peResult.diameterMm} mm</strong>
          </div>
          <div>
            <span class="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">4 Fios (4X)</span>
            <strong class="block font-mono text-xl text-ocean mt-1">~{peResult.strength4xLb} lb</strong>
          </div>
          <div>
            <span class="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">8 Fios (8X)</span>
            <strong class="block font-mono text-xl text-salvage mt-1">~{peResult.strength8xLb} lb</strong>
          </div>
        </div>

        <p class="m-0 text-sm leading-relaxed text-ink-secondary">
          A escala <strong>PE (Gou)</strong> mede área de seção transversal constante do filamento de polietileno (<code class="font-mono text-xs">d ≈ 0,165 × √PE</code>), nunca libragem comercial. Por isso uma 8X moderna suporta ~30% mais tração no mesmo diâmetro real do que uma 4X clássica.
        </p>
      </div>

      <div class="lg:col-span-7 overflow-x-auto">
        <table class="editorial-table">
          <thead>
            <tr>
              <th>PE</th>
              <th>Diâmetro</th>
              <th>4X / 8X</th>
              <th>Aplicação de Campo</th>
            </tr>
          </thead>
          <tbody>
            {#each peLines as row (row.id)}
              <tr class={Math.abs(row.pe - peNumber) <= 0.25 ? 'bg-elevated' : ''}>
                <td class="font-mono font-bold text-ink">PE {row.pe.toFixed(1)}</td>
                <td class="font-mono text-ink">{row.diameterMm.toFixed(3)} mm</td>
                <td class="font-mono text-ocean">{row.strength4xLb} / {row.strength8xLb} lb</td>
                <td class="text-xs text-ink-secondary">{row.typicalUse}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {:else if activeTab === 'cpt'}
    <div role="tabpanel" class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      <div class="md:col-span-6 flex flex-col gap-5">
        <label class="block">
          <div class="flex justify-between font-mono text-xs text-ink-secondary mb-2">
            <span>Diâmetro externo do carretel cheio</span>
            <strong class="text-ink tabular-telemetry">{spoolDiameterMm} mm</strong>
          </div>
          <input
            type="range"
            min="30"
            max="115"
            step="1"
            bind:value={spoolDiameterMm}
            class="w-full accent-ocean cursor-pointer"
          />
          <div class="flex justify-between font-mono text-[10px] text-ink-muted mt-1">
            <span>32 mm (BFS/Low Profile)</span>
            <span>54 mm (Molinete 4000)</span>
            <span>110 mm (50W)</span>
          </div>
        </label>

        <label class="block">
          <div class="flex justify-between font-mono text-xs text-ink-secondary mb-2">
            <span>Relação de recolhimento (Gear Ratio)</span>
            <strong class="text-ink tabular-telemetry">{gearRatio.toFixed(1)}:1</strong>
          </div>
          <input
            type="range"
            min="1.3"
            max="9.2"
            step="0.1"
            bind:value={gearRatio}
            class="w-full accent-salvage cursor-pointer"
          />
        </label>
      </div>

      <div class="md:col-span-6 border-t border-line pt-4 md:border-t-0 md:pt-0">
        <div class="grid grid-cols-3 gap-4 border-b border-line pb-5 mb-4 tabular-telemetry">
          <div>
            <span class="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">CPT (cm/volta)</span>
            <strong class="block font-mono text-2xl text-salvage mt-1">{retrieval.cptCm} cm</strong>
          </div>
          <div>
            <span class="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">IPT (pol/volta)</span>
            <strong class="block font-mono text-2xl text-ocean mt-1">{retrieval.iptInches}"</strong>
          </div>
          <div>
            <span class="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">A 60 RPM</span>
            <strong class="block font-mono text-2xl text-ink mt-1">{retrieval.metersPerMinuteAt60Rpm} m/min</strong>
          </div>
        </div>
        <p class="m-0 text-sm leading-relaxed text-ink-secondary">
          Nunca compre carretilha apenas olhando a relação <strong>8.1:1</strong> na caixa: se o carretel for pequeno (32 mm), ela recolhe menos linha por volta do que um molinete 5.8:1 com carretel largo de 54 mm. O parâmetro real é <strong>CPT = π × D × relação</strong>.
        </p>
      </div>
    </div>
  {:else if activeTab === 'jig-shock'}
    <div role="tabpanel" class="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div class="flex flex-col gap-4">
        <p class="m-0 font-mono text-[11px] font-semibold uppercase tracking-wider text-ocean">
          Slow Pitch Jigging (Regra 1 g por pé)
        </p>
        <label class="block">
          <div class="flex justify-between font-mono text-xs text-ink-secondary mb-1.5">
            <span>Profundidade do parcel</span>
            <strong class="text-ink tabular-telemetry">{jigDepthM} m ({Math.round(jigDepthM * 3.28)} ft)</strong>
          </div>
          <input type="range" min="20" max="220" step="5" bind:value={jigDepthM} class="w-full accent-ocean cursor-pointer" />
        </label>
        <label class="block">
          <div class="flex justify-between font-mono text-xs text-ink-secondary mb-1.5">
            <span>Fator de corrente / deriva</span>
            <strong class="text-ink tabular-telemetry">{jigCurrent.toFixed(1)}×</strong>
          </div>
          <input type="range" min="0.8" max="1.6" step="0.1" bind:value={jigCurrent} class="w-full accent-salvage cursor-pointer" />
        </label>
        <div class="border-t border-line pt-4 tabular-telemetry">
          <span class="font-mono text-[10px] uppercase tracking-wider text-ink-muted">Jig Recomendado</span>
          <p class="font-mono text-2xl font-bold text-ocean mt-1 mb-1">
            {slowJig.idealGrams} g <span class="text-sm font-normal text-ink-secondary">(faixa {slowJig.minGrams}–{slowJig.maxGrams} g)</span>
          </p>
          <p class="m-0 text-xs text-ink-secondary">
            Priorize linha fina (PE 1.5–2.5) para cortar a corrente e manter a queda vertical sem precisar superdimensionar o peso do metal.
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-4 border-t border-line pt-6 md:border-t-0 md:pt-0">
        <p class="m-0 font-mono text-[11px] font-semibold uppercase tracking-wider text-salvage">
          Surfcasting · Shock Leader (Arranque)
        </p>
        <label class="block">
          <div class="flex justify-between font-mono text-xs text-ink-secondary mb-1.5">
            <span>Peso da chumbada</span>
            <strong class="text-ink tabular-telemetry">{sinkerGrams} g ({(sinkerGrams / 28.35).toFixed(1)} oz)</strong>
          </div>
          <input type="range" min="60" max="220" step="10" bind:value={sinkerGrams} class="w-full accent-salvage cursor-pointer" />
        </label>
        <label class="block">
          <div class="flex justify-between font-mono text-xs text-ink-secondary mb-1.5">
            <span>Comprimento da vara de praia</span>
            <strong class="text-ink tabular-telemetry">{surfRodM.toFixed(1)} m</strong>
          </div>
          <input type="range" min="3.6" max="4.5" step="0.1" bind:value={surfRodM} class="w-full accent-ocean cursor-pointer" />
        </label>
        <div class="border-t border-line pt-4 tabular-telemetry">
          <span class="font-mono text-[10px] uppercase tracking-wider text-ink-muted">Arranque Obrigatório</span>
          <p class="font-mono text-2xl font-bold text-salvage mt-1 mb-1">
            {shockLeader.recommendedLb} lb · {shockLeader.recommendedLengthM} m
          </p>
          <p class="m-0 text-xs text-ink-secondary">
            Regra: 10 lb por onça de chumbo (~28 g) e comprimento igual a 2× a vara + 4 a 5 voltas no carretel para absorver o chicote do arremesso.
          </p>
        </div>
      </div>
    </div>
  {:else}
    <div role="tabpanel" class="overflow-x-auto">
      <table class="editorial-table">
        <thead>
          <tr>
            <th>Modelo 50W 2-Speed</th>
            <th>Peso</th>
            <th>Alta / Baixa</th>
            <th>Freio Máx.</th>
            <th>Leitura Técnica de Convés</th>
          </tr>
        </thead>
        <tbody>
          {#each REELS_50W as reel}
            <tr>
              <td class="font-display text-base font-semibold text-ink">{reel.model}</td>
              <td class="font-mono text-ink">{reel.weightG} g</td>
              <td class="font-mono text-ocean">{reel.gearHigh} / {reel.gearLow}</td>
              <td class="font-mono text-salvage font-semibold">{reel.maxDragKg}</td>
              <td class="text-xs text-ink-secondary">{reel.profile}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>
