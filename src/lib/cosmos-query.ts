// src/lib/cosmos-query.ts
import type { Container, SqlQuerySpec } from '@azure/cosmos';

export interface PageResult<T> {
  items: T[];
  continuationToken?: string;
}

/**
 * Fetch a specific page using Cosmos continuation tokens.
 * NOTE: Cosmos doesn't support OFFSET/LIMIT, so we iterate pages server-side.
 */
export async function queryPage<T>(
  container: Container,
  sql: SqlQuerySpec,
  page: number,
  pageSize: number,
): Promise<PageResult<T>> {
  let continuationToken: string | undefined = undefined;
  let current = 1;

  do {
    const resp = await container.items
      .query<T>(sql, { maxItemCount: pageSize, continuationToken })
      .fetchNext();

    continuationToken = resp.continuationToken ?? undefined;

    if (current === page) {
      return { items: resp.resources, continuationToken };
    }
    current++;
  } while (continuationToken);

  // Requested page is past the end
  return { items: [], continuationToken: undefined };
}
