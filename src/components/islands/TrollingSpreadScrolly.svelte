<script lang="ts">
  import type scrollama from 'scrollama';

  interface SpreadStep {
    id: string;
    phase: 'SPREAD' | 'BAIT-AND-SWITCH';
    tag: string;
    title: string;
    range: string;
    summary: string;
    warning?: string;
    focusKey: string;
  }

  interface OcclusionTarget {
    key: string;
    badge: string;
    category: 'SPREAD' | 'AVE';
    name: string;
    detail: string;
    x: number;
    y: number;
  }

  const STEPS: SpreadStep[] = [
    {
      id: 'short-corner',
      phase: 'SPREAD',
      tag: '01 · SPREAD DE POPA',
      title: 'Short Corner (2ª–3ª onda)',
      range: '~8–15 m',
      summary:
        'Linha curta descendo direto da popa para a turbulência da 2ª ou 3ª onda. Exige isca com cabeça chanfrada pesada para segurar fundo dentro da espuma branca, onde predadores usam a cortina de bolhas para emboscar.',
      focusKey: 'sc',
    },
    {
      id: 'long-corner',
      phase: 'SPREAD',
      tag: '02 · SPREAD DE POPA',
      title: 'Long Corner (4ª–5ª onda)',
      range: '~15–25 m',
      summary:
        'Trabalha na borda oposta da popa, apoiada na face limpa da 4ª ou 5ª onda. Cria simetria de pressão acústica e garante ângulo seguro para o barco fechar curvas sem cruzar as linhas internas.',
      focusKey: 'lc',
    },
    {
      id: 'short-rigger',
      phase: 'SPREAD',
      tag: '03 · LIMITE DA ÁGUA LIMPA',
      title: 'Short Rigger (Fronteira)',
      range: '~20–35 m',
      summary:
        'Suspensa pelo clipe interno do outrigger, corre exatamente no degrau entre a espuma da esteira e a água azul limpa. É a posição de maior taxa de ataque para marlins e dourados que caçam pela borda visual.',
      focusKey: 'sr',
    },
    {
      id: 'long-rigger',
      phase: 'SPREAD',
      tag: '04 · ÁGUA LIMPA EXTERNA',
      title: 'Long Rigger (Externo)',
      range: '~35–50 m',
      summary:
        'Linha elevada pelo clipe externo do outrigger, totalmente fora da esteira branca em água limpa. O ângulo alto reduz o arrasto de linha submersa e faz o skirt saltar limpo de crista em crista.',
      focusKey: 'lr',
    },
    {
      id: 'shotgun',
      phase: 'SPREAD',
      tag: '05 · RETAGUARDA LONGA',
      title: 'Shotgun (Centro / Flybridge)',
      range: '~150–250 pés (45–76 m)',
      summary:
        'Solta do ponto mais alto do barco bem atrás de todo o conjunto. Intercepta atuns, wahoos e marlins ariscos que seguem a esteira a distância antes de entrar no ruído dos motores.',
      focusKey: 'sg',
    },
    {
      id: 'bas-acende',
      phase: 'BAIT-AND-SWITCH',
      tag: 'ETAPA (A) · REAÇÃO',
      title: 'Marlin Azul Acende no Teaser',
      range: 'Sem anzol no teaser',
      summary:
        'Um marlin azul ilumina as faixas laterais em azul-cobalto neon e ataca a cadeia de lulas ou dredge sem anzol. O marinheiro recolhe o teaser em ritmo firme para puxar o peixe até o espelho de popa sem deixá-lo morder.',
      focusKey: 'bas-a',
    },
    {
      id: 'bas-curva',
      phase: 'BAIT-AND-SWITCH',
      tag: 'ETAPA (B) · MANOBRA',
      title: 'Curva Suave Abre Água Limpa',
      range: 'Corredor de apresentação',
      summary:
        'O comandante inicia uma curva suave e constante. A esteira de espuma desliza para fora, abrindo uma janela de água azul limpa diretamente na frente do bico do marlin para eliminar confusão visual.',
      focusKey: 'bas-b',
    },
    {
      id: 'bas-pitch',
      phase: 'BAIT-AND-SWITCH',
      tag: 'ETAPA (C) · ARREMESSO',
      title: 'Lançamento do Pitch Bait (Circle Hook)',
      range: 'Isca natural armada',
      summary:
        'No segundo em que o teaser é arrancado da água, o pescador lança o ballyhoo natural armado com circle hook exatamente na frente do marlin, alinhado no corredor limpo recém-aberto.',
      focusKey: 'bas-c',
    },
    {
      id: 'bas-dropback',
      phase: 'BAIT-AND-SWITCH',
      tag: 'ETAPA (D) · FREESPOOL',
      title: 'Drop-Back em Freespool & O Sancocho',
      range: 'Alavanca livre até virar',
      summary:
        'Assim que a isca toca a água, abra para freespool com o polegar apenas contendo a cabeleira — a isca morre e afunda na cara do peixe. Conte em silêncio enquanto a linha corre e só empurre suavemente para Strike quando o marlin virar de lado.',
      warning:
        'SANCOCHO: Se você tensionar no reflexo antes de o marlin engolir e virar, o anzol arranca o corpo da isca e volta só a cabeça do ballyhoo na sua mão. Nunca dê fisgada com circle hook.',
      focusKey: 'bas-d',
    },
  ];

  const OCCLUSION_TARGETS: OcclusionTarget[] = [
    {
      key: 'sc',
      badge: '?1',
      category: 'SPREAD',
      name: 'Short Corner',
      detail: '2ª–3ª onda (~8–15 m), espuma pesada da popa.',
      x: 205,
      y: 196,
    },
    {
      key: 'lc',
      badge: '?2',
      category: 'SPREAD',
      name: 'Long Corner',
      detail: '4ª–5ª onda (~15–25 m), borda oposta da esteira.',
      x: 315,
      y: 266,
    },
    {
      key: 'sr',
      badge: '?3',
      category: 'SPREAD',
      name: 'Short Rigger',
      detail: '~20–35 m, exatamente no limite espuma / água limpa.',
      x: 118,
      y: 304,
    },
    {
      key: 'lr',
      badge: '?4',
      category: 'SPREAD',
      name: 'Long Rigger',
      detail: '~35–50 m, fora da esteira em água azul limpa.',
      x: 422,
      y: 344,
    },
    {
      key: 'sg',
      badge: '?5',
      category: 'SPREAD',
      name: 'Shotgun',
      detail: '~150–250 pés (45–76 m), centro longo do flybridge.',
      x: 270,
      y: 416,
    },
    {
      key: 'bird-trinta',
      badge: 'A1',
      category: 'AVE',
      name: 'Trinta-réis',
      detail: 'Mergulho raso (~1 m); denuncia cardume miúdo na flor da água.',
      x: 92,
      y: 170,
    },
    {
      key: 'bird-atoba',
      badge: 'A2',
      category: 'AVE',
      name: 'Atobá',
      detail: 'Mergulho fundo em picada (até 20 m); isca empurrada de baixo.',
      x: 452,
      y: 215,
    },
    {
      key: 'bird-fragata',
      badge: 'A3',
      category: 'AVE',
      name: 'Fragata',
      detail: 'Voo alto ou rasante (sem óleo nas penas); segue dourados e bicos.',
      x: 438,
      y: 96,
    },
  ];

  let activeStep = $state(0);
  let occlusionMode = $state(false);
  let revealedItems = $state<Record<string, boolean>>({});
  let containerEl: HTMLElement | undefined = $state();

  const currentStep = $derived(STEPS[activeStep] ?? STEPS[0]);
  const isBaitAndSwitch = $derived(activeStep >= 5);
  const revealedCount = $derived(
    OCCLUSION_TARGETS.filter((item) => revealedItems[item.key]).length
  );

  // Ângulo da curva do barco na Etapa (b) em diante
  const boatTurnDeg = $derived(activeStep >= 6 ? -14 : 0);
  const wakeShiftX = $derived(activeStep >= 6 ? -24 : 0);

  function isTargetVisible(key: string): boolean {
    if (!occlusionMode) return true;
    return Boolean(revealedItems[key]);
  }

  function toggleReveal(key: string) {
    revealedItems = {
      ...revealedItems,
      [key]: !revealedItems[key],
    };
  }

  function revealAll() {
    const next: Record<string, boolean> = {};
    for (const item of OCCLUSION_TARGETS) {
      next[item.key] = true;
    }
    revealedItems = next;
  }

  function resetOcclusion() {
    revealedItems = {};
  }

  function toggleOcclusionMode() {
    occlusionMode = !occlusionMode;
    if (occlusionMode) {
      revealedItems = {};
    }
  }

  function selectStep(index: number) {
    activeStep = Math.max(0, Math.min(STEPS.length - 1, index));
  }

  $effect(() => {
    if (!containerEl || typeof window === 'undefined') return;

    let disposed = false;
    let scroller: scrollama.ScrollamaInstance | null = null;

    const setupScrollama = async () => {
      const mod = await import('scrollama');
      if (disposed || !containerEl) return;

      const createScrollama = (
        typeof mod === 'function'
          ? mod
          : (mod as unknown as { default?: typeof scrollama }).default
      ) as typeof scrollama;

      const stepNodes = Array.from(
        containerEl.querySelectorAll<HTMLElement>('.scrolly-step')
      );
      if (stepNodes.length === 0) return;

      scroller = createScrollama();
      scroller
        .setup({
          step: stepNodes,
          offset: 0.5,
          progress: false,
        })
        .onStepEnter((response) => {
          activeStep = response.index;
        });
    };

    void setupScrollama();

    const onResize = () => {
      scroller?.resize();
    };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      scroller?.destroy();
    };
  });
