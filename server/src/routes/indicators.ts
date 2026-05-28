import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDatabase } from '../utils/localDb';
import * as dbUtil from '../utils/db';
import { getEnvConfig } from './environments';

const router = Router();

function p(val: string | string[] | undefined): string {
  return String(val ?? '');
}

interface IndicatorRow {
  id: string;
  env_id: string;
  name: string;
  description: string;
  sql_text: string;
  result_type: string;
  min_value: number | null;
  max_value: number | null;
  min_sql: string | null;
  max_sql: string | null;
  weight: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function rowToIndicator(row: any[]): IndicatorRow {
  return {
    id: row[0] as string,
    env_id: row[1] as string,
    name: row[2] as string,
    description: row[3] as string,
    sql_text: row[4] as string,
    result_type: row[5] as string,
    min_value: row[6] as number | null,
    max_value: row[7] as number | null,
    min_sql: row[8] as string | null,
    max_sql: row[9] as string | null,
    weight: row[10] as number,
    sort_order: row[11] as number,
    created_at: row[12] as string,
    updated_at: row[13] as string,
  };
}

router.get('/env/:envId', (req: Request, res: Response) => {
  try {
    const envId = p(req.params.envId);
    const localDb = getDb();
    const result = localDb.exec('SELECT * FROM indicators WHERE env_id = ? ORDER BY sort_order, created_at', [envId]);
    const rows = result[0]?.values || [];
    res.json({ success: true, data: rows.map(rowToIndicator) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { env_id, name, description, sql_text, result_type, min_value, max_value, min_sql, max_sql, weight, sort_order } = req.body;
    const id = uuidv4();
    const localDb = getDb();
    localDb.run(
      `INSERT INTO indicators (id, env_id, name, description, sql_text, result_type, min_value, max_value, min_sql, max_sql, weight, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, env_id, name, description || '', sql_text, result_type || 'number', min_value ?? null, max_value ?? null, min_sql ?? null, max_sql ?? null, weight ?? 1.0, sort_order ?? 0]
    );
    saveDatabase();
    res.json({ success: true, data: { id } });
  } catch (error: any) {
    console.error('Indicator create error:', error);
    res.status(500).json({ success: false, message: error.message || String(error) });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = p(req.params.id);
    const { name, description, sql_text, result_type, min_value, max_value, min_sql, max_sql, weight, sort_order } = req.body;
    const localDb = getDb();
    localDb.run(
      `UPDATE indicators SET name=?, description=?, sql_text=?, result_type=?, min_value=?, max_value=?, min_sql=?, max_sql=?, weight=?, sort_order=?, updated_at=datetime('now')
       WHERE id=?`,
      [name, description, sql_text, result_type, min_value ?? null, max_value ?? null, min_sql ?? null, max_sql ?? null, weight ?? 1.0, sort_order ?? 0, id]
    );
    saveDatabase();
    res.json({ success: true });
  } catch (error: any) {
    console.error('Indicator update error:', error);
    res.status(500).json({ success: false, message: error.message || String(error) });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = p(req.params.id);
    const localDb = getDb();
    localDb.run('DELETE FROM indicators WHERE id = ?', [id]);
    saveDatabase();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/evaluate/:envId', async (req: Request, res: Response) => {
  try {
    const envId = p(req.params.envId);
    const envConfig = getEnvConfig(envId);
    if (!envConfig) {
      res.status(404).json({ success: false, message: 'Environment not found' });
      return;
    }

    const localDb = getDb();
    const result = localDb.exec('SELECT * FROM indicators WHERE env_id = ? ORDER BY sort_order', [envId]);
    const rows = result[0]?.values || [];
    const indicators = rows.map(rowToIndicator);

    const evaluations = [];
    let totalWeight = 0;
    let weightedScore = 0;

    for (const indicator of indicators) {
      try {
        const queryResult = await dbUtil.query(envId, envConfig, indicator.sql_text);
        let actualValue: number | null = null;

        if (queryResult && queryResult.length > 0) {
          const firstRow = queryResult[0];
          const keys = Object.keys(firstRow);
          if (keys.length > 0) {
            actualValue = Number(firstRow[keys[0]]);
          }
        }

        let minBound = indicator.min_value;
        let maxBound = indicator.max_value;

        if (indicator.min_sql) {
          try {
            const minResult = await dbUtil.query(envId, envConfig, indicator.min_sql);
            if (minResult && minResult.length > 0) {
              const keys = Object.keys(minResult[0]);
              if (keys.length > 0) minBound = Number(minResult[0][keys[0]]);
            }
          } catch (e) { /* ignore */ }
        }

        if (indicator.max_sql) {
          try {
            const maxResult = await dbUtil.query(envId, envConfig, indicator.max_sql);
            if (maxResult && maxResult.length > 0) {
              const keys = Object.keys(maxResult[0]);
              if (keys.length > 0) maxBound = Number(maxResult[0][keys[0]]);
            }
          } catch (e) { /* ignore */ }
        }

        let status: 'pass' | 'fail' | 'unknown' = 'unknown';
        let score = 0;

        if (actualValue !== null && !isNaN(actualValue)) {
          const passMin = minBound !== null && minBound !== undefined;
          const passMax = maxBound !== null && maxBound !== undefined;

          if (passMin && passMax) {
            status = (actualValue >= minBound! && actualValue <= maxBound!) ? 'pass' : 'fail';
          } else if (passMin) {
            status = actualValue >= minBound! ? 'pass' : 'fail';
          } else if (passMax) {
            status = actualValue <= maxBound! ? 'pass' : 'fail';
          }

          if (status === 'pass') {
            score = 1;
          } else if (passMin && passMax && maxBound! > minBound!) {
            const range = maxBound! - minBound!;
            if (actualValue < minBound!) {
              score = Math.max(0, 1 - (minBound! - actualValue) / range);
            } else {
              score = Math.max(0, 1 - (actualValue - maxBound!) / range);
            }
          } else {
            score = 0;
          }
        }

        const weight = indicator.weight || 1.0;
        totalWeight += weight;
        weightedScore += score * weight;

        evaluations.push({
          id: indicator.id,
          name: indicator.name,
          description: indicator.description,
          actualValue,
          minBound,
          maxBound,
          status,
          score,
          weight,
        });
      } catch (error: any) {
        evaluations.push({
          id: indicator.id,
          name: indicator.name,
          description: indicator.description,
          actualValue: null,
          minBound: indicator.min_value,
          maxBound: indicator.max_value,
          status: 'unknown',
          score: 0,
          weight: indicator.weight || 1.0,
          error: error.message,
        });
        totalWeight += indicator.weight || 1.0;
      }
    }

    const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const overallStatus: 'excellent' | 'good' | 'warning' | 'critical' =
      overallScore >= 0.9 ? 'excellent' :
      overallScore >= 0.7 ? 'good' :
      overallScore >= 0.5 ? 'warning' : 'critical';

    res.json({
      success: true,
      data: {
        overallScore: Math.round(overallScore * 100) / 100,
        overallStatus,
        evaluations,
        evaluatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
