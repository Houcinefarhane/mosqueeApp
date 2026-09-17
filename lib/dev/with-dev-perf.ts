import { NextRequest } from "next/server";

type RouteHandler = (req: NextRequest, context?: unknown) => Promise<Response> | Response;

/**
 * Enveloppe une route API pour logger le temps de réponse en développement.
 */
export function withDevPerf(label: string, handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, context?: unknown) => {
    if (process.env.NODE_ENV !== "development") {
      return handler(req, context);
    }

    const start = performance.now();
    try {
      const response = await handler(req, context);
      const ms = (performance.now() - start).toFixed(1);
      console.log(`[perf] ${label} ${req.method} → ${response.status} (${ms}ms)`);
      return response;
    } catch (error) {
      const ms = (performance.now() - start).toFixed(1);
      console.error(`[perf] ${label} ${req.method} → ERROR (${ms}ms)`, error);
      throw error;
    }
  };
}
