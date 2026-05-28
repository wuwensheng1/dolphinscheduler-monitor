import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDatabase } from '../utils/localDb';
import * as dbUtil from '../utils/db';

const router = Router();

function p(val: string | string[] | undefined): string {
  return String(val ?? '');
}

interface EnvRow {
  id: string;
  name: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  password: string;
  db_type: string;
  description: string;
  created_at: string;
  updated_at: string;
}

function rowToEnv(row: any[]): EnvRow {
  return {
    id: row[0] as string,
    name: row[1] as string,
    host: row[2] as string,
    port: row[3] as number,
    database_name: row[4] as string,
    username: row[5] as string,
    password: row[6] as string,
    db_type: row[7] as string,
    description: row[8] as string,
    created_at: row[9] as string,
    updated_at: row[10] as string,
  };
}

router.get('/', (_req: Request, res: Response) => {
  try {
    const localDb = getDb();
    const result = localDb.exec('SELECT * FROM environments ORDER BY created_at DESC');
    const rows = result[0]?.values || [];
    const envs = rows.map(rowToEnv);
    res.json({ success: true, data: envs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = p(req.params.id);
    const localDb = getDb();
    const result = localDb.exec('SELECT * FROM environments WHERE id = ?', [id]);
    const rows = result[0]?.values || [];
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Environment not found' });
      return;
    }
    res.json({ success: true, data: rowToEnv(rows[0]) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { name, host, port, database_name, username, password, db_type, description } = req.body;
    const id = uuidv4();
    const localDb = getDb();
    localDb.run(
      `INSERT INTO environments (id, name, host, port, database_name, username, password, db_type, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, host, port || 3306, database_name, username, password, db_type || 'mysql', description || '']
    );
    saveDatabase();
    res.json({ success: true, data: { id } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = p(req.params.id);
    const { name, host, port, database_name, username, password, db_type, description } = req.body;
    const localDb = getDb();
    localDb.run(
      `UPDATE environments SET name=?, host=?, port=?, database_name=?, username=?, password=?, db_type=?, description=?, updated_at=datetime('now')
       WHERE id=?`,
      [name, host, port, database_name, username, password, db_type, description, id]
    );
    dbUtil.closePool(id);
    saveDatabase();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = p(req.params.id);
    const localDb = getDb();
    localDb.run('DELETE FROM indicators WHERE env_id = ?', [id]);
    localDb.run('DELETE FROM environments WHERE id = ?', [id]);
    dbUtil.closePool(id);
    saveDatabase();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const id = p(req.params.id);
    const localDb = getDb();
    const result = localDb.exec('SELECT * FROM environments WHERE id = ?', [id]);
    const rows = result[0]?.values || [];
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Environment not found' });
      return;
    }
    const env = rowToEnv(rows[0]);
    await dbUtil.query(id, {
      host: env.host,
      port: env.port,
      user: env.username,
      password: env.password,
      database: env.database_name,
    }, 'SELECT 1 AS test');
    res.json({ success: true, message: 'Connection successful' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: `Connection failed: ${error.message}` });
  }
});

export function getEnvConfig(envId: string) {
  const localDb = getDb();
  const result = localDb.exec('SELECT * FROM environments WHERE id = ?', [envId]);
  const rows = result[0]?.values || [];
  if (rows.length === 0) return null;
  const env = rowToEnv(rows[0]);
  return {
    host: env.host,
    port: env.port,
    user: env.username,
    password: env.password,
    database: env.database_name,
  };
}

export default router;
