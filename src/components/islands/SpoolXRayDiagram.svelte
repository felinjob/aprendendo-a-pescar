<script lang="ts">
  interface SpoolLayer {
    id: 'backing' | 'topshot' | 'double' | 'windon';
    order: string;
    name: string;
    spec: string;
    outerR: number;
    innerR: number;
    colorVar: string;
    softVar: string;
    justification: string;
  }

  const LAYERS: SpoolLayer[] = [
    {
      id: 'backing',
      order: '01',
      name: 'Backing (Multifilamento)',
      spec: '400–600 yd · Hollow Core 30–80 lb',
      outerR: 92,
      innerR: 46,
      colorVar: 'var(--fg-secondary)',
      softVar: 'var(--bg-surface)',
      justification:
        'Preenche o núcleo do carretel com reserva massiva de linha fina que dura várias temporadas. Nunca enrole multifilamento liso direto no eixo metálico sem cama de nylon ou fita de base — o bloco inteiro gira em falso (arbor slip).',
    },
    {
      id: 'topshot',
      order: '02',
      name: 'Top Shot (Monofilamento)',
      spec: '100–200 yd · Classe IGFA da Etapa',
      outerR: 124,
      innerR: 92,
      colorVar: 'var(--accent-ocean)',
      softVar: 'var(--accent-ocean-soft)',
      justification:
        'Emendado por dentro do hollow core (sem nó volumoso, travado com serving). Devolve elasticidade para amortecer a pancada violenta do marlin e permite trocar só a camada queimada pelo sol sem jogar fora o backing.',
    },
    {
      id: 'double',
      order: '03',
      name: 'Linha Dupla (Bimini Twist)',
      spec: 'Máx. 3,05 m c/ Wind-On de 9,14 m',
      outerR: 140,
      innerR: 124,
      colorVar: 'var(--fg-primary)',
      softVar: 'var(--bg-elevated)',
      justification:
        'Dobra o próprio top shot sobre si mesmo com 20–30 torções (~98–100% de retenção), absorvendo trancos na fase final da briga. Acima de 20 lb, seu comprimento somado ao líder não pode passar de 12,19 m.',
    },
    {
      id: 'windon',
      order: '04',
      name: 'Wind-On Leader',
      spec: '21–25 pés (até 9,14 m) · Loop-to-Loop',
      outerR: 156,
      innerR: 140,
      colorVar: 'var(--accent-salvage)',
      softVar: 'var(--accent-salvage-soft)',
      justification:
        'Líder grosso de mono ou fluorocarbono encamisado em luva de Dacron/hollow core. Passa liso pelos passadores direto para dentro do carretel, eliminando o handlining (marinheiro puxando o líder na mão) e evitando acidentes graves se o marlin arrancar na popa.',
    },
  ];

  let activeId = $state<SpoolLayer['id']>('windon');
  const activeLayer = $derived(
    LAYERS.find((layer) => layer.id === activeId) ?? LAYERS[3]
  );

  function handleLayerKey(event: KeyboardEvent, id: SpoolLayer['id']) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activeId = id;
    }
  }
</script>

<section
  id="raio-x-carretel"
  data-study-only
  aria-labelledby="spool-xray-title"
  class="console-band"
>
  <div class="flex flex-wrap items-end justify-between gap-2 border-b border-line pb-4 mb-5">
    <div>
      <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-salvage m-0">
        Corte Transversal Interativo · 4 Camadas
      </p>
      <h2 id="spool-xray-title" class="font-display text-2xl font-semibold text-ink mt-1 mb-0">
        Raio-X do Carretel Oceânico Moderno
      </h2>
    </div>
    <span class="font-mono text-[11px] text-ink-muted">
      Selecione uma camada no anel ou abaixo
    </span>
  </div>

  <!-- Seletor rápido de camadas -->
  <div class="flex flex-wrap gap-5 border-b border-line pb-3 mb-6" role="tablist" aria-label="Camadas do carretel">
    {#each LAYERS as layer}
      <button
        type="button"
        role="tab"
        aria-selected={activeId === layer.id}
        onclick={() => (activeId = layer.id)}
        onfocus={() => (activeId = layer.id)}
        class="cursor-pointer bg-transparent border-0 pb-2 -mb-[13px] border-b-2 text-left transition-colors {activeId === layer.id
          ? 'border-salvage text-ink'
          : 'border-transparent text-ink-muted hover:text-ink'}"
      >
        <span class="font-mono text-[10px] font-semibold mr-1.5">{layer.order}</span>
        <span class="font-mono text-xs font-semibold uppercase tracking-wider">
          {layer.name.split(' (')[0]}
        </span>
      </button>
    {/each}
  </div>

  <!-- SVG Corte Transversal + Justificativa Mecânica -->
  <div class="grid gap-8 sm:grid-cols-[260px_1fr] items-center">
    <div class="bg-canvas p-3 border border-line">
      <svg
        viewBox="0 0 340 340"
        class="w-full h-auto block"
        role="img"
        aria-label="Corte transversal concêntrico das quatro camadas de linha no carretel"
      >
        <!-- Desenho de fora para dentro para hitbox concêntrica limpa -->
        {#each [...LAYERS].reverse() as layer}
          {@const selected = activeId === layer.id}
          <circle
            cx="170"
            cy="170"
            r={layer.outerR}
            fill={selected ? layer.softVar : 'var(--bg-elevated)'}
            stroke={selected ? layer.colorVar : 'var(--border-hairline)'}
            stroke-width={selected ? 3 : 1.5}
            class="cursor-pointer transition-colors"
            role="button"
            tabindex="0"
            aria-label={`Selecionar ${layer.name}`}
            onclick={() => (activeId = layer.id)}
            onfocus={() => (activeId = layer.id)}
            onkeydown={(e) => handleLayerKey(e, layer.id)}
          />
        {/each}

        <!-- Eixo central (Arbor metálico) -->
        <circle
          cx="170"
          cy="170"
          r="46"
          fill="var(--bg-surface)"
          stroke="var(--border-strong)"
          stroke-width="2"
        />
        <circle cx="170" cy="170" r="14" fill="var(--fg-primary)" />
        <text
          x="170"
          y="202"
          text-anchor="middle"
          fill="var(--fg-muted)"
          font-family="var(--font-mono)"
          font-size="9"
          font-weight="700"
        >
          EIXO / ARBOR
        </text>

        <!-- Rótulo direto da camada ativa -->
        <text
          x="170"
          y="18"
          text-anchor="middle"
          fill="var(--accent-salvage)"
          font-family="var(--font-mono)"
          font-size="11"
          font-weight="700"
        >
          [{activeLayer.order}] {activeLayer.name.toUpperCase()}
        </text>
      </svg>
    </div>

    <div class="border-t-2 border-line-strong pt-4">
      <span class="block font-mono text-xs font-semibold uppercase tracking-wider text-salvage">
        Camada {activeLayer.order} · {activeLayer.name}
      </span>
      <p class="font-mono text-xs font-semibold text-ocean mt-2 mb-3">
        {activeLayer.spec}
      </p>
      <p class="text-sm leading-relaxed text-ink m-0 max-w-[54ch]">
        {activeLayer.justification}
      </p>
    </div>
  </div>
</section>
