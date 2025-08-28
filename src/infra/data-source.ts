// src/infra/data-source.ts
import { CosmosClient, Database, Container } from "@azure/cosmos";
import { env } from "../config/env";

let client: CosmosClient | null = null;
let database: Database | null = null;

export function getCosmosClient(): CosmosClient {
  if (!client) {
    const endpoint = env.cosmosDB.endpoint;
    const key = env.cosmosDB.key;
    if (!endpoint || !key) {
      throw new Error("COSMOS_ENDPOINT and COSMOS_KEY must be set");
    }
    client = new CosmosClient({ endpoint, key });
  }
  return client;
}

export async function getDb(): Promise<Database> {
  if (!database) {
    const id = env.cosmosDB.databaseName;
    if (!id) throw new Error("COSMOS_DB_NAME must be set");
    const c = getCosmosClient();
    const { database: db } = await c.databases.createIfNotExists({ id });
    database = db;
  }
  return database!;
}

type ContainerInit = { id: string; partitionKeyPath?: string };

export async function getContainer(init: ContainerInit): Promise<Container> {
  const { id, partitionKeyPath = "/id" } = init;
  if (!id) throw new Error("getContainer: id is required");
  const db = await getDb();
  const { container } = await db.containers.createIfNotExists({
    id,
    partitionKey: { paths: [partitionKeyPath] },
  });
  console.log("[cosmos] init", {
    db: env.cosmosDB.databaseName,
    container: id,
    pk: partitionKeyPath,
  });

  return container;
}
