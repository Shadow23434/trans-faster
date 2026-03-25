import { vitePreprocess, svelte } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  plugins: [svelte()]
};

