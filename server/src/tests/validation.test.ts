import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, initLocalDb, closeAllPools } from '../app';
import fs from 'fs';
import path from 'path';

const TEST_DB_PATH = path.resolve(__dirname, '../../data/config.db');

describe('Projects and Dashboard API (validation)', () => {
  let envId: string;

  beforeAll(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    await initLocalDb();

    const createEnvRes = await request(app)
      .post('/api/environments')
      .send({
        name: '验证测试环境',
        host: '10.0.0.1',
        port: 3306,
        database_name: 'test_db',
        username: 'root',
        password: 'root',
        db_type: 'mysql',
        description: 'for validation tests',
      });
    envId = createEnvRes.body.data.id;
  });

  afterAll(() => {
    closeAllPools();
  });

  describe('Projects API validation', () => {
    it('GET /api/projects/overview/:envId should return 404 for non-existent env', async () => {
      const res = await request(app).get('/api/projects/overview/non-existent-env');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/projects/overview/:envId should reject invalid date format', async () => {
      const res = await request(app)
        .get(`/api/projects/overview/${envId}?startDate=2026/05/20&endDate=2026/05/26`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid date');
    });

    it('GET /api/projects/task-stats/:envId should return 404 for non-existent env', async () => {
      const res = await request(app).get('/api/projects/task-stats/non-existent-env');
      expect(res.status).toBe(404);
    });

    it('GET /api/projects/task-stats/:envId should reject invalid date format', async () => {
      const res = await request(app)
        .get(`/api/projects/task-stats/${envId}?startDate=invalid&endDate=2026-05-26`);
      expect(res.status).toBe(400);
    });

    it('GET /api/projects/task-trend/:envId should return 404 for non-existent env', async () => {
      const res = await request(app).get('/api/projects/task-trend/non-existent-env');
      expect(res.status).toBe(404);
    });

    it('GET /api/projects/task-trend/:envId should reject invalid date format', async () => {
      const res = await request(app)
        .get(`/api/projects/task-trend/${envId}?startDate=2026-05-20&endDate=26-05-2026`);
      expect(res.status).toBe(400);
    });
  });

  describe('Dashboard API validation', () => {
    it('GET /api/dashboard/hourly-distribution/:envId should return 404 for non-existent env', async () => {
      const res = await request(app).get('/api/dashboard/hourly-distribution/non-existent-env');
      expect(res.status).toBe(404);
    });

    it('GET /api/dashboard/hourly-distribution/:envId should reject invalid date', async () => {
      const res = await request(app)
        .get(`/api/dashboard/hourly-distribution/${envId}?startDate=bad&endDate=2026-05-26`);
      expect(res.status).toBe(400);
    });

    it('GET /api/dashboard/worker-distribution/:envId should return 404 for non-existent env', async () => {
      const res = await request(app).get('/api/dashboard/worker-distribution/non-existent-env');
      expect(res.status).toBe(404);
    });

    it('GET /api/dashboard/host-distribution/:envId should return 404 for non-existent env', async () => {
      const res = await request(app).get('/api/dashboard/host-distribution/non-existent-env');
      expect(res.status).toBe(404);
    });

    it('GET /api/dashboard/task-type-distribution/:envId should return 404 for non-existent env', async () => {
      const res = await request(app).get('/api/dashboard/task-type-distribution/non-existent-env');
      expect(res.status).toBe(404);
    });

    it('GET /api/dashboard/duration-stats/:envId should return 404 for non-existent env', async () => {
      const res = await request(app).get('/api/dashboard/duration-stats/non-existent-env');
      expect(res.status).toBe(404);
    });

    it('GET /api/dashboard/failure-analysis/:envId should return 404 for non-existent env', async () => {
      const res = await request(app).get('/api/dashboard/failure-analysis/non-existent-env');
      expect(res.status).toBe(404);
    });

    it('GET /api/dashboard/dashboard/:envId should return 404 for non-existent env', async () => {
      const res = await request(app).get('/api/dashboard/dashboard/non-existent-env');
      expect(res.status).toBe(404);
    });

    it('GET /api/dashboard/dashboard/:envId should reject invalid date', async () => {
      const res = await request(app)
        .get(`/api/dashboard/dashboard/${envId}?startDate=2026-05-20&endDate=bad`);
      expect(res.status).toBe(400);
    });
  });
});
