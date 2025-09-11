# Azure AD Authentication Module

This module provides Azure Active Directory (Azure AD) authentication for the Maintenance API.

## Features

- OAuth 2.0 / OpenID Connect authentication flow
- Token validation with JWT
- Token refresh functionality
- User profile retrieval
- Role-based access control
- Middleware for protected routes

## Configuration

Set the following environment variables:

```env
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_SCOPES=User.Read,api://your-client-id/.default
AZURE_AD_REDIRECT_URI=http://localhost:7100/auth/callback
AZURE_AD_POST_LOGOUT_REDIRECT_URI=http://localhost:7100
```

## Available Routes

- `GET /auth/login` - Generates Azure AD authorization URL
- `GET /auth/callback` - Handles OAuth callback and exchanges code for tokens
- `POST /auth/refresh` - Refreshes access token using refresh token
- `GET /auth/validate` - Validates the current access token
- `POST /auth/logout` - Generates logout URL
- `GET /auth/me` - Returns authenticated user profile (protected route)

## Usage in Routes

### Protecting Routes

Use the `requireAuth` middleware to protect routes:

```typescript
import { requireAuth, AuthenticatedRequest } from '../auth/auth.middleware';

async function protectedHandler(
  request: AuthenticatedRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const user = request.user;
  // Your protected logic here
}

app.http('protected-route', {
  handler: requireAuth(protectedHandler),
  // ... other config
});
```

### Role-Based Access

```typescript
import { authMiddleware } from '../auth/auth.middleware';

// In your handler
if (!authMiddleware.requireRoles(['Admin'])(request.user)) {
  return {
    status: 403,
    jsonBody: { error: 'Forbidden' }
  };
}
```

## Authentication Flow

1. Client calls `/auth/login` to get authorization URL
2. User is redirected to Azure AD login page
3. After successful login, Azure AD redirects to `/auth/callback`
4. Callback endpoint exchanges authorization code for tokens
5. Client stores access token and refresh token
6. Client includes access token in Authorization header for protected routes
7. Use `/auth/refresh` to get new access token when it expires

## Token Format

Include the access token in requests:

```
Authorization: Bearer <access_token>
```