// src/modules/health/health.route.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { promises as fs } from 'fs';
import path from 'path';

import { withHttp, ok } from '../../shared';
import { getClientPrincipal } from '../../lib/auth';
import { th } from 'zod/locales';

type BuildInfo = {
  appName?: string;
  version?: string;
  commit?: { sha?: string; short?: string; message?: string; author?: string; branch?: string };
  ci?: { repo?: string; runId?: string; runNumber?: string; workflow?: string };
  builtAt?: string;
  env?: string;
};

let cached: BuildInfo | null = null;
async function readBuildInfo(): Promise<BuildInfo | null> {
  if (cached) return cached;
  try {
    const p = path.join(process.cwd(), 'build-info.json'); // raíz de la app en Azure Functions
    const raw = await fs.readFile(p, 'utf8');
    cached = JSON.parse(raw);
    return cached;
  } catch {
    return null;
  }
}

interface ClientPrincipal {
  userId: string;
  userDetails: string;
  identityProvider: string;
  userRoles: string[];
}

const handler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const clientPrincipalHeader = req.headers.get('x-ms-client-principal');
    if (!clientPrincipalHeader) {
      return { status: 401, jsonBody: { message: 'No authentication header' } };
    }
    const decoded = Buffer.from(clientPrincipalHeader, 'base64').toString('utf8');
    const clientPrincipal: ClientPrincipal = JSON.parse(decoded);

    ctx.log(`Health check requested by user ${clientPrincipal.userId}`);

    if (!clientPrincipal || !clientPrincipal.userId) {
      return { status: 401, jsonBody: { message: 'Invalid authentication header' } };
    }

    const bi = await readBuildInfo();

    // Fallback a variables de entorno si no hay archivo
    const fallback: BuildInfo = {
      appName: process.env.APP_NAME ?? 'no-app-name',
      version: process.env.BUILD_VERSION ?? 'no-build-version',
      commit: {
        sha: process.env.BUILD_COMMIT ?? 'no-build-commit',
        short: process.env.BUILD_SHORT_SHA ?? 'no-build-short-sha',
        message: process.env.BUILD_MESSAGE ?? 'no-build-message',
        author: process.env.BUILD_AUTHOR ?? 'no-build-author',
        branch: process.env.BUILD_BRANCH ?? 'no-build-branch',
      },
      ci: {
        repo: process.env.GITHUB_REPOSITORY ?? 'no-github-repository',
        runId: process.env.GITHUB_RUN_ID ?? 'no-github-run-id',
        runNumber: process.env.GITHUB_RUN_NUMBER ?? 'no-github-run-number',
        workflow: process.env.GITHUB_WORKFLOW ?? 'no-github-workflow',
      },
      builtAt: process.env.BUILD_TIME ?? 'no-build-time',
      env: process.env.NODE_ENV ?? 'production',
    };

    return ok(ctx, {
      status: 'ok',
      uptimeSec: Math.round(process.uptime()),
      pid: process.pid,
      instance: process.env.WEBSITE_INSTANCE_ID,
      region: process.env.REGION_NAME || process.env.WEBSITE_HOME_STAMPNAME,
      build: bi ?? fallback,
    });
  },
);

app.http('app-health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'v1/health', // => /api/v1/health
  handler,
});
