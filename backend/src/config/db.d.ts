import { Pool, QueryResult, QueryResultRow } from 'pg';

export declare const pool: Pool;
export declare const query: <R extends QueryResultRow = any, I extends any[] = any[]>(
  text: string,
  params?: I
) => Promise<QueryResult<R>>;

declare const _default: {
  query: typeof query;
  pool: Pool;
};

export default _default;
