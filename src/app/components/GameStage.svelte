<script lang="ts">
  import type { Snippet } from 'svelte';
  import { STAGE_HEIGHT, STAGE_WIDTH } from '@arcade/sdk';

  let { children }: { children?: Snippet } = $props();

  let areaWidth = $state(0);
  let areaHeight = $state(0);
  let areaEl: HTMLDivElement | undefined = $state();
  let rootEl: HTMLDivElement | undefined = $state();

  const scale = $derived(Math.max(0.1, Math.floor(Math.min(areaWidth / STAGE_WIDTH, areaHeight / STAGE_HEIGHT) * 1000) / 1000));

  $effect(() => {
    if (!areaEl) return;
    const el = areaEl;
    const measure = () => {
      const r = el.getBoundingClientRect();
      areaWidth = r.width;
      areaHeight = r.height;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  });

  export function getRoot(): HTMLDivElement {
    return rootEl!;
  }

  export function getScale(): number {
    return scale;
  }
</script>

<div class="area" bind:this={areaEl}>
  <div class="frame" style:width="{STAGE_WIDTH * scale}px" style:height="{STAGE_HEIGHT * scale}px" data-testid="stage">
    <div class="root" bind:this={rootEl} style:transform="scale({scale})"></div>
    <div class="overlay" style:transform="scale({scale})">
      {@render children?.()}
    </div>
  </div>
</div>

<style>
  .area {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #05060a;
  }

  .frame {
    position: relative;
    flex: none;
    background: #000;
    box-shadow: 0 0 0 2px #2a2f45;
  }

  .root,
  .overlay {
    position: absolute;
    left: 0;
    top: 0;
    width: 960px;
    height: 720px;
    transform-origin: 0 0;
  }

  .root {
    overflow: hidden;
    contain: strict;
  }

  .overlay {
    pointer-events: none;
  }
</style>
