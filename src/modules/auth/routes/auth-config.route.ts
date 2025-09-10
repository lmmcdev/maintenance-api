import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ok, fail } from '../../../shared/respond';
import { HTTP_STATUS } from '../../../shared/status-code';

async function authConfig(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Mostrar configuración de Azure AD (sin secretos)
    const config = {
      tenantId: process.env.AZURE_AD_TENANT_ID || 'NOT_SET',
      clientId: process.env.AZURE_AD_CLIENT_ID || 'NOT_SET',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET ? 'SET' : 'NOT_SET',
      scopes: process.env.AZURE_AD_SCOPES || 'NOT_SET',
      redirectUri: process.env.AZURE_AD_REDIRECT_URI || 'NOT_SET',
      postLogoutRedirectUri: process.env.AZURE_AD_POST_LOGOUT_REDIRECT_URI || 'NOT_SET',
    };

    return ok(context, {
      config,
      message: 'Azure AD Configuration Status',
      warnings: {
        tenantId: config.tenantId === 'NOT_SET' ? 'AZURE_AD_TENANT_ID is required' : null,
        clientId: config.clientId === 'NOT_SET' ? 'AZURE_AD_CLIENT_ID is required' : null,
        redirectUri: config.redirectUri === 'NOT_SET' ? 'AZURE_AD_REDIRECT_URI is recommended' : null,
      }
    });
  } catch (error: any) {
    context.error('Config check error:', error);
    return fail(
      context,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'CONFIG_ERROR',
      'Failed to check Azure AD configuration',
      error.message
    );
  }
}

app.http('auth-config', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/config',
  handler: authConfig,
});