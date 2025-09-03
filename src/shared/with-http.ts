// shared/http.ts (o donde tengas withHttp)
import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { mapErrorToResponse } from './error-map';

// Puedes mantener este array hardcodeado como fallback,
// pero lo ideal es leer de env: ALLOWED_ORIGINS="http://localhost:3000,https://<swa>"
const DEFAULT_ALLOWED = [
  'http://localhost:3000',
  'https://purple-field-036f99410.1.azurestaticapps.net',
];

function getAllowedOrigins(): string[] {
  const fromEnv = process.env.ALLOWED_ORIGINS;
  if (!fromEnv) return DEFAULT_ALLOWED;
  return fromEnv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function resolveOrigin(reqOrigin?: string): string | undefined {
  if (!reqOrigin) return undefined;
  const allowed = getAllowedOrigins();
  if (allowed.includes('*')) return reqOrigin; // solo si NO usas credentials
  return allowed.includes(reqOrigin) ? reqOrigin : undefined;
}

function corsHeaders(origin?: string) {
  // Si haces fetch con Authorization o cookies, manten credentials = true
  const h: Record<string, string> = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    // Si usas headers personalizados en respuestas y necesitas leerlos desde JS,
    // expónlos aquí:
    // "Access-Control-Expose-Headers": "X-Continuation-Token",
  };
  if (origin) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Credentials'] = 'true';
  }
  return h;
}

export type HttpHandler = (req: HttpRequest, ctx: InvocationContext) => Promise<HttpResponseInit>;

export function withHttp(handler: HttpHandler): HttpHandler {
  return async (req, ctx) => {
    const origin = resolveOrigin(req.headers.get('Origin') || undefined);

    // Preflight: el navegador pregunta si puede llamar
    if (req.method === 'OPTIONS') {
      return { status: 204, headers: corsHeaders(origin) };
    }

    try {
      const res = await handler(req, ctx);
      return {
        ...res,
        headers: { ...(res.headers ?? {}), ...corsHeaders(origin) },
      };
    } catch (err) {
      const res = mapErrorToResponse(ctx, err);
      return {
        ...res,
        headers: { ...(res.headers ?? {}), ...corsHeaders(origin) },
      };
    }
  };
}
