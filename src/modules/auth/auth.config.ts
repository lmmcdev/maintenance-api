export interface AzureAuthConfig {
  tenantId: string;
  clientId: string;
  clientSecret?: string;
  authority: string;
  issuer: string;
  audience: string;
  jwksUri: string;
  scopes: string[];
  redirectUri?: string;
  postLogoutRedirectUri?: string;
}

export const authConfig: AzureAuthConfig = {
  tenantId: process.env.AZURE_AD_TENANT_ID || '',
  clientId: process.env.AZURE_AD_CLIENT_ID || '',
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
  authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID || 'common'}`,
  issuer: `https://sts.windows.net/${process.env.AZURE_AD_TENANT_ID}/`,
  audience: process.env.AZURE_AD_CLIENT_ID || '',
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID || 'common'}/discovery/v2.0/keys`,
  scopes: (process.env.AZURE_AD_SCOPES || 'User.Read').split(',').map(s => s.trim()),
  redirectUri: process.env.AZURE_AD_REDIRECT_URI,
  postLogoutRedirectUri: process.env.AZURE_AD_POST_LOGOUT_REDIRECT_URI,
};

export const msalConfig = {
  auth: {
    clientId: authConfig.clientId,
    authority: authConfig.authority,
    clientSecret: authConfig.clientSecret,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: any, message: string) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(message);
        }
      },
      piiLoggingEnabled: false,
      logLevel: 3,
    },
  },
};