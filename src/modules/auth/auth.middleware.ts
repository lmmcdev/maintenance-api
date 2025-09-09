import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureAuthService, AzureUser } from './auth.service';
import { AppError } from '../../shared/app-error';
import { HTTP_STATUS } from '../../shared/status-code';

export interface AuthenticatedRequest extends Omit<HttpRequest, 'user'> {
  user?: AzureUser;
  headers: HttpRequest['headers'];
  query: HttpRequest['query'];
  params: HttpRequest['params'];
  body: HttpRequest['body'];
  method: HttpRequest['method'];
  url: HttpRequest['url'];
}

export class AuthMiddleware {
  private authService: AzureAuthService;

  constructor() {
    this.authService = new AzureAuthService();
  }

  async authenticate(
    request: HttpRequest,
    context: InvocationContext
  ): Promise<AuthenticatedRequest | HttpResponseInit> {
    try {
      const authHeader = request.headers.get('authorization');
      const token = this.authService.extractTokenFromHeader(authHeader || undefined);

      if (!token) {
        return {
          status: 401,
          jsonBody: {
            error: 'Unauthorized',
            message: 'No token provided',
          },
        };
      }

      const validationResult = await this.authService.validateToken(token);

      if (!validationResult.valid) {
        return {
          status: 401,
          jsonBody: {
            error: 'Unauthorized',
            message: validationResult.error || 'Invalid token',
          },
        };
      }

      const authenticatedRequest = {
        ...request,
        user: validationResult.user,
      } as AuthenticatedRequest;
      
      return authenticatedRequest;
    } catch (error: any) {
      context.error('Authentication error:', error);
      return {
        status: 500,
        jsonBody: {
          error: 'Internal Server Error',
          message: 'Authentication failed',
        },
      };
    }
  }

  requireRoles(roles: string[]): (user: AzureUser | undefined) => boolean {
    return (user: AzureUser | undefined) => {
      if (!user) return false;
      return roles.some(role => user.roles.includes(role));
    };
  }

  requireGroups(groups: string[]): (user: AzureUser | undefined) => boolean {
    return (user: AzureUser | undefined) => {
      if (!user || !user.groups) return false;
      return groups.some(group => user.groups!.includes(group));
    };
  }
}

export const authMiddleware = new AuthMiddleware();

export async function withAuth(
  request: HttpRequest,
  context: InvocationContext,
  handler: (req: AuthenticatedRequest, ctx: InvocationContext) => Promise<HttpResponseInit>
): Promise<HttpResponseInit> {
  const result = await authMiddleware.authenticate(request, context);
  
  if ('status' in result && result.status === 401) {
    return result as HttpResponseInit;
  }
  
  return handler(result as AuthenticatedRequest, context);
}

export function requireAuth(
  handler: (req: AuthenticatedRequest, ctx: InvocationContext) => Promise<HttpResponseInit>
) {
  return async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    return withAuth(request, context, handler);
  };
}