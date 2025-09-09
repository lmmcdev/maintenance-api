import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureAuthService } from '../auth.service';
import { ok, fail } from '../../../shared/respond';
import { HTTP_STATUS } from '../../../shared/status-code';

const authService = new AzureAuthService();

export async function authLogin(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const state = request.query.get('state');
    const authUrl = await authService.getAuthorizationUrl(state || undefined);
    
    return ok(context, { authUrl });
  } catch (error: any) {
    context.error('Login error:', error);
    return fail(
      context,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'AUTH_LOGIN_ERROR',
      'Failed to generate authorization URL',
      error.message
    );
  }
}

app.http('auth-login', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: authLogin,
});