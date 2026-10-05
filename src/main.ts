import { mount } from 'svelte';
import './app.css';
import App from './app/App.svelte';
import { publishDebug } from './framework/debug';
import { registry } from './framework/registry';

publishDebug({ games: registry.entries.map((e) => e.id) });
mount(App, { target: document.getElementById('app')! });
