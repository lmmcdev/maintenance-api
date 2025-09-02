export const env = {
  api: {
    version: process.env.API_VERSION,
    baseUrl: process.env.API_BASE_URL,
    ticketRoute: process.env.TICKET_ROUTE,
    personRoute: process.env.PERSON_ROUTE,
  },
  cosmosDB: {
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY,
    databaseName: process.env.COSMOS_DB_NAME,
    container: process.env.COSMOS_CONTAINER_NAME,
  },
};
