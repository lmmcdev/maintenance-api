import dotenv from 'dotenv';

dotenv.config();

// Configuración de entorno (variables de entorno)
export const env = {
  api: {
    version: process.env.API_VERSION ?? 'v1',
    baseUrl: process.env.API_BASE_URL ?? 'http://localhost:7100',
    ticketRoute: process.env.TICKET_ROUTE ?? 'tickets',
    personRoute: process.env.PERSON_ROUTE ?? 'persons',
    categoryRoute: process.env.CATEGORY_ROUTE ?? 'categories',
  },
  cosmosDB: {
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY,
    databaseName: process.env.COSMOS_DB_NAME ?? 'maintenance-db',
    ticketContainer: process.env.COSMOS_TICKET_CONTAINER ?? 'tickets',
    personContainer: process.env.COSMOS_PERSON_CONTAINER ?? 'persons',
    categoryContainer: process.env.COSMOS_CATEGORY_CONTAINER ?? 'categories',
  },
  azureAd: {
    tenantId: process.env.AZURE_AD_TENANT_ID,
    clientId: process.env.AZURE_AD_CLIENT_ID,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
    scopes: process.env.AZURE_AD_SCOPES ?? 'User.Read',
    redirectUri: process.env.AZURE_AD_REDIRECT_URI,
    postLogoutRedirectUri: process.env.AZURE_AD_POST_LOGOUT_REDIRECT_URI,
  },
  groups: {
    maintenance: process.env.GROUP_MAINTENANCE_ID ?? 'app-maintenance-group',
  },
  externalServices: {
    locationServiceUrl: process.env.LOCATION_API_BASE_URL ?? 'http://localhost:7072',
  },
};
