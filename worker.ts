import { createServer } from "./server";

const app = createServer();

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Route all /api/* requests through Express
    if (url.pathname.startsWith("/api/")) {
      // Convert Cloudflare Request to a Node.js-like request object
      return handleExpressRequest(request, app, env);
    }

    // Serve static SPA assets
    return env.ASSETS.fetch(request);
  },
};

async function handleExpressRequest(request: Request, app: any, env: Env): Promise<Response> {
  return new Promise((resolve) => {
    const url = new URL(request.url);
    
    // Create a mock Node.js request object
    const req: any = {
      method: request.method,
      url: url.pathname + url.search,
      headers: Object.fromEntries(request.headers.entries()),
      body: null,
    };

    // Read body if present
    if (request.body && (request.method === "POST" || request.method === "PUT" || request.method === "PATCH")) {
      request.json().then(data => {
        req.body = data;
        processRequest();
      }).catch(() => {
        req.body = {};
        processRequest();
      });
    } else {
      processRequest();
    }

    function processRequest() {
      // Make env vars available to Express
      process.env.SUPABASE_URL = env.SUPABASE_URL;
      process.env.SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

      // Create a mock Node.js response object
      const chunks: Uint8Array[] = [];
      let statusCode = 200;
      let statusMessage = "OK";
      const responseHeaders: Record<string, string> = {};

      const res: any = {
        statusCode,
        statusMessage,
        setHeader(name: string, value: string) {
          responseHeaders[name] = value;
        },
        getHeader(name: string) {
          return responseHeaders[name];
        },
        removeHeader(name: string) {
          delete responseHeaders[name];
        },
        write(chunk: any) {
          if (typeof chunk === "string") {
            chunks.push(new TextEncoder().encode(chunk));
          } else {
            chunks.push(chunk);
          }
        },
        end(chunk?: any) {
          if (chunk) {
            if (typeof chunk === "string") {
              chunks.push(new TextEncoder().encode(chunk));
            } else {
              chunks.push(chunk);
            }
          }

          // Combine all chunks
          const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
          const combined = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
          }

          resolve(
            new Response(combined, {
              status: res.statusCode,
              statusText: res.statusMessage,
              headers: responseHeaders,
            })
          );
        },
        json(data: any) {
          responseHeaders["Content-Type"] = "application/json";
          this.end(JSON.stringify(data));
        },
        status(code: number) {
          this.statusCode = code;
          return this;
        },
      };

      // Call Express handler
      app(req, res);
    }
  });
}

interface Env {
  ASSETS: Fetcher;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}
