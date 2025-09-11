import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureAuthService } from '../auth.service';
import { ok, fail } from '../../../shared/respond';
import { HTTP_STATUS } from '../../../shared/status-code';

const authService = new AzureAuthService();

export async function authLogout(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const logoutUrl = await authService.logout();
    
    return ok(context, { logoutUrl });
  } catch (error: any) {
    context.error('Logout error:', error);
    return fail(
      context,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'AUTH_LOGOUT_ERROR',
      'Failed to generate logout URL',
      error.message
    );
  }
}

app.http('auth-logout', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/logout',
  handler: authLogout,
});