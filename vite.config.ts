import { fileURLToPath } from 'node:url'
import { nitro } from 'nitro/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type PluginOption, type UserConfig } from 'vite'

export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const define: Record<string, string> = {}
  for (const [key, value] of Object.entries(env)) {
    define[`import.meta.env.${key}`] = JSON.stringify(value)
  }

  const plugins: PluginOption[] = [
    tailwindcss(),
    tanstackStart({
      importProtection: {
        behavior: 'error',
        client: { files: ['**/server/**'], specifiers: ['server-only'] },
      },
    }),
    viteReact(),
    nitro({ preset: 'cloudflare-module' }),
  ]

  return {
    plugins,
    define,
    css: { transformer: 'lightningcss' },
    resolve: {
      tsconfigPaths: true,
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
      dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', '@tanstack/react-query', '@tanstack/query-core'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
  }
})
