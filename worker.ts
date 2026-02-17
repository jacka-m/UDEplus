import { createServerAdapter } from "@whatwg-node/server";
import { createServer } from "./server";

const app = createServer();
const adapter = createServerAdapter((req: Request) => app(req as any));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Route all /api/* requests through Express
    if (url.pathname.startsWith("/api/")) {
      // Pass env so process.env bindings (SUPABASE_URL etc.) are available
      return adapter.fetch(request, env, ctx);
    }

    // Serve static SPA assets — Cloudflare handles SPA fallback automatically
    return env.ASSETS.fetch(request);
  },
};

interface Env {
  ASSETS: Fetcher;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

