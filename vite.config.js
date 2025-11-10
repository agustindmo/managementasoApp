// agustindmo/proojectpolicyobservatory/proojectpolicyobservatory-75d985a6591d693498f85f4d34b6bcecf841c6b1/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Keep this import

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // 1. Move the tailwindcss() call here, at the top level of Vite plugins
    tailwindcss(), 
    
    // 2. Keep the react plugin, ensuring its internal babel config is clean
    react({
      babel: {
        // Only include actual Babel plugins here.
        plugins: ['babel-plugin-react-compiler'], // Use the string name, or array if you need options
      },
    }),
  ],
  // REMOVED optimizeDeps entry, as dynamic imports handle it now.
})