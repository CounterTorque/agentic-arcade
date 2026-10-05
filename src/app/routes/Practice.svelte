<script lang="ts">
  import { onMount } from 'svelte';
  import type { RoundResult } from '@arcade/sdk';
  import { registry } from '../../framework/registry';
  import GameStage from '../components/GameStage.svelte';
  import Hud from '../components/Hud.svelte';
  import RoundOverlays from '../components/RoundOverlays.svelte';
  import { playRound } from '../play-round';
  import { numParam } from '../router.svelte';
  import { countRound, save } from '../save';
  import { errorMessage, focusOnMount } from '../util';

  let { id, query }: { id: string; query: URLSearchParams } = $props();

  const entry = $derived(registry.entries.find((e) => e.id === id));
  const seed = $derived(Math.floor(numParam(query, 'seed', 1, 0, 4294967295)));
  const speed = $derived(numParam(query, 'speed', 1, 1, 2.5));
  const level = $derived(Math.round(numParam(query, 'level', 1, 1, 3)) as 1 | 2 | 3);

  let stage: GameStage | undefined = $state();
  let intro = $state<string | null>(null);
  let paused = $state(false);
  let timer = $state(1);
  let result = $state<RoundResult | null>(null);

  const againHref = $derived(`#/play/${encodeURIComponent(id)}?seed=${seed + 1}&speed=${speed}&level=${level}`);

  onMount(() => {
    if (!entry) return;
    const ac = new AbortController();
    void (async () => {
      const r = await playRound({
        entry,
        difficulty: { speed, level, round: 0 },
        seed,
        signal: ac.signal,
        ui: {
          stage: { getRoot: () => stage!.getRoot(), getScale: () => stage!.getScale() },
          setIntro: (v) => (intro = v),
          setPaused: (p) => (paused = p),
          setTimer: (t) => (timer = t),
        },
      });
      if (!r) return;
      save.update((d) => countRound(d, r));
      result = r;
    })();
    return () => ac.abort();
  });
</script>

{#if !entry}
  <section class="page narrow">
    <h1>Game not found</h1>
    <p class="muted">There is no game with the id <code>{id}</code>.</p>
    <a class="btn primary" href="#/gallery" use:focusOnMount>Back to gallery</a>
  </section>
{:else}
  <div class="play">
    <Hud title={entry.manifest.title} speed={speed} timer={result ? 0 : timer} />
    <GameStage bind:this={stage}>
      <RoundOverlays {intro} {paused} />
      {#if result}
        <div class="cover dim">
          <div class="card" data-testid="result">
            <div class="big {result.kind}" data-testid="result-kind">
              {result.kind === 'win' ? 'WIN!' : result.kind === 'lose' ? 'LOSE' : 'GLITCH!'}
            </div>
            {#if result.kind === 'error'}
              <p class="muted small" data-testid="result-detail">
                {errorMessage(result.error)} (during {result.phase})
              </p>
            {/if}
            <div class="row">
              <a class="btn primary" href={againHref} use:focusOnMount>Again</a>
              <a class="btn" href="#/gallery">Back to gallery</a>
            </div>
          </div>
        </div>
      {/if}
    </GameStage>
  </div>
{/if}
