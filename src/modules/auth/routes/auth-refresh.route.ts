import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureAuthService } from '../auth.service';
import { ok, fail } from '../../../shared/respond';
import { HTTP_STATUS } from '../../../shared/status-code';
import { z } from 'zod';

const authService = new AzureAuthService();

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export async function authRefresh(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = await request.json();
    const validation = refreshTokenSchema.safeParse(body);

    if (!validation.success) {
      return fail(
        context,
        HTTP_STATUS.BAD_REQUEST,
        'VALIDATION_ERROR',
        'Invalid request body',
        validation.error.format()
      );
    }

    const { refreshToken } = validation.data;
    const tokenResponse = await authService.refreshToken(refreshToken);
    
    return ok(context, {
      accessToken: tokenResponse.accessToken,
      idToken: tokenResponse.idToken,
      refreshToken: tokenResponse.refreshToken,
      expiresOn: tokenResponse.expiresOn,
      account: tokenResponse.account,
    });
  } catch (error: any) {
    context.error('Refresh token error:', error);
    return fail(
      context,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'AUTH_REFRESH_ERROR',
      'Failed to refresh token',
      error.message
    );
  }
}

app.http('auth-refresh', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/refresh',
  handler: authRefresh,
});