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
};
