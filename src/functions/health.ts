import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

import { ok, withHttp } from "../shared";

export const healthHandler = withHttp(
  async (
    req: HttpRequest,
    ctx: InvocationContext
  ): Promise<HttpResponseInit> => {
    const now = new Date();
    const upSecs = Math.floor(process.uptime());
    const upSince = new Date(now.getTime() - upSecs * 1000);

    ctx.log(`Health check: ${upSecs} seconds up`);

    const data = {
      upSeconds: upSecs,
      upSince: upSince.toISOString(),
    };
    return ok(ctx, data);
  }
);

app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "v1/health",
  handler: healthHandler,
});
