import { createServerAdapter } from "@whatwg-node/server";
import { createServer } from "./server";

const app = createServer();
const adapter = createServerAdapter((req) => app(req));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Send all /api/* requests to Express
    if (url.pathname.startsWith("/api/")) {
      return adapter.fetch(request);
    }

    // Serve static SPA assets for everything else (React Router handles client-side routing)
    return env.ASSETS.fetch(request);
  },
};

interface Env {
  ASSETS: Fetcher;
}
