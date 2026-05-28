import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, initLocalDb, closeAllPools } from '../app';
import fs from 'fs';
import path from 'path';

const TEST_DB_PATH = path.resolve(__dirname, '../../data/config.db');

describe('Indicator API', () => {
  let envId: string;

  beforeAll(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    await initLocalDb();

    const createEnvRes = await request(app)
      .post('/api/environments')
      .send({
        name: '指标测试环境',
        host: '10.0.0.1',
        port: 3306,
        database_name: 'test_db',
        username: 'root',
        password: 'root',
        db_type: 'mysql',
        description: 'for indicator tests',
      });
    envId = createEnvRes.body.data.id;
  });

  afterAll(() => {
    closeAllPools();
  });

  it('GET /api/indicators/env/:envId should return empty initially', async () => {
    const res = await request(app).get(`/api/indicators/env/${envId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  let indicator1Id: string;
  let indicator2Id: string;

  it('POST /api/indicators should create first indicator', async () => {
    const res = await request(app)
      .post('/api/indicators')
      .send({
        env_id: envId,
        name: '日成功率',
        description: '每日调度成功率',
        sql_text: 'SELECT 95.5',
        result_type: 'number',
        min_value: 90,
        max_value: 100,
        weight: 1.5,
        sort_order: 1,
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    indicator1Id = res.body.data.id;
  });

  it('POST /api/indicators should create second indicator with dynamic bounds', async () => {
    const res = await request(app)
      .post('/api/indicators')
      .send({
        env_id: envId,
        name: '任务失败数',
        description: '每日任务失败总数',
        sql_text: 'SELECT 10',
        result_type: 'number',
        min_value: 0,
        max_value: 50,
        min_sql: 'SELECT 0',
        max_sql: 'SELECT 50',
        weight: 1.0,
        sort_order: 2,
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    indicator2Id = res.body.data.id;
  });

  it('GET /api/indicators/env/:envId should return 2 indicators', async () => {
    const res = await request(app).get(`/api/indicators/env/${envId}`);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].name).toBe('日成功率');
    expect(res.body.data[0].weight).toBe(1.5);
    expect(res.body.data[1].name).toBe('任务失败数');
    expect(res.body.data[1].min_sql).toBe('SELECT 0');
    expect(res.body.data[1].max_sql).toBe('SELECT 50');
  });

  it('PUT /api/indicators/:id should update an indicator', async () => {
    const updateRes = await request(app)
      .put(`/api/indicators/${indicator1Id}`)
      .send({
        name: '已更新指标',
        description: '更新后描述',
        sql_text: 'SELECT 2',
        result_type: 'number',
        min_value: 10,
        max_value: 90,
        weight: 2.0,
        sort_order: 0,
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);

    const listRes = await request(app).get(`/api/indicators/env/${envId}`);
    const updated = listRes.body.data.find((i: any) => i.id === indicator1Id);
    expect(updated.name).toBe('已更新指标');
    expect(updated.weight).toBe(2.0);
  });

  it('DELETE /api/indicators/:id should delete an indicator', async () => {
    const res = await request(app).delete(`/api/indicators/${indicator2Id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const listRes = await request(app).get(`/api/indicators/env/${envId}`);
    expect(listRes.body.data.length).toBe(1);
  });

  it('POST /api/indicators/evaluate/:envId should return 404 for non-existent env', async () => {
    const res = await request(app).post('/api/indicators/evaluate/non-existent-env');
    expect(res.status).toBe(404);
  });
});
