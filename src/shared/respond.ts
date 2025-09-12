import { HttpResponseInit, InvocationContext } from "@azure/functions";
import { ApiError, ApiSuccess, Meta, PaginationMeta } from "./envelope";
import { HTTP_STATUS } from "./status-code";

function baseHeaders(traceId: string): Record<string, string> {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Trace-Id": traceId,
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

function json<T>(
  status: number,
  body: T,
  headers: Record<string, string>
): HttpResponseInit {
  return { status, headers, jsonBody: body as any };
}

function meta(ctx: InvocationContext, extra?: Partial<Meta>): Meta {
  return { traceId: ctx.invocationId, ...(extra ?? {}) };
}

export function ok<T>(
  ctx: InvocationContext,
  data: T,
  m?: Partial<Meta>
): HttpResponseInit {
  const body: ApiSuccess<T> = { success: true, data, meta: meta(ctx, m) };
  return json(HTTP_STATUS.OK, body, baseHeaders(body.meta!.traceId));
}

export function created<T>(
  ctx: InvocationContext,
  data: T,
  m?: Partial<Meta>
): HttpResponseInit {
  const body: ApiSuccess<T> = { success: true, data, meta: meta(ctx, m) };
  return json(HTTP_STATUS.CREATED, body, baseHeaders(body.meta!.traceId));
}

export function noContent(ctx: InvocationContext): HttpResponseInit {
  return {
    status: HTTP_STATUS.NO_CONTENT,
    headers: baseHeaders(ctx.invocationId),
  };
}

export function fail(
  ctx: InvocationContext,
  status: number,
  code: string,
  message: string,
  details?: unknown,
  fields?: ApiError["error"]["fields"]
): HttpResponseInit {
  const body: ApiError = {
    success: false,
    error: { code, message, details, fields },
    meta: meta(ctx),
  };
  return json(status, body, baseHeaders(body.meta!.traceId));
}

export function options(ctx: InvocationContext): HttpResponseInit {
  return {
    status: HTTP_STATUS.OK,
    headers: baseHeaders(ctx.invocationId),
  };
}
