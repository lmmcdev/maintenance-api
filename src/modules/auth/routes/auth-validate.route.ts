import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureAuthService } from '../auth.service';
import { ok, fail } from '../../../shared/respond';
import { HTTP_STATUS } from '../../../shared/status-code';

const authService = new AzureAuthService();

export async function authValidate(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authService.extractTokenFromHeader(authHeader || undefined);

    if (!token) {
      return fail(
        context,
        HTTP_STATUS.UNAUTHORIZED,
        'NO_TOKEN',
        'Authorization header missing'
      );
    }

    const validationResult = await authService.validateToken(token);

    if (!validationResult.valid) {
      return fail(
        context,
        HTTP_STATUS.UNAUTHORIZED,
        'INVALID_TOKEN',
        'Invalid token',
        validationResult.error
      );
    }

    return ok(context, { user: validationResult.user });
  } catch (error: any) {
    context.error('Validation error:', error);
    return fail(
      context,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'AUTH_VALIDATION_ERROR',
      'Failed to validate token',
      error.message
    );
  }
}

app.http('auth-validate', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/validate',
  handler: authValidate,
});