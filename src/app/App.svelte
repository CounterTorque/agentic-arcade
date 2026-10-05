<script lang="ts">
  import { router } from './router.svelte';
  import Gallery from './routes/Gallery.svelte';
  import Lobby from './routes/Lobby.svelte';
  import Practice from './routes/Practice.svelte';
  import Session from './routes/Session.svelte';

  const route = $derived(router.route);
</script>

<div class="shell">
  <header>
    <a class="brand" href="#/">Agentic Arcade</a>
    <nav>
      <a href="#/session">Play</a>
      <a href="#/gallery">Gallery</a>
    </nav>
  </header>
  <main>
    {#key route.key}
      {#if route.name === 'session'}
        <Session query={route.query} />
      {:else if route.name === 'practice'}
        <Practice id={route.id!} query={route.query} />
      {:else if route.name === 'gallery'}
        <Gallery />
      {:else}
        <Lobby />
      {/if}
    {/key}
  </main>
</div>

<style>
  .shell {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.35rem 1rem;
    background: #0b0d14;
    border-bottom: 1px solid #1c2033;
  }

  .brand {
    font-weight: 900;
    letter-spacing: 0.04em;
    color: #ffd166;
    text-decoration: none;
  }

  nav {
    display: flex;
    gap: 1rem;
  }

  nav a {
    color: #c7cde6;
    text-decoration: none;
  }

  nav a:hover {
    color: #fff;
  }

  main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }
</style>
