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
  class="console-band tufte-full-bleed"
>
  <div class="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4 mb-5">
    <div>
      <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-salvage m-0">
        Eletrônica de Bordo &amp; Comunicação · Referência de Cockpit
      </p>
      <h2 id="electronics-title" class="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1.5 mb-0">
        Rádio VHF, Sonar CHIRP / Omni 360° &amp; Radar Bird Mode
      </h2>
    </div>

    {#if isCaisMode}
      <span class="font-mono text-[11px] font-semibold uppercase tracking-wider text-salvage">
        Prioridade Cais Ativa
      </span>
    {/if}
  </div>

  <div class="flex flex-wrap gap-6 border-b border-line pb-3 mb-6" role="tablist" aria-label="Sistemas eletrônicos de bordo">
    <button
      type="button"
      role="tab"
      id="tab-vhf"
      aria-controls="panel-vhf"
      aria-selected={activeTab === 'vhf'}
      onclick={() => (activeTab = 'vhf')}
      class="cursor-pointer bg-transparent border-0 pb-2 -mb-[13px] border-b-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors {activeTab === 'vhf'
        ? 'border-salvage text-ink'
        : 'border-transparent text-ink-muted hover:text-ink'}"
    >
      01 · VHF Marítimo
    </button>

    <button
      type="button"
      role="tab"
      id="tab-sonar"
      aria-controls="panel-sonar"
      aria-selected={activeTab === 'sonar'}
      onclick={() => (activeTab = 'sonar')}
      class="cursor-pointer bg-transparent border-0 pb-2 -mb-[13px] border-b-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors {activeTab === 'sonar'
        ? 'border-salvage text-ink'
        : 'border-transparent text-ink-muted hover:text-ink'}"
    >
      02 · CHIRP &amp; Omni 360°
    </button>

    <button
      type="button"
      role="tab"
      id="tab-radar"
      aria-controls="panel-radar"
      aria-selected={activeTab === 'radar'}
      onclick={() => (activeTab = 'radar')}
      class="cursor-pointer bg-transparent border-0 pb-2 -mb-[13px] border-b-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors {activeTab === 'radar'
        ? 'border-salvage text-ink'
        : 'border-transparent text-ink-muted hover:text-ink'}"
    >
      03 · Radar &amp; Cascos
    </button>
  </div>

  <div id="panel-vhf" role="tabpanel" aria-labelledby="tab-vhf" hidden={activeTab !== 'vhf'}>
    <p class="max-w-[66ch] text-sm leading-relaxed text-ink mt-0 mb-5">
      O rádio VHF salva vidas antes de servir para resenha de cais: exige licença Anatel (<strong>MMSI 9 dígitos</strong>) e escuta permanente no Canal 16.
    </p>
    <div class="grid gap-6 sm:grid-cols-2 border-t border-line pt-4 tabular-telemetry">
      <div>
        <span class="block font-mono text-xs font-bold text-salvage uppercase tracking-wider">Canal 16 · 156,8 MHz</span>
        <p class="text-sm leading-relaxed text-ink mt-1.5 mb-0">
          Exclusivo para socorro (<em>Mayday</em>), urgência (<em>Pan-Pan</em>), segurança (<em>Sécurité</em>) e chamada inicial; migre imediatamente para canal de trabalho após o contato.
        </p>
      </div>
      <div>
        <span class="block font-mono text-xs font-bold text-ocean uppercase tracking-wider">Canais 68 / 69, 70 &amp; 72</span>
        <p class="text-sm leading-relaxed text-ink-secondary mt-1.5 mb-0">
          <strong>68 e 69</strong>: lazer e iate clubes. <strong>72</strong>: barco-a-barco de pesca. <strong>70</strong>: exclusivo para chamadas digitais seletivas (DSC).
        </p>
      </div>
    </div>
    <p class="font-mono text-xs text-ink-muted mt-5 pt-3 border-t border-line mb-0">
      Ajuste no Brasil: Modo Americano ("U") entre barcos · 25 W fixo (~40 NM) / 5 W portátil (~12 NM) · eleve o SQL (squelch) apenas até cortar o chiado estático.
    </p>
  </div>

  <div id="panel-sonar" role="tabpanel" aria-labelledby="tab-sonar" hidden={activeTab !== 'sonar'}>
    <div class="grid gap-6 sm:grid-cols-3 mb-6 tabular-telemetry">
      <div class="border-t border-line pt-3">
        <span class="block font-mono text-xs font-bold text-ink">High CHIRP (130–250 kHz)</span>
        <p class="text-sm text-ink-secondary mt-1.5 mb-0">
          Máxima separação de alvos na coluna rasa e detecção nítida de cardumes de isca perto da superfície.
        </p>
      </div>
      <div class="border-t border-line pt-3">
        <span class="block font-mono text-xs font-bold text-ink">Medium CHIRP (80–160 kHz)</span>
        <p class="text-sm text-ink-secondary mt-1.5 mb-0">
          Equilíbrio entre cobertura e alcance para parcéis e lajes sobre a plataforma continental.
        </p>
      </div>
      <div class="border-t border-line pt-3">
        <span class="block font-mono text-xs font-bold text-ocean">Low CHIRP (28–75 kHz)</span>
        <p class="text-sm text-ink-secondary mt-1.5 mb-0">
          Penetração em grandes profundidades do talude (ex.: Airmar B175L 40–60 kHz alcança ~760 m / 2.500 ft).
        </p>
      </div>
    </div>

    <div class="border-t-2 border-salvage pt-4 max-w-[66ch]">
      <span class="block font-mono text-[11px] font-semibold uppercase tracking-wider text-salvage">
        Omni Sonar 360° &amp; Regra OWC 2026
      </span>
      <p class="text-sm leading-relaxed text-ink mt-1.5 mb-0">
        Sonares omnidirecionais retráteis (Furuno CSH8L / CSH10, 85 kHz) rastreiam marlins a centenas de metros sob o casco. A vantagem é tão desproporcional que o <strong>Offshore World Championship (OWC 2026)</strong> passou a atribuir pontuação superior para peixes de bico liberados <strong>sem</strong> uso de sonar omnidirecional.
      </p>
    </div>
  </div>

  <div id="panel-radar" role="tabpanel" aria-labelledby="tab-radar" hidden={activeTab !== 'radar'}>
    <p class="max-w-[66ch] text-sm leading-relaxed text-ink mt-0 mb-5">
      O <strong>Radar com Bird Mode</strong> ajusta ganho e supressão de ondas (<em>sea clutter</em>) para revelar trilhas de aves caçando: antenas abertas (<em>open array</em> 4–6 pés, 4–12 kW) detectam aves a 4–8 NM em banda X (até 16–20 NM em alta potência).
    </p>
    <div class="grid gap-6 sm:grid-cols-3 border-t border-line pt-4">
      <div>
        <span class="block font-display text-base font-semibold text-ink">Sportfisher / Flybridge</span>
        <p class="text-xs leading-relaxed text-ink-secondary mt-1.5 mb-0">
          Comando elevado para ler peixe acendendo nos teasers e ré (backing down) superior; combate concentrado no cockpit de popa.
        </p>
      </div>
      <div>
        <span class="block font-display text-base font-semibold text-ocean">Center Console (CC)</span>
        <p class="text-xs leading-relaxed text-ink-secondary mt-1.5 mb-0">
          Circulação 360° da popa à proa para arremesso e jigging, cruzeiro rápido (50–65 mph multimotores); menor abrigo contra mau tempo.
        </p>
      </div>
      <div>
        <span class="block font-display text-base font-semibold text-ink">Walkaround (WA)</span>
        <p class="text-xs leading-relaxed text-ink-secondary mt-1.5 mb-0">
          Cabine na proa com corredor lateral rebaixado, equilibrando pernoite/abrigo e mobilidade de briga ao redor do casco.
        </p>
      </div>
    </div>
  </div>
</section>
