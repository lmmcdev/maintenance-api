// src/modules/ticket/ticket.query.ts
import { ListTicketsQueryDto } from './dtos/ticket.list.dto';

type CosmosSql = {
  query: string;
  parameters: { name: string; value: unknown }[];
  // continuationToken lo maneja el repo (no via SQL)
};

export function buildListTicketsSql(q: ListTicketsQueryDto): CosmosSql {
  const clauses: string[] = [];
  const params: { name: string; value: unknown }[] = [];

  // Búsqueda libre
  if (q.q) {
    clauses.push(
      ' (CONTAINS(c.title, @q, true) OR CONTAINS(c.description, @q, true) OR CONTAINS(c.phoneNumber, @q, true)) ',
    );
    params.push({ name: '@q', value: q.q });
  }

  if (q.status) {
    clauses.push(' c.status = @status ');
    params.push({ name: '@status', value: q.status });
  }
  if (q.priority) {
    clauses.push(' c.priority = @priority ');
    params.push({ name: '@priority', value: q.priority });
  }
  if (q.category) {
    clauses.push(' c.category = @category ');
    params.push({ name: '@category', value: q.category });
  }

  if (q.createdFrom) {
    clauses.push(' c.createdAt >= @createdFrom ');
    params.push({ name: '@createdFrom', value: q.createdFrom.toISOString() });
  }
  if (q.createdTo) {
    // Fin del día inclusive
    const to = new Date(
      Date.UTC(
        q.createdTo.getUTCFullYear(),
        q.createdTo.getUTCMonth(),
        q.createdTo.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
    clauses.push(' c.createdAt <= @createdTo ');
    params.push({ name: '@createdTo', value: to.toISOString() });
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const order = `ORDER BY c.${q.sortBy} ${q.sortDir.toUpperCase()}`;

  // Cosmos NO soporta OFFSET/LIMIT. Limit lo maneja SDK; continuation token viene en headers.
  const query = `SELECT * FROM c ${where} ${order}`;
  return { query, parameters: params };
}
