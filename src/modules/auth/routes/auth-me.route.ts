import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth, AuthenticatedRequest } from '../auth.middleware';
import { ok, fail } from '../../../shared/respond';
import { HTTP_STATUS } from '../../../shared/status-code';

async function authMe(
  request: AuthenticatedRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    if (!request.user) {
      return fail(
        context,
        HTTP_STATUS.UNAUTHORIZED,
        'NO_USER',
        'No authenticated user'
      );
    }

    return ok(context, { user: request.user });
  } catch (error: any) {
    context.error('Get user profile error:', error);
    return fail(
      context,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'AUTH_ME_ERROR',
      'Failed to get user profile',
      error.message
    );
  }
}

app.http('auth-me', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/me',
  handler: requireAuth(authMe),
});