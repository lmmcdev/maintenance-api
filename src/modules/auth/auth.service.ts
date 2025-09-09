import { ConfidentialClientApplication, PublicClientApplication } from '@azure/msal-node';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { authConfig, msalConfig } from './auth.config';

export interface AzureUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  groups?: string[];
  oid?: string;
  preferred_username?: string;
}

export interface TokenValidationResult {
  valid: boolean;
  user?: AzureUser;
  error?: string;
}

export class AzureAuthService {
  private msalClient: ConfidentialClientApplication | PublicClientApplication;
  private jwksClient: jwksClient.JwksClient;

  constructor() {
    if (authConfig.clientSecret) {
      this.msalClient = new ConfidentialClientApplication(msalConfig);
    } else {
      this.msalClient = new PublicClientApplication(msalConfig);
    }

    this.jwksClient = jwksClient({
      jwksUri: authConfig.jwksUri,
      cache: true,
      cacheMaxAge: 600000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  async getAuthorizationUrl(state?: string): Promise<string> {
    const authCodeUrlParameters = {
      scopes: authConfig.scopes,
      redirectUri: authConfig.redirectUri || '',
      state: state,
    };

    const response = await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
    return response;
  }

  async acquireTokenByCode(code: string): Promise<any> {
    const tokenRequest = {
      code: code,
      scopes: authConfig.scopes,
      redirectUri: authConfig.redirectUri || '',
    };

    try {
      const response = await this.msalClient.acquireTokenByCode(tokenRequest);
      return response;
    } catch (error) {
      console.error('Error acquiring token:', error);
      throw error;
    }
  }

  async acquireTokenSilent(account: any): Promise<any> {
    const silentRequest = {
      account: account,
      scopes: authConfig.scopes,
    };

    try {
      const response = await this.msalClient.acquireTokenSilent(silentRequest);
      return response;
    } catch (error) {
      console.error('Error acquiring token silently:', error);
      throw error;
    }
  }

  async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      const decoded = jwt.decode(token, { complete: true }) as any;
      
      if (!decoded || !decoded.header || !decoded.header.kid) {
        return { valid: false, error: 'Invalid token format' };
      }

      const key = await this.getSigningKey(decoded.header.kid);
      
      const verified = jwt.verify(token, key, {
        algorithms: ['RS256'],
        issuer: authConfig.issuer,
        audience: authConfig.audience,
      }) as any;

      const user: AzureUser = {
        id: verified.oid || verified.sub,
        email: verified.email || verified.preferred_username || verified.upn,
        name: verified.name || verified.given_name + ' ' + verified.family_name,
        roles: verified.roles || [],
        groups: verified.groups,
        oid: verified.oid,
        preferred_username: verified.preferred_username,
      };

      return { valid: true, user };
    } catch (error: any) {
      console.error('Token validation error:', error);
      return { valid: false, error: error.message };
    }
  }

  private async getSigningKey(kid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.jwksClient.getSigningKey(kid, (err, key) => {
        if (err) {
          reject(err);
        } else {
          const signingKey = key?.getPublicKey();
          if (!signingKey) {
            reject(new Error('Could not get signing key'));
          } else {
            resolve(signingKey);
          }
        }
      });
    });
  }

  async refreshToken(refreshToken: string): Promise<any> {
    const refreshTokenRequest = {
      refreshToken: refreshToken,
      scopes: authConfig.scopes,
    };

    try {
      const response = await this.msalClient.acquireTokenByRefreshToken(refreshTokenRequest);
      return response;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  async logout(): Promise<string> {
    const logoutUrl = `${authConfig.authority}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(authConfig.postLogoutRedirectUri || '')}`;
    return logoutUrl;
  }

  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}