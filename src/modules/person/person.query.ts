import type { SqlQuerySpec, SqlParameter, JSONValue } from '@azure/cosmos';
import { PersonListQueryDto } from './dtos/person-list.dto';

export function buildListPersonsSql(q: PersonListQueryDto): SqlQuerySpec {
  const clauses: string[] = [];
  const parameters: SqlParameter[] = [];

  // helper tipado correctamente
  const push = (name: string, value: JSONValue) => {
    parameters.push({ name, value });
  };

  if (q.q) {
    clauses.push(
      '(CONTAINS(c.firstName, @q, true) OR CONTAINS(c.lastName, @q, true) OR CONTAINS(c.email, @q, true))',
    );
    push('@q', q.q);
  }

  if (q.phoneNumber) {
    clauses.push('c.phoneNumber = @phoneNumber');
    push('@phoneNumber', q.phoneNumber);
  }

  if (q.role) {
    clauses.push('c.role = @role');
    push('@role', q.role);
  }

  if (q.department) {
    clauses.push('c.department = @department');
    push('@department', q.department);
  }

  if (q.email) {
    clauses.push('LOWER(c.email) = @email');
    push('@email', q.email.toLowerCase());
  }

  if (q.createdFrom) {
    clauses.push('c.createdAt >= @createdFrom');
    push('@createdFrom', q.createdFrom.toISOString()); // Date → string
  }

  if (q.createdTo) {
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
    clauses.push('c.createdAt <= @createdTo');
    push('@createdTo', to.toISOString());
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const order = `ORDER BY c.${q.sortBy} ${q.sortDir.toUpperCase()}`;

  return { query: `SELECT * FROM c ${where} ${order}`, parameters };
}
