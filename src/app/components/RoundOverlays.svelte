<script lang="ts">
  let { intro = null, paused = false }: { intro?: string | null; paused?: boolean } = $props();
</script>

{#if intro}
  <div class="verb" data-testid="intro"><span>{intro}</span></div>
{/if}
{#if paused}
  <div class="paused" data-testid="paused" role="status">
    <strong>PAUSED</strong>
    <span>Press Esc to resume</span>
  </div>
{/if}

<style>
  .verb,
  .paused {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .verb span {
    font: 900 140px/1 system-ui, sans-serif;
    color: #ffd166;
    letter-spacing: 0.04em;
    text-shadow: 0 6px 0 #7a4b00, 0 0 40px rgba(255, 209, 102, 0.5);
    animation: pop 0.25s ease-out;
  }

  .paused {
    background: rgba(5, 6, 10, 0.78);
    color: #fff;
  }

  .paused strong {
    font: 900 96px/1 system-ui, sans-serif;
    letter-spacing: 0.08em;
  }

  .paused span {
    font-size: 28px;
    color: #aab;
  }

  @keyframes pop {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .verb span {
      animation: none;
    }
  }
</style>
