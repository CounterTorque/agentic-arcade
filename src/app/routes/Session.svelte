<script lang="ts">
  import { onMount } from 'svelte';
  import type { RoundResult } from '@arcade/sdk';
  import { registry } from '../../framework/registry';
  import { Session } from '../../framework/runtime/session';
  import GameStage from '../components/GameStage.svelte';
  import Hud from '../components/Hud.svelte';
  import RoundOverlays from '../components/RoundOverlays.svelte';
  import { playRound } from '../play-round';
  import { numParam } from '../router.svelte';
  import { countRound, save } from '../save';
  import { focusOnMount, isAbort, randomSeed, sleep } from '../util';

  const INTERMISSION_MS = 1200;
  const FLASH_MS = 600;

  let { query }: { query: URLSearchParams } = $props();

  type Phase = 'intermission' | 'round' | 'flash' | 'over' | 'empty';

  let stage: GameStage | undefined = $state();
  let phase = $state<Phase>('intermission');
  let intro = $state<string | null>(null);
  let paused = $state(false);
  let timer = $state(1);
  let lives = $state(4);
  let score = $state(0);
  let speed = $state(1);
  let speedUp = $state(false);
  let upNext = $state<{ title: string; verb: string } | null>(null);
  let flash = $state<RoundResult['kind']>('win');
  let best = $state(0);
  let newRecord = $state(false);
  let controller: AbortController | undefined;

  const ui = {
    stage: { getRoot: () => stage!.getRoot(), getScale: () => stage!.getScale() },
    setIntro: (v: string | null) => (intro = v),
    setPaused: (p: boolean) => (paused = p),
    setTimer: (t: number) => (timer = t),
  };

  async function start(seed: number) {
    controller?.abort();
    const ac = (controller = new AbortController());
    const session = new Session({ entries: registry.entries, seed });
    const results: RoundResult[] = [];
    lives = session.lives;
    score = 0;
    speed = 1;
    speedUp = false;
    newRecord = false;
    if (session.over) {
      phase = 'empty';
      return;
    }
    try {
      let previousSpeed: number | null = null;
      while (!session.over) {
        const next = session.next();
        speedUp = previousSpeed !== null && next.difficulty.speed > previousSpeed;
        previousSpeed = speed = next.difficulty.speed;
        upNext = { title: next.entry.manifest.title, verb: next.entry.manifest.verb };
        timer = 1;
        phase = 'intermission';
        next.entry.load().catch(() => {});
        await sleep(INTERMISSION_MS, ac.signal);

        phase = 'round';
        const result = await playRound({ entry: next.entry, difficulty: next.difficulty, seed: next.seed, signal: ac.signal, ui });
        if (!result) return;
        results.push(result);
        session.record(result);
        lives = session.lives;
        score = session.score;
        flash = result.kind;
        phase = 'flash';
        await sleep(FLASH_MS, ac.signal);
      }
      const previousBest = save.data.highScore;
      newRecord = session.score > previousBest;
      save.update((d) => {
        d.highScore = Math.max(d.highScore, session.score);
        d.sessionsPlayed++;
        for (const r of results) countRound(d, r);
      });
      best = save.data.highScore;
      phase = 'over';
    } catch (e) {
      if (!isAbort(e)) throw e;
    }
  }

  onMount(() => {
    void start(Math.floor(numParam(query, 'seed', randomSeed(), 0, 4294967295)));
    return () => controller?.abort();
  });
</script>

{#if phase === 'empty'}
  <section class="page narrow">
    <h1>No games yet</h1>
    <p class="muted">There are no playable games available. Add one under <code>src/games/</code>.</p>
    <a class="btn primary" href="#/" use:focusOnMount>Lobby</a>
  </section>
{:else}
  <div class="play">
    <Hud {lives} {score} {speed} timer={phase === 'round' ? timer : 0} />
    <GameStage bind:this={stage}>
      <RoundOverlays {intro} {paused} />
      {#if phase === 'intermission' && upNext}
        <div class="cover" data-testid="intermission">
          <div class="card">
            <div class="hearts big" aria-label="{lives} lives">
              {#each Array.from({ length: 4 }, (_, i) => i) as i (i)}<span class:lost={i >= lives}>&#9829;</span>{/each}
            </div>
            <p class="score">Score <strong>{score}</strong></p>
            {#if speedUp}<p class="speedup" data-testid="speedup">SPEED UP! &times;{speed}</p>{/if}
            <p class="muted">Next up</p>
            <h2>{upNext.title}</h2>
            <div class="verbline">{upNext.verb}</div>
          </div>
        </div>
      {:else if phase === 'flash'}
        <div class="cover dim">
          <div class="big {flash}" data-testid="flash">{flash === 'win' ? 'WIN!' : flash === 'lose' ? 'LOSE' : 'GLITCH!'}</div>
        </div>
      {:else if phase === 'over'}
        <div class="cover dim">
          <div class="card" data-testid="gameover">
            <div class="big lose">GAME OVER</div>
            <p class="score">Score <strong data-testid="final-score">{score}</strong></p>
            <p class="muted">Best <strong data-testid="final-best">{best}</strong></p>
            {#if newRecord}<p class="speedup" data-testid="new-record">NEW RECORD!</p>{/if}
            <div class="row">
              <button class="btn primary" type="button" use:focusOnMount onclick={() => start(randomSeed())}>Play again</button>
              <a class="btn" href="#/">Lobby</a>
            </div>
          </div>
        </div>
      {/if}
    </GameStage>
  </div>
{/if}

<style>
  .hearts span {
    color: #ff4d6d;
  }

  .hearts .lost {
    color: #3a3f58;
  }

  h2 {
    margin: 0;
    font-size: 56px;
  }

  .verbline {
    font: 900 72px/1.1 system-ui, sans-serif;
    color: #ffd166;
  }

  .score {
    font-size: 32px;
    margin: 0;
  }

  .speedup {
    font: 900 40px/1 system-ui, sans-serif;
    color: #7bf1a8;
    margin: 4px 0;
  }
</style>
