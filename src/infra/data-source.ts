// src/infra/data-source.ts
import { CosmosClient, Database, Container, PartitionKeyKind } from '@azure/cosmos';
import { env } from '../config/env';

let client: CosmosClient | null = null;
let database: Database | null = null;

function required(name: string, value?: string) {
  if (!value) throw new Error(`${name} is required`);
}

export function getCosmosClient(): CosmosClient {
  if (!client) {
    const endpoint = env.cosmosDB.endpoint;
    const key = env.cosmosDB.key;
    required('COSMOS_ENDPOINT', endpoint);
    required('COSMOS_KEY', key);
    client = new CosmosClient({ endpoint, key });
  }
  return client;
}

export async function getDb(): Promise<Database> {
  if (!database) {
    const id = env.cosmosDB.databaseName;
    required('COSMOS_DATABASE_NAME', id);
    const c = getCosmosClient();
    const { database: db } = await c.databases.createIfNotExists({ id });
    database = db;
  }
  return database!;
}

type ContainerInit = { id: string; partitionKeyPath?: string };

export async function getContainer(init: ContainerInit): Promise<Container> {
  const { id, partitionKeyPath = '/id' } = init;
  required('COSMOS_CONTAINER_NAME', id);
  const db = await getDb();
  const { container } = await db.containers.createIfNotExists({
    id,
    partitionKey: { 
      paths: [partitionKeyPath],
      kind: PartitionKeyKind.Hash
    },
  });
  console.log('[cosmos] init', {
    db: env.cosmosDB.databaseName,
    container: id,
    pk: partitionKeyPath,
  });

  return container;
}
