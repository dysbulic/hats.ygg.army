import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  vite: {
    resolve: {
      alias: {
        '@hatsprotocol/details-sdk': '@hatsprotocol/details-sdk/dist/details-sdk.esm.js',
      },
    },
  },
});
