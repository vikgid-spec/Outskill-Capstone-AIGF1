import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const retellDevProxy = (env: Record<string, string>) => ({
  name: 'retell-dev-proxy',
  configureServer(server: import('vite').ViteDevServer) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith('/api/retellCallStats')) {
        return next();
      }

      try {
        const { fetchRetellCallStats } = await import('./server/retellStats');
        const apiKey = process.env.RETELL_API_KEY ?? env.RETELL_API_KEY;

        if (!apiKey) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'RETELL_API_KEY not set in .env.local' }));
          return;
        }

        const payload = await fetchRetellCallStats(apiKey);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(payload));
      } catch (error) {
        console.error('Retell dev proxy error:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : 'Failed to fetch Retell stats in dev',
          })
        );
      }
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), retellDevProxy(env)],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
