import { Pool, QueryResult, QueryResultRow } from 'pg';

export interface DbModule {
  query: <R extends QueryResultRow = any, I extends any[] = any[]>(
    text: string,
    params?: I
  ) => Promise<QueryResult<R>>;
  pool: Pool;
}

declare const db: DbModule;
export default db;
