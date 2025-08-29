// src/config/env.config.ts

export const env = {
  cosmosDB: {
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY,
    databaseName: process.env.COSMOS_DATABASE_NAME,
    container: process.env.COSMOS_CONTAINER_NAME,
  },
};
