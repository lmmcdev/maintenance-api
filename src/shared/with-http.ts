import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { mapErrorToResponse } from "./error-map";
import { options } from "./respond";

export type HttpHandler = (
  req: HttpRequest,
  ctx: InvocationContext
) => Promise<HttpResponseInit>;

export function withHttp(handler: HttpHandler): HttpHandler {
  return async (req, ctx) => {
    ctx.log(`Handling request for ${req.method} ${req.url}`);
    
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return options(ctx);
    }
    
    try {
      return await handler(req, ctx);
    } catch (err) {
      return mapErrorToResponse(ctx, err);
    }
  };
}
