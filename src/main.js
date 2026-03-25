import App from './App.svelte';
import './app.css';

const target = document.getElementById('app');

if (!target) {
  console.error('App target element not found!');
  throw new Error('App target element not found!');
}

const app = new App({
  target: target
});

export default app;

