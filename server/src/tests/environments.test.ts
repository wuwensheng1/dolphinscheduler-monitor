import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, initLocalDb, closeAllPools } from '../app';
import { getDb, saveDatabase } from '../utils/localDb';
import fs from 'fs';
import path from 'path';

const TEST_DB_PATH = path.resolve(__dirname, '../../data/config.db');

describe('Environment API', () => {
  beforeAll(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    await initLocalDb();
  });

  afterAll(() => {
    closeAllPools();
  });

  it('GET /api/health should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/environments should return empty list initially', async () => {
    const res = await request(app).get('/api/environments');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('POST /api/environments should create an environment', async () => {
    const res = await request(app)
      .post('/api/environments')
      .send({
        name: '测试环境',
        host: '10.0.0.1',
        port: 3306,
        database_name: 'dolphinscheduler',
        username: 'root',
        password: 'root123',
        db_type: 'mysql',
        description: '单元测试环境',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
  });

  it('GET /api/environments should return 1 environment after creation', async () => {
    const res = await request(app).get('/api/environments');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('测试环境');
    expect(res.body.data[0].host).toBe('10.0.0.1');
    expect(res.body.data[0].db_type).toBe('mysql');
  });

  let createdEnvId: string;

  it('should create and retrieve a specific environment', async () => {
    const createRes = await request(app)
      .post('/api/environments')
      .send({
        name: '生产环境',
        host: '10.66.28.175',
        port: 3306,
        database_name: 'dolphinscheduler',
        username: 'dsru',
        password: 'dsru',
        db_type: 'mysql',
        description: '生产DS环境',
      });
    expect(createRes.body.success).toBe(true);
    createdEnvId = createRes.body.data.id;

    const getRes = await request(app).get(`/api/environments/${createdEnvId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.name).toBe('生产环境');
    expect(getRes.body.data.port).toBe(3306);
  });

  it('GET /api/environments/:id should return 404 for non-existent id', async () => {
    const res = await request(app).get('/api/environments/non-existent-id');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('PUT /api/environments/:id should update an environment', async () => {
    const res = await request(app)
      .put(`/api/environments/${createdEnvId}`)
      .send({
        name: '生产环境-已更新',
        host: '10.66.28.176',
        port: 3307,
        database_name: 'dolphinscheduler2',
        username: 'dsru2',
        password: 'dsru2',
        db_type: 'doris',
        description: '更新后',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const getRes = await request(app).get(`/api/environments/${createdEnvId}`);
    expect(getRes.body.data.name).toBe('生产环境-已更新');
    expect(getRes.body.data.host).toBe('10.66.28.176');
    expect(getRes.body.data.db_type).toBe('doris');
  });

  it('DELETE /api/environments/:id should delete an environment and its indicators', async () => {
    const listRes = await request(app).get('/api/environments');
    const countBefore = listRes.body.data.length;

    const res = await request(app).delete(`/api/environments/${createdEnvId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const listRes2 = await request(app).get('/api/environments');
    expect(listRes2.body.data.length).toBe(countBefore - 1);
  });

  it('POST /api/environments/:id/test should return 404 for non-existent env', async () => {
    const res = await request(app)
      .post('/api/environments/non-existent-id/test');
    expect(res.status).toBe(404);
  });
});
