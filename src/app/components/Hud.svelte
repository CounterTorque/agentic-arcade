<script lang="ts">
  let {
    title,
    lives,
    maxLives = 4,
    score,
    speed,
    timer = null,
  }: { title?: string; lives?: number; maxLives?: number; score?: number; speed?: number; timer?: number | null } = $props();
  const slots = $derived(Array.from({ length: maxLives }, (_, i) => i));
</script>

<div class="hud" data-testid="hud">
  <div class="left">
    {#if title}<strong>{title}</strong>{/if}
    {#if lives !== undefined}
      <span class="hearts" aria-label="{lives} lives">
        {#each slots as i (i)}<span class:lost={i >= lives}>&#9829;</span>{/each}
      </span>
    {/if}
  </div>
  <div class="bar" role="progressbar" aria-label="time left" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round((timer ?? 0) * 100)}>
    <div class="fill" data-testid="timer" style:width="{Math.max(0, Math.min(1, timer ?? 0)) * 100}%"></div>
  </div>
  <div class="right">
    {#if score !== undefined}<span>Score <strong data-testid="hud-score">{score}</strong></span>{/if}
    {#if speed !== undefined}<span>Speed <strong>&times;{speed}</strong></span>{/if}
  </div>
</div>

<style>
  .hud {
    display: grid;
    grid-template-columns: 1fr minmax(120px, 40%) 1fr;
    align-items: center;
    gap: 1rem;
    padding: 0.35rem 1rem;
    background: #0f1220;
    border-bottom: 1px solid #23283d;
    font-size: 0.95rem;
  }

  .left,
  .right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .right {
    justify-content: flex-end;
  }

  .hearts {
    color: #ff4d6d;
    letter-spacing: 0.15em;
  }

  .lost {
    color: #3a3f58;
  }

  .bar {
    height: 12px;
    border-radius: 6px;
    background: #1b2036;
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: linear-gradient(90deg, #ffd166, #ff9f1c);
  }
</style>