</script>

<section
  id="corrico-scrolly"
  data-study-only
  aria-labelledby="corrico-scrolly-title"
  class="tufte-full-bleed border border-line-strong bg-elevated p-4 sm:p-6"
  bind:this={containerEl}
>
  <header class="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4 mb-5">
    <div>
      <p class="font-mono text-[11px] font-bold uppercase tracking-widest text-salvage m-0">
        TÁTICA OCEÂNICA · SCROLLYTELLING INTERATIVO
      </p>
      <h2
        id="corrico-scrolly-title"
        class="font-sans text-xl sm:text-2xl font-bold tracking-tight text-ink mt-1 mb-0"
      >
        Geometria do Spread &amp; Coreografia de Bait-and-Switch
      </h2>
      <p class="font-sans text-xs sm:text-sm text-ink-secondary mt-1 mb-0">
        Role as etapas para mover o padrão de esteira, ou ative o Modo Oclusão para testar o reconhecimento de linhas e aves marinhas.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onclick={toggleOcclusionMode}
        aria-pressed={occlusionMode}
        class="px-3 py-1.5 border font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors {occlusionMode
          ? 'border-salvage bg-salvage text-elevated'
          : 'border-line-strong bg-surface text-ink hover:border-salvage'}"
      >
        {occlusionMode ? 'Mostrar Rótulos' : 'Modo Oclusão (Desafio)'}
      </button>
    </div>
  </header>

  <div class="scrolly-grid">
    <!-- PAINEL GRÁFICO STICKY (Top 45svh mobile | Lado esquerdo 85svh desktop) -->
    <div class="scrolly-sticky-panel border border-line bg-surface p-3 flex flex-col gap-2.5">
      <!-- Barra de Legenda e Navegação Rápida (acima do SVG conforme especificado) -->
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
        <div class="flex flex-wrap items-center gap-3 font-mono text-[11px] tabular-telemetry">
          <span class="inline-flex items-center gap-1.5 font-bold text-ink">
            <span class="inline-block w-2.5 h-2.5 bg-ocean"></span>
            {currentStep.phase} · {activeStep + 1}/{STEPS.length}
          </span>
          <span class="text-salvage font-bold">{currentStep.range}</span>
          {#if occlusionMode}
            <span class="px-1.5 py-0.5 bg-salvage-soft text-salvage font-bold">
              OCLUSÃO: {revealedCount}/8
            </span>
          {/if}
        </div>

        <div class="flex items-center gap-1.5">
          <button
            type="button"
            onclick={() => selectStep(activeStep - 1)}
            disabled={activeStep === 0}
            class="px-2 py-1 border border-line-strong bg-elevated font-mono text-[11px] font-bold text-ink cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Etapa anterior"
          >
            ← Ant
          </button>
          <button
            type="button"
            onclick={() => selectStep(activeStep + 1)}
            disabled={activeStep === STEPS.length - 1}
            class="px-2 py-1 border border-line-strong bg-elevated font-mono text-[11px] font-bold text-ink cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Próxima etapa"
          >
            Próx →
          </button>
        </div>
      </div>

      <!-- Legenda de aves (visível no topo quando não está ocluída) -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-ink-secondary">
        <span>
          <strong class="text-ocean">A1 Trinta-réis:</strong> {occlusionMode && !revealedItems['bird-trinta'] ? '??? (raso)' : 'mergulho raso ~1 m'}
        </span>
        <span>
          <strong class="text-ocean">A2 Atobá:</strong> {occlusionMode && !revealedItems['bird-atoba'] ? '??? (fundo)' : 'picada até 20 m'}
        </span>
        <span>
          <strong class="text-salvage">A3 Fragata:</strong> {occlusionMode && !revealedItems['bird-fragata'] ? '??? (alto)' : 'voo alto / dourados'}
        </span>
      </div>

      <!-- SVG Top-Down do Barco, Esteira (5 ondas) e Coreografia -->
      <div class="scrolly-svg-frame w-full overflow-x-clip border border-line bg-canvas">
        <svg
          viewBox="0 0 540 460"
          class="w-full h-auto block scrolly-svg"
          role="img"
          aria-label="Diagrama superior do spread de corrico oceânico, esteira de 5 ondas, aves indicadoras e coreografia bait-and-switch"
        >
          <defs>
            <linearGradient id="clean-water-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--accent-ocean-soft)" stop-opacity="0.65" />
              <stop offset="100%" stop-color="var(--accent-ocean)" stop-opacity="0.18" />
            </linearGradient>
            <linearGradient id="wake-foam-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--bg-elevated)" stop-opacity="0.92" />
              <stop offset="65%" stop-color="var(--bg-surface)" stop-opacity="0.58" />
              <stop offset="100%" stop-color="var(--accent-ocean-soft)" stop-opacity="0.15" />
            </linearGradient>
          </defs>

          <!-- Fundo Oceânico (Água Limpa) -->
          <rect x="0" y="0" width="540" height="460" fill="url(#clean-water-grad)" />

          <!-- Rótulos das zonas de água -->
          <text
            x="16"
            y="24"
            font-family="var(--font-mono)"
            font-size="9.5"
            font-weight="700"
            fill="var(--accent-ocean)"
          >
            ÁGUA AZUL LIMPA (FORA DA ESTEIRA)
          </text>
          <text
            x="524"
            y="24"
            text-anchor="end"
            font-family="var(--font-mono)"
            font-size="9.5"
            fill="var(--fg-muted)"
          >
            {isBaitAndSwitch ? 'MODO: BAIT-AND-SWITCH' : 'VELOCIDADE: 7–8 NÓS'}
          </text>

          <!-- Cone da Esteira de Espuma (desloca-se na curva da Etapa B) -->
          <g
            class="wake-group"
            style="transform: translateX({wakeShiftX}px); transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);"
          >
            <path
              d="M 244,122 L 136,445 L 404,445 L 296,122 Z"
              fill="url(#wake-foam-grad)"
              stroke="var(--border-strong)"
              stroke-width="1"
              stroke-dasharray="4 4"
              stroke-opacity="0.45"
            />

            <!-- 5 Ondas da Esteira atrás da popa -->
            {#each [1, 2, 3, 4, 5] as wave}
              {@const wy = 138 + wave * 36}
              {@const halfW = 34 + wave * 17}
              <path
                d="M {270 - halfW},{wy} Q 270,{wy + 12} {270 + halfW},{wy}"
                fill="none"
                stroke="var(--fg-muted)"
                stroke-width="1.25"
                stroke-opacity="0.45"
              />
              <text
                x="270"
                y={wy + 3}
                text-anchor="middle"
                font-family="var(--font-mono)"
                font-size="8.5"
                font-weight="700"
                fill="var(--fg-muted)"
              >
                {wave}ª ONDA
              </text>
            {/each}

            {#if activeStep >= 6}
              <!-- Corredor de Água Limpa aberto pela curva (Etapa B/C/D) -->
              <rect
                x="286"
                y="148"
                width="106"
                height="134"
                fill="var(--accent-ocean-soft)"
                fill-opacity="0.72"
                stroke="var(--accent-ocean)"
                stroke-width="1.5"
                stroke-dasharray="5 3"
              />
              <text
                x="339"
                y="165"
                text-anchor="middle"
                font-family="var(--font-mono)"
                font-size="9"
                font-weight="700"
                fill="var(--accent-ocean)"
              >
                CORREDOR LIMPO
              </text>
            {/if}
          </g>

          <!-- Barco Sportfishing (Vista Superior) + Outriggers -->
          <g
            style="transform-origin: 270px 84px; transform: rotate({boatTurnDeg}deg); transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);"
          >
            <!-- Outriggers Bombordo e Boreste -->
            <line x1="244" y1="68" x2="108" y2="122" stroke="var(--fg-primary)" stroke-width="2.2" />
            <line x1="296" y1="68" x2="432" y2="122" stroke="var(--fg-primary)" stroke-width="2.2" />
            <!-- Casco -->
            <path
              d="M 270,28 C 292,48 298,86 296,122 L 244,122 C 242,86 248,48 270,28 Z"
              fill="var(--bg-elevated)"
              stroke="var(--border-strong)"
              stroke-width="2"
            />
            <!-- Flybridge / Cabine -->
            <rect
              x="253"
              y="62"
              width="34"
              height="36"
              fill="var(--bg-surface)"
              stroke="var(--fg-secondary)"
              stroke-width="1.4"
            />
            <!-- Cockpit de Popa -->
            <rect
              x="251"
              y="101"
              width="38"
              height="18"
              fill="var(--bg-canvas)"
              stroke="var(--line)"
              stroke-width="1"
            />
            <text
              x="270"
              y="83"
              text-anchor="middle"
              font-family="var(--font-mono)"
              font-size="8"
              font-weight="700"
              fill="var(--fg-primary)"
            >
              FLY
            </text>
          </g>

          <!-- LINHAS DO SPREAD (5 posições) -->
          <!-- 1. Short Corner -->
          <g opacity={activeStep === 0 || !isBaitAndSwitch ? 1 : 0.32}>
            <line
              x1="252"
              y1="122"
              x2="205"
              y2="196"
              stroke={activeStep === 0 ? 'var(--accent-salvage)' : 'var(--fg-primary)'}
              stroke-width={activeStep === 0 ? 2.6 : 1.5}
            />
            <circle
              cx="205"
              cy="196"
              r={activeStep === 0 ? 6 : 4.5}
              fill={activeStep === 0 ? 'var(--accent-salvage)' : 'var(--fg-primary)'}
            />
          </g>

          <!-- 2. Long Corner -->
          <g opacity={activeStep === 1 || !isBaitAndSwitch ? 1 : 0.32}>
            <line
              x1="288"
              y1="122"
              x2="315"
              y2="266"
              stroke={activeStep === 1 ? 'var(--accent-salvage)' : 'var(--fg-primary)'}
              stroke-width={activeStep === 1 ? 2.6 : 1.5}
            />
            <circle
              cx="315"
              cy="266"
              r={activeStep === 1 ? 6 : 4.5}
              fill={activeStep === 1 ? 'var(--accent-salvage)' : 'var(--fg-primary)'}
            />
          </g>

          <!-- 3. Short Rigger -->
          <g opacity={activeStep === 2 || !isBaitAndSwitch ? 1 : 0.32}>
            <line
              x1="158"
              y1="102"
              x2="118"
              y2="304"
              stroke={activeStep === 2 ? 'var(--accent-salvage)' : 'var(--accent-ocean)'}
              stroke-width={activeStep === 2 ? 2.6 : 1.6}
            />
            <circle
              cx="118"
              cy="304"
              r={activeStep === 2 ? 6 : 4.5}
              fill={activeStep === 2 ? 'var(--accent-salvage)' : 'var(--accent-ocean)'}
            />
          </g>

          <!-- 4. Long Rigger -->
          <g opacity={activeStep === 3 || !isBaitAndSwitch ? 1 : 0.32}>
            <line
              x1="432"
              y1="122"
              x2="422"
              y2="344"
              stroke={activeStep === 3 ? 'var(--accent-salvage)' : 'var(--accent-ocean)'}
              stroke-width={activeStep === 3 ? 2.6 : 1.6}
            />
            <circle
              cx="422"
              cy="344"
              r={activeStep === 3 ? 6 : 4.5}
              fill={activeStep === 3 ? 'var(--accent-salvage)' : 'var(--accent-ocean)'}
            />
          </g>

          <!-- 5. Shotgun -->
          <g opacity={activeStep === 4 || !isBaitAndSwitch ? 1 : 0.32}>
            <line
              x1="270"
              y1="98"
              x2="270"
              y2="416"
              stroke={activeStep === 4 ? 'var(--accent-salvage)' : 'var(--fg-secondary)'}
              stroke-width={activeStep === 4 ? 2.6 : 1.5}
              stroke-dasharray="5 3"
            />
            <circle
              cx="270"
              cy="416"
              r={activeStep === 4 ? 6 : 4.5}
              fill={activeStep === 4 ? 'var(--accent-salvage)' : 'var(--fg-secondary)'}
            />
          </g>

          <!-- COREOGRAFIA BAIT-AND-SWITCH (Passos 5..8) -->
          {#if isBaitAndSwitch}
            <!-- Teaser sem anzol (recolhido até sumir na etapa c) -->
            {#if activeStep <= 6}
              <g>
                <line
                  x1="286"
                  y1="122"
                  x2={activeStep === 5 ? 314 : 300}
                  y2={activeStep === 5 ? 210 : 162}
                  stroke="var(--accent-ocean)"
                  stroke-width="2"
                  stroke-dasharray="3 2"
                />
                <polygon
                  points={activeStep === 5
                    ? '314,202 308,218 320,218'
                    : '300,154 294,170 306,170'}
                  fill="var(--accent-ocean)"
                />
                <text
                  x={activeStep === 5 ? 324 : 310}
                  y={activeStep === 5 ? 214 : 165}
                  font-family="var(--font-mono)"
                  font-size="9"
                  font-weight="700"
                  fill="var(--accent-ocean)"
                >
                  TEASER (SEM ANZOL)
                </text>
              </g>
            {/if}

            <!-- Pitch Bait (Etapa c e Etapa d) -->
            {#if activeStep >= 7}
              <g>
                <line
                  x1="292"
                  y1="120"
                  x2="338"
                  y2={activeStep === 8 ? 228 : 196}
                  stroke="var(--accent-salvage)"
                  stroke-width="2.4"
                  stroke-dasharray={activeStep === 8 ? '2 3' : 'none'}
                />
                <circle
                  cx="338"
                  cy={activeStep === 8 ? 228 : 196}
                  r="6"
                  fill="var(--accent-salvage)"
                />
                <text
                  x="348"
                  y={activeStep === 8 ? 226 : 194}
                  font-family="var(--font-mono)"
                  font-size="9.5"
                  font-weight="700"
                  fill="var(--accent-salvage)"
                >
                  {activeStep === 8 ? 'DROP-BACK (FREESPOOL)' : 'PITCH BAIT (CIRCLE HOOK)'}
                </text>
              </g>
            {/if}

            <!-- Silhueta do Marlin Azul "Acendido" -->
            <g
              class="marlin-glow"
              style="transform: translate({activeStep === 5 ? 316 : 338}px, {activeStep === 8 ? 248 : 236}px) rotate({activeStep === 8 ? 28 : -16}deg); transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);"
            >
              <!-- Bico longo + corpo fusiforme + nadadeiras peitorais acesas -->
              <path
                d="M 0,-38 L 3,-12 L 22,-4 L 6,3 L 8,24 L 0,16 L -8,24 L -6,3 L -22,-4 L -3,-12 Z"
                fill="var(--accent-salvage)"
                fill-opacity="0.88"
                stroke="var(--accent-ocean)"
                stroke-width="2"
              />
              <text
                x="18"
                y="18"
                font-family="var(--font-mono)"
                font-size="9"
                font-weight="700"
                fill="var(--accent-salvage)"
              >
                {activeStep === 8 ? 'VIRANDO C/ ISCA' : 'MARLIN ACESO'}
              </text>
            </g>
          {/if}

          <!-- AVES MARINHAS NO ENTORNO -->
          <!-- A1: Trinta-réis (mergulho raso ~1 m) -->
          <g>
            <path
              d="M 78,170 Q 85,163 92,170 Q 99,163 106,170"
              fill="none"
              stroke="var(--accent-ocean)"
              stroke-width="2.2"
            />
            <path
              d="M 92,174 L 92,184"
              stroke="var(--accent-ocean)"
              stroke-width="1.3"
              stroke-dasharray="2 2"
            />
          </g>

          <!-- A2: Atobá (mergulho fundo até 20 m) -->
          <g>
            <path
              d="M 438,212 L 452,202 L 466,212 L 452,226 Z"
              fill="var(--accent-ocean-soft)"
              stroke="var(--accent-ocean)"
              stroke-width="1.8"
            />
            <line
              x1="452"
              y1="226"
              x2="452"
              y2="252"
              stroke="var(--accent-ocean)"
              stroke-width="1.6"
            />
            <polygon points="452,256 448,249 456,249" fill="var(--accent-ocean)" />
          </g>

          <!-- A3: Fragata (voo alto/rasante sobre dourados) -->
          <g>
            <path
              d="M 418,98 L 438,88 L 458,98 L 444,95 L 438,104 L 432,95 Z"
              fill="var(--accent-salvage-soft)"
              stroke="var(--accent-salvage)"
              stroke-width="1.8"
            />
          </g>

          <!-- RÓTULOS CLICÁVEIS OU OCULTOS (5 posições + 3 aves) -->
          {#each OCCLUSION_TARGETS as target}
            {@const visible = isTargetVisible(target.key)}
            {@const isFocused =
              currentStep.focusKey === target.key ||
              (target.category === 'AVE' && !occlusionMode)}
            <g
              class="cursor-pointer"
              role="button"
              tabindex="0"
              aria-label={visible ? `${target.name}: ${target.detail}` : `Revelar marcador ${target.badge}`}
              onclick={() => {
                if (occlusionMode) toggleReveal(target.key);
              }}
              onkeydown={(e) => {
                if (occlusionMode && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  toggleReveal(target.key);
                }
              }}
            >
              {#if visible}
                <rect
                  x={target.x - 48}
                  y={target.y + 9}
                  width="96"
                  height="17"
                  rx="2"
                  fill="var(--bg-elevated)"
                  fill-opacity="0.92"
                  stroke={isFocused ? 'var(--accent-salvage)' : 'var(--border-strong)'}
                  stroke-width={isFocused ? 1.4 : 0.9}
                />
                <text
                  x={target.x}
                  y={target.y + 20.5}
                  text-anchor="middle"
                  font-family="var(--font-mono)"
                  font-size="9"
                  font-weight="700"
                  fill={isFocused ? 'var(--accent-salvage)' : 'var(--fg-primary)'}
                >
                  {target.name}
                </text>
              {:else}
                <rect
                  x={target.x - 16}
                  y={target.y + 9}
                  width="32"
                  height="18"
                  rx="2"
                  fill="var(--accent-salvage)"
                />
                <text
                  x={target.x}
                  y={target.y + 21}
                  text-anchor="middle"
                  font-family="var(--font-mono)"
                  font-size="9.5"
                  font-weight="700"
                  fill="var(--bg-elevated)"
                >
                  {target.badge}
                </text>
              {/if}
            </g>
          {/each}
        </svg>
      </div>

      <!-- Bandeja de Autoavaliação do Modo Oclusão -->
      {#if occlusionMode}
        <div class="border border-salvage bg-salvage-soft p-2.5 flex flex-col gap-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="font-mono text-[11px] font-bold uppercase tracking-wider text-salvage m-0">
              DESAFIO DE MEMÓRIA · CLIQUE NO MAPA OU NOS BOTÕES PARA CONFERIR
            </p>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                onclick={revealAll}
                class="px-2 py-0.5 border border-salvage bg-elevated font-mono text-[10px] font-bold text-ink cursor-pointer"
              >
                Revelar Tudo
              </button>
              <button
                type="button"
                onclick={resetOcclusion}
                class="px-2 py-0.5 border border-line-strong bg-surface font-mono text-[10px] font-bold text-ink cursor-pointer"
              >
                Ocultar Tudo
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {#each OCCLUSION_TARGETS as target}
              {@const rev = Boolean(revealedItems[target.key])}
              <button
                type="button"
                onclick={() => toggleReveal(target.key)}
                class="text-left px-2 py-1.5 border font-mono text-[10px] cursor-pointer transition-colors {rev
                  ? 'border-ocean bg-elevated text-ink'
                  : 'border-line-strong bg-surface text-salvage hover:border-salvage'}"
              >
                <span class="font-bold">{target.badge}</span>
                {rev ? ` · ${target.name}` : ' · [oculto]'}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- COLUNA NARRATIVA DE PASSOS (Scrollama triggers, offset 0.5) -->
    <div class="flex flex-col gap-4">
      {#each STEPS as step, idx}
        {@const isActive = activeStep === idx}
        <article
          data-step-index={idx}
          class="scrolly-step border p-4 sm:p-5 transition-colors {isActive
            ? 'border-salvage bg-surface'
            : 'border-line bg-canvas opacity-80 hover:opacity-100'}"
        >
          <button
            type="button"
            onclick={() => selectStep(idx)}
            class="w-full text-left bg-transparent border-0 p-0 cursor-pointer"
          >
            <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span
                class="font-mono text-[11px] font-bold uppercase tracking-widest {isActive
                  ? 'text-salvage'
                  : 'text-ink-muted'}"
              >
                {step.tag}
              </span>
              <span class="font-mono text-[11px] font-semibold text-ocean tabular-telemetry">
                {step.range}
              </span>
            </div>

            <h3 class="font-sans text-lg font-bold tracking-tight text-ink mt-0 mb-2">
              {step.title}
            </h3>

            <p class="font-editorial text-sm sm:text-base leading-relaxed text-ink-secondary m-0">
              {step.summary}
            </p>
          </button>

          {#if step.warning}
            <div class="mt-3 border-l-3 border-salvage bg-salvage-soft p-3">
              <p class="font-mono text-[11px] font-bold text-salvage m-0 leading-snug">
                {step.warning}
              </p>
            </div>
          {/if}
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  .scrolly-grid {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .scrolly-sticky-panel {
    position: sticky;
    top: 3.5rem;
    z-index: 20;
    max-height: 45svh;
    overflow-y: auto;
  }

  .scrolly-svg {
    max-height: 29svh;
  }

  .scrolly-step {
    min-height: 36svh;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  @media (min-width: 768px) {
    .scrolly-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.18fr) minmax(0, 0.82fr);
      align-items: start;
      gap: 1.5rem;
    }

    .scrolly-sticky-panel {
      top: 2rem;
      max-height: 85svh;
      overflow-y: auto;
    }

    .scrolly-svg {
      max-height: 60svh;
    }

    .scrolly-step {
      min-height: 48svh;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .wake-group,
    .marlin-glow {
      transition: none !important;
    }
  }
</style>
