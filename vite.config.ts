import {
  defineConfig,
} from "vite";

import react from "@vitejs/plugin-react";

import tailwindcss from "@tailwindcss/vite";


export default defineConfig({

  plugins: [
    react(),
    tailwindcss(),
  ],

  build: {

    /*
     * Keep the warning useful while allowing the
     * application to contain some larger lazy-loaded
     * feature chunks.
     */

    chunkSizeWarningLimit: 1000,

  },

});