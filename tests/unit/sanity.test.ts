import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';
import { CONTRACT_VERSION } from '@arcade/sdk';
import App from '../../src/app/App.svelte';

describe('scaffold sanity', () => {
  it('exposes the contract version through the sdk alias', () => {
    expect(CONTRACT_VERSION).toBe(1);
  });

  it('provides a no-op 2d canvas context', () => {
    const g = document.createElement('canvas').getContext('2d')!;
    g.fillRect(0, 0, 10, 10);
    g.fillStyle = 'red';
    expect(g.fillStyle).toBe('red');
    expect(g.measureText('x').width).toBe(0);
    expect(g.getTransform().translateSelf(1, 1)).toBeTruthy();
  });

  it('mounts a Svelte 5 component', () => {
    const target = document.createElement('div');
    const app = mount(App, { target });
    expect(target.querySelector('h1')?.textContent).toBe('Agentic Arcade');
    unmount(app);
  });
});
