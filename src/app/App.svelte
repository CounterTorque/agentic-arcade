<main>
  <h1>Agentic Arcade</h1>
  <div class="viewport">
    <div class="stage" data-testid="stage"></div>
  </div>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    box-sizing: border-box;
    padding: 0.5rem 1rem 1rem;
  }

  h1 {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    text-align: center;
  }

  .viewport {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stage {
    aspect-ratio: 4 / 3;
    width: min(100%, calc((100vh - 5rem) * 4 / 3));
    background: #000;
    border: 2px solid #2a2f45;
    box-sizing: border-box;
  }
</style>
