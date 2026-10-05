<script lang="ts">
  import { registry } from '../../framework/registry';
  import { save } from '../save';

  const stats = save.data.perGame;
</script>

<section class="page">
  <h1>Gallery</h1>
  {#if registry.entries.length === 0}
    <p class="muted">No games yet.</p>
  {/if}
  <ul class="grid">
    {#each registry.entries as e (e.id)}
      {@const m = e.manifest}
      {@const s = stats[e.id]}
      <li>
        <a class="gcard" href="#/play/{e.id}" data-testid="game-card" data-id={e.id}>
          <div class="head">
            <h2>{m.title}</h2>
            {#if m.enabled === false}<span class="badge">WIP</span>{/if}
          </div>
          <div class="verb">{m.verb}</div>
          <p>{m.description}</p>
          <dl>
            <div><dt>Controls</dt><dd>{m.controlHint}</dd></div>
          </dl>
          {#if m.tags?.length}
            <div class="tags">{#each m.tags as t (t)}<span>{t}</span>{/each}</div>
          {/if}
          {#if s}<p class="muted small">Played {s.plays} &middot; Won {s.wins}{s.errors ? ` · Glitches ${s.errors}` : ''}</p>{/if}
        </a>
      </li>
    {/each}
  </ul>

  {#if import.meta.env.DEV && registry.problems.length}
    <h2>Invalid games</h2>
    <ul data-testid="problems">
      {#each registry.problems as p (p.dir)}
        <li><code>{p.dir}</code>: {p.errors.join('; ')}</li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
  }

  .gcard {
    display: block;
    height: 100%;
    box-sizing: border-box;
    padding: 1rem 1.1rem;
    border: 1px solid #2a2f45;
    border-radius: 12px;
    background: #12162a;
    color: inherit;
    text-decoration: none;
  }

  .gcard:hover {
    border-color: #6c7bd1;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  h2 {
    margin: 0;
    font-size: 1.3rem;
  }

  .verb {
    font: 900 1.8rem/1.2 system-ui, sans-serif;
    color: #ffd166;
  }

  .badge {
    font-size: 0.7rem;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    background: #ffd166;
    color: #111;
    font-weight: 800;
  }

  dl {
    margin: 0.5rem 0;
    font-size: 0.9rem;
  }

  dl div {
    display: flex;
    gap: 0.5rem;
  }

  dt {
    color: #9aa3c0;
    min-width: 5rem;
  }

  dd {
    margin: 0;
  }

  .tags {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .tags span {
    font-size: 0.75rem;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    background: #23283d;
  }
</style>
