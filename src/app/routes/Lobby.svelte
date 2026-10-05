<script lang="ts">
  import { onMount } from 'svelte';
  import { registry } from '../../framework/registry';
  import { save } from '../save';

  type Motion = 'system' | 'on' | 'off';

  const playable = registry.entries.filter((e) => e.manifest.enabled !== false).length;
  const options: { value: Motion; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'on', label: 'On' },
    { value: 'off', label: 'Off' },
  ];

  let play: HTMLAnchorElement | undefined = $state();
  let motion = $state<Motion>(save.data.settings.reducedMotion);
  const best = save.data.highScore;

  onMount(() => play?.focus());

  function setMotion(value: Motion) {
    motion = value;
    save.update((d) => void (d.settings.reducedMotion = value));
  }
</script>

<section class="page lobby">
  <h1 class="title">Agentic Arcade</h1>
  <p class="muted tagline">Tiny games. Big speed. Four lives.</p>

  <div class="stats">
    <div><span class="muted">Best score</span><strong data-testid="best-score">{best}</strong></div>
    <div><span class="muted">Games</span><strong data-testid="game-count">{playable}</strong></div>
  </div>

  <div class="row">
    <a class="btn primary" href="#/session" bind:this={play} data-testid="play">Play</a>
    <a class="btn" href="#/gallery">Gallery</a>
  </div>

  <fieldset class="settings">
    <legend>Reduce motion</legend>
    {#each options as o (o.value)}
      <label class:active={motion === o.value}>
        <input type="radio" name="motion" value={o.value} checked={motion === o.value} onchange={() => setMotion(o.value)} />
        {o.label}
      </label>
    {/each}
  </fieldset>
  {#if !save.persistent}<p class="muted small">Progress can't be saved in this browser session.</p>{/if}
</section>

<style>
  .lobby {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding-top: 6vh;
  }

  .title {
    margin: 0;
    font-size: clamp(2.5rem, 8vw, 5rem);
    line-height: 1.15;
    padding-bottom: 0.08em;
    background: linear-gradient(90deg, #ffd166, #ff6b9d);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .tagline {
    margin: 0;
  }

  .stats {
    display: flex;
    gap: 3rem;
  }

  .stats div {
    display: flex;
    flex-direction: column;
  }

  .stats strong {
    font-size: 2.5rem;
  }

  .settings {
    border: 1px solid #2a2f45;
    border-radius: 10px;
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem 1rem 0.75rem;
  }

  .settings legend {
    color: #9aa3c0;
    padding: 0 0.5rem;
  }

  label {
    padding: 0.35rem 0.9rem;
    border-radius: 999px;
    border: 1px solid #2a2f45;
    cursor: pointer;
  }

  label.active {
    background: #2a3150;
    border-color: #6c7bd1;
  }

  label:has(input:focus-visible) {
    outline: 3px solid #7cf;
    outline-offset: 2px;
  }

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
</style>
