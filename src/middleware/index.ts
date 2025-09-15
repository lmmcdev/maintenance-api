import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AuthenticatedContext } from './auth.middleware';

export type MiddlewareFunction = (
  req: HttpRequest,
  ctx: AuthenticatedContext,
  next: () => Promise<HttpResponseInit>
) => Promise<HttpResponseInit>;

export type HandlerFunction = (
  req: HttpRequest,
  ctx: AuthenticatedContext
) => Promise<HttpResponseInit>;

export function withMiddleware(
  middlewares: MiddlewareFunction[],
  handler: HandlerFunction
) {
  return async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const authCtx = ctx as AuthenticatedContext;

    let index = 0;

    const next = async (): Promise<HttpResponseInit> => {
      if (index < middlewares.length) {
        const middleware = middlewares[index++];
        return await middleware(req, authCtx, next);
      } else {
        return await handler(req, authCtx);
      }
    };

    return await next();
  };
}

export * from './auth.middleware';