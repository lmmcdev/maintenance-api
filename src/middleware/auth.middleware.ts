import { HttpRequest, InvocationContext } from '@azure/functions';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { getClientPrincipal, ClientPrincipal } from '../lib/auth';

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  groups?: string[];
  clientPrincipal?: ClientPrincipal;
}

export interface AuthenticatedContext extends InvocationContext {
  user?: AuthenticatedUser | null;
}

const client = jwksClient({
  jwksUri: process.env.JWKS_URI || 'https://login.microsoftonline.com/common/discovery/v2.0/keys',
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey() || '';
    callback(null, signingKey);
  });
}

export function verifyToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // En desarrollo, permite tokens HS256 con clave secreta
    const isDev =
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'dev' ||
      !process.env.NODE_ENV;

    if (isDev && process.env.DEV_JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.DEV_JWT_SECRET, { algorithms: ['HS256'] });
        resolve(decoded);
        return;
      } catch (devErr) {
        // Si falla la verificación de desarrollo, intenta con el método de producción
      }
    }

    // Verificación de producción con JWKS
    jwt.verify(
      token,
      getKey,
      {
        audience: process.env.JWT_AUDIENCE,
        issuer: process.env.JWT_ISSUER,
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      },
    );
  });
}

export function extractTokenFromRequest(req: HttpRequest): string | null {
  const headers = req.headers as any;
  const authHeader =
    headers.get?.('authorization') ||
    headers.get?.('Authorization') ||
    headers['authorization'] ||
    headers['Authorization'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

export async function authenticateUser(
  req: HttpRequest,
  ctx: InvocationContext,
): Promise<AuthenticatedUser | null> {
  try {
    // First, try to get client principal from Azure Functions authentication
    const clientPrincipal = getClientPrincipal({ headers: req.headers as any });
    if (clientPrincipal) {
      ctx.log('Client Principal found:', JSON.stringify(clientPrincipal, null, 2));

      let userRoles = clientPrincipal.userRoles || [];

      // If user is authenticated but has no roles, assign default authenticated role
      if (userRoles.length === 0) {
        userRoles = ['authenticated'];
        ctx.log('No roles found in Client Principal, assigning default "authenticated" role');
      }

      return {
        id: clientPrincipal.userId,
        email: clientPrincipal.userDetails,
        roles: userRoles,
        groups: [], // Client Principal doesn't typically include groups directly
        clientPrincipal,
      };
    }

    // If no client principal, try to verify JWT token
    const token = extractTokenFromRequest(req);
    if (!token) {
      ctx.log('No authentication token found');
      return null;
    }

    const decoded = await verifyToken(token);

    // Try multiple fields for email
    const email =
      decoded.email ||
      decoded.preferred_username ||
      decoded.upn ||
      decoded.unique_name ||
      decoded.name;

    // Try multiple fields for roles
    const roles = decoded.roles || decoded.app_roles || decoded['extension_Role'] || [];

    // Try multiple fields for groups
    const groups = decoded.groups || decoded.group_membership || decoded.group_ids || [];

    let userRoles = Array.isArray(roles) ? roles : roles ? [roles] : [];

    // If user is authenticated but has no roles, assign default authenticated role
    if (userRoles.length === 0) {
      userRoles = ['authenticated'];
      ctx.log('No roles found, assigning default "authenticated" role');
    }

    // Process groups
    let userGroups = Array.isArray(groups) ? groups : groups ? [groups] : [];

    const user = {
      id: decoded.sub || decoded.oid || decoded.objectId,
      email: email,
      roles: userRoles,
      groups: userGroups,
    };

    ctx.log('Extracted user:', JSON.stringify(user, null, 2));
    return user;
  } catch (error) {
    ctx.error('Authentication error:', error);
    return null;
  }
}

export function requireAuth(options: { allowAnonymous?: boolean } = {}) {
  return async (req: HttpRequest, ctx: AuthenticatedContext, next: () => Promise<any>) => {
    const user = await authenticateUser(req, ctx);

    if (!user && !options.allowAnonymous) {
      return {
        status: 401,
        jsonBody: {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          meta: { traceId: ctx.invocationId },
        },
      };
    }

    // Set user in context even if null (for optional auth)
    ctx.user = user;
    return next();
  };
}

export function optionalAuth() {
  return requireAuth({ allowAnonymous: true });
}

export function requireRoles(requiredRoles: string[]) {
  return async (req: HttpRequest, ctx: AuthenticatedContext, next: () => Promise<any>) => {
    const user = await authenticateUser(req, ctx);

    if (!user) {
      return {
        status: 401,
        jsonBody: {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          meta: { traceId: ctx.invocationId },
        },
      };
    }

    const hasRequiredRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRequiredRole) {
      return {
        status: 403,
        jsonBody: {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Access denied. Required roles: ${requiredRoles.join(', ')}`,
          },
          meta: { traceId: ctx.invocationId },
        },
      };
    }

    ctx.user = user;
    return next();
  };
}

export function requirePermissions(permissions: string[]) {
  return async (req: HttpRequest, ctx: AuthenticatedContext, next: () => Promise<any>) => {
    const user = await authenticateUser(req, ctx);

    if (!user) {
      return {
        status: 401,
        jsonBody: {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          meta: { traceId: ctx.invocationId },
        },
      };
    }

    // Check if user has admin role (full access)
    if (user.roles.includes('admin')) {
      ctx.user = user;
      return next();
    }

    // Check specific permissions
    const hasPermission = permissions.every(
      (permission) =>
        user.roles.includes(permission) || user.roles.includes(`permission:${permission}`),
    );

    if (!hasPermission) {
      return {
        status: 403,
        jsonBody: {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Access denied. Required permissions: ${permissions.join(', ')}`,
          },
          meta: { traceId: ctx.invocationId },
        },
      };
    }

    ctx.user = user;
    return next();
  };
}

export function requireGroups(requiredGroups: string[]) {
  return async (req: HttpRequest, ctx: AuthenticatedContext, next: () => Promise<any>) => {
    const user = await authenticateUser(req, ctx);

    if (!user) {
      return {
        status: 401,
        jsonBody: {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          meta: { traceId: ctx.invocationId },
        },
      };
    }

    // Check if user has admin role (full access)
    if (user.roles.includes('admin')) {
      ctx.user = user;
      return next();
    }

    // Check if user belongs to any of the required groups
    const userGroups = user.groups || [];
    const hasRequiredGroup = requiredGroups.some((groupId) => userGroups.includes(groupId));

    if (!hasRequiredGroup) {
      ctx.log(
        `Access denied. User groups: [${userGroups.join(
          ', ',
        )}], Required groups: [${requiredGroups.join(', ')}]`,
      );
      return {
        status: 403,
        jsonBody: {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Access denied. Required group membership not found.`,
          },
          meta: { traceId: ctx.invocationId },
        },
      };
    }

    ctx.user = user;
    return next();
  };
}

export function checkGroup(groupId: string) {
  return requireGroups([groupId]);
}
