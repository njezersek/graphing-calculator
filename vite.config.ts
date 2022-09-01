import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import wasmPack from 'vite-plugin-wasm-pack';
import glsl from 'vite-plugin-glsl';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), glsl(), wasmPack('./backend')],
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src'),
    },
  }
})
