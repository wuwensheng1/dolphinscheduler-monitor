import mysql, { Pool, PoolOptions } from 'mysql2/promise';

const pools: Map<string, Pool> = new Map();

export function getPool(envId: string, config: PoolOptions): Pool {
  if (!pools.has(envId)) {
    const pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    pools.set(envId, pool);
  }
  return pools.get(envId)!;
}

export async function query(envId: string, config: PoolOptions, sql: string, params?: any[]) {
  const pool = getPool(envId, config);
  const [rows] = await pool.execute(sql, params);
  return rows as any[];
}

export function closePool(envId: string) {
  const pool = pools.get(envId);
  if (pool) {
    pool.end();
    pools.delete(envId);
  }
}

export function closeAllPools() {
  for (const [id, pool] of pools) {
    pool.end();
    pools.delete(id);
  }
}
