import DialogWindow from './components/DialogWindow.svelte';

const target = document.getElementById('dialog-app');

if (!target) {
  console.error('Dialog app target element not found!');
  throw new Error('Dialog app target element not found!');
}

const app = new DialogWindow({
  target: target
});

export default app;