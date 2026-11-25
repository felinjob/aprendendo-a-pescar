<script lang="ts">
  import { onMount } from 'svelte';

  type ElectronicsTab = 'vhf' | 'sonar' | 'radar';

  let activeTab = $state<ElectronicsTab>('vhf');
  let isCaisMode = $state(false);

  onMount(() => {
    const syncMode = () => {
      isCaisMode =
        document.documentElement.dataset.studyMode === 'cais' ||
        document.documentElement.dataset.mode === 'cais';
    };

    syncMode();

    const observer = new MutationObserver(syncMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-study-mode', 'data-mode'],
    });

    return () => observer.disconnect();
  });
</script>

<section
  id="eletronica-bordo"
  data-cais-keep
  data-cais-priority
  aria-labelledby="electronics-title"
  class="my-8 border border-line-strong bg-surface p-5 sm:p-6"
>
  <div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3 mb-4">
    <div>
      <p class="font-mono text-[11px] font-bold uppercase tracking-widest text-salvage m-0">
        ELETRÔNICA DE BORDO &amp; COMUNICAÇÃO · REFERÊNCIA RÁPIDA
      </p>
      <h2 id="electronics-title" class="font-sans text-lg font-bold tracking-tight text-ink mt-1 mb-0">
        Rádio VHF, Sonar CHIRP / Omni 360° e Radar Bird Mode
      </h2>
    </div>

    {#if isCaisMode}
      <span class="border border-salvage bg-salvage-soft px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-salvage">
        PRIORIDADE CAIS ATIVA
      </span>
    {/if}
  </div>

  <!-- Abas declarativas -->
  <div class="grid grid-cols-3 gap-1.5 mb-5" role="tablist" aria-label="Sistemas eletrônicos de bordo">
    <button
      type="button"
      role="tab"
      id="tab-vhf"
      aria-controls="panel-vhf"
      aria-selected={activeTab === 'vhf'}
      onclick={() => (activeTab = 'vhf')}
      class="cursor-pointer border px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors {activeTab === 'vhf'
        ? 'border-line-strong bg-ink text-canvas'
        : 'border-line bg-elevated text-ink-secondary hover:border-line-strong'}"
    >
      VHF Marítimo
    </button>

    <button
      type="button"
      role="tab"
      id="tab-sonar"
      aria-controls="panel-sonar"
      aria-selected={activeTab === 'sonar'}
      onclick={() => (activeTab = 'sonar')}
      class="cursor-pointer border px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors {activeTab === 'sonar'
        ? 'border-line-strong bg-ink text-canvas'
        : 'border-line bg-elevated text-ink-secondary hover:border-line-strong'}"
    >
      CHIRP &amp; Omni
    </button>

    <button
      type="button"
      role="tab"
      id="tab-radar"
      aria-controls="panel-radar"
      aria-selected={activeTab === 'radar'}
      onclick={() => (activeTab = 'radar')}
      class="cursor-pointer border px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors {activeTab === 'radar'
        ? 'border-line-strong bg-ink text-canvas'
        : 'border-line bg-elevated text-ink-secondary hover:border-line-strong'}"
    >
      Radar &amp; Cascos
    </button>
  </div>

  <!-- Painéis -->
  <div
    id="panel-vhf"
    role="tabpanel"
    aria-labelledby="tab-vhf"
    hidden={activeTab !== 'vhf'}
    class="border border-line bg-elevated p-4"
  >
    <p class="font-sans text-xs sm:text-sm font-semibold text-ink mt-0 mb-3">
      O rádio VHF salva vidas antes de servir para resenha de cais: exige licença Anatel (MMSI 9 dígitos) e escuta permanente no Canal 16.
    </p>
    <div class="grid gap-2.5 sm:grid-cols-2 tabular-telemetry">
      <div class="border border-salvage bg-salvage-soft p-3">
        <span class="block font-mono text-xs font-bold text-salvage">CANAL 16 · 156,8 MHz</span>
        <p class="font-sans text-xs text-ink mt-1 mb-0">
          Exclusivo para socorro (<em>Mayday</em>), urgência (<em>Pan-Pan</em>), segurança (<em>Sécurité</em>) e chamada inicial; migre para canal de trabalho após o contato.
        </p>
      </div>
      <div class="border border-line bg-surface p-3">
        <span class="block font-mono text-xs font-bold text-ocean">CANAIS 68 / 69 &amp; 72</span>
        <p class="font-sans text-xs text-ink-secondary mt-1 mb-0">
          68 e 69: lazer e iate clubes. 72: barco-a-barco de pesca. 70: exclusivo para chamadas digitais seletivas (DSC).
        </p>
      </div>
    </div>
    <p class="font-mono text-[11px] text-ink-muted mt-3 mb-0">
      AJUSTE NO BRASIL: Use modo Americano (U) entre embarcações (25 W fixo ~40 NM / 5 W HT ~12 NM) e eleve o SQL (squelch) só até cortar o chiado.
    </p>
  </div>

  <div
    id="panel-sonar"
    role="tabpanel"
    aria-labelledby="tab-sonar"
    hidden={activeTab !== 'sonar'}
    class="border border-line bg-elevated p-4"
  >
    <div class="grid gap-2.5 sm:grid-cols-3 mb-3 tabular-telemetry">
      <div class="border border-line bg-surface p-3">
        <span class="block font-mono text-xs font-bold text-ink">High CHIRP (~130–250 kHz)</span>
        <p class="font-sans text-xs text-ink-secondary mt-1 mb-0">
          Máxima separação de alvos na coluna rasa e detecção de cardumes de isca perto da superfície.
        </p>
      </div>
      <div class="border border-line bg-surface p-3">
        <span class="block font-mono text-xs font-bold text-ink">Medium CHIRP (~80–160 kHz)</span>
        <p class="font-sans text-xs text-ink-secondary mt-1 mb-0">
          Cobertura intermediária para parcéis e lajes na plataforma continental.
        </p>
      </div>
      <div class="border border-line bg-surface p-3">
        <span class="block font-mono text-xs font-bold text-ocean">Low CHIRP (~28–75 kHz)</span>
        <p class="font-sans text-xs text-ink-secondary mt-1 mb-0">
          Penetração em grandes profundidades (ex.: Airmar B175L 40–60 kHz alcança ~760 m / 2.500 ft).
        </p>
      </div>
    </div>

    <div class="border-l-3 border-salvage bg-salvage-soft p-3">
      <span class="block font-mono text-[11px] font-bold uppercase text-salvage">
        OMNI SONAR 360° &amp; REGRA OWC 2026
      </span>
      <p class="font-sans text-xs sm:text-sm text-ink mt-1 mb-0">
        Sonares omnidirecionais retráteis (Furuno CSH8L/CSH10, 85 kHz) localizam marlins a centenas de metros sob o casco. A vantagem na caça submarina é tão desproporcional que o <strong>Offshore World Championship (OWC 2026)</strong> passou a atribuir pontuação maior para peixes de bico liberados <strong>sem</strong> uso de sonar omnidirecional.
      </p>
    </div>
  </div>

  <div
    id="panel-radar"
    role="tabpanel"
    aria-labelledby="tab-radar"
    hidden={activeTab !== 'radar'}
    class="border border-line bg-elevated p-4"
  >
    <p class="font-sans text-xs sm:text-sm text-ink mt-0 mb-3">
      O <strong>Radar com Bird Mode</strong> ajusta ganho e supressão de ondas (<em>sea clutter</em>) para destacar trilhas de aves caçando: antenas abertas (<em>open array</em> 4–6 pés, 4–12 kW) detectam aves a 4–8 NM em banda X (até 16–20 NM em sistemas de alta potência/banda S).
    </p>
    <div class="grid gap-2.5 sm:grid-cols-3">
      <div class="border border-line bg-surface p-3">
        <span class="block font-mono text-xs font-bold text-ink">Sportfisher / Flybridge</span>
        <p class="font-sans text-xs text-ink-secondary mt-1 mb-0">
          Comando elevado para ver peixe nos teasers e ré (backing down) superior; combate concentrado na popa.
        </p>
      </div>
      <div class="border border-line bg-surface p-3">
        <span class="block font-mono text-xs font-bold text-ocean">Center Console (CC)</span>
        <p class="font-sans text-xs text-ink-secondary mt-1 mb-0">
          Pesca 360° da popa à proa e cruzeiro rápido (50–65 mph multimotores); menos abrigo contra tempo.
        </p>
      </div>
      <div class="border border-line bg-surface p-3">
        <span class="block font-mono text-xs font-bold text-ink">Walkaround (WA)</span>
        <p class="font-sans text-xs text-ink-secondary mt-1 mb-0">
          Cabine na proa com corredor lateral rebaixado equilibrando abrigo e circulação de briga.
        </p>
      </div>
    </div>
  </div>
</section>
