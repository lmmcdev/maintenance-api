import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureAuthService } from '../auth.service';
import { ok, fail } from '../../../shared/respond';
import { HTTP_STATUS } from '../../../shared/status-code';

const authService = new AzureAuthService();

export async function authCallback(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const code = request.query.get('code');
    
    if (!code) {
      return fail(
        context,
        HTTP_STATUS.BAD_REQUEST,
        'MISSING_AUTH_CODE',
        'Authorization code not provided'
      );
    }

    const tokenResponse = await authService.acquireTokenByCode(code);
    
    return ok(context, {
      accessToken: tokenResponse.accessToken,
      idToken: tokenResponse.idToken,
      refreshToken: tokenResponse.refreshToken,
      expiresOn: tokenResponse.expiresOn,
      account: tokenResponse.account,
    });
  } catch (error: any) {
    context.error('Callback error:', error);
    return fail(
      context,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'AUTH_CALLBACK_ERROR',
      'Failed to acquire token',
      error.message
    );
  }
}

app.http('auth-callback', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/callback',
  handler: authCallback,
});