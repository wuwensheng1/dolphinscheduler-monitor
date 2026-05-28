import { Router, Request, Response } from 'express';
import * as dbUtil from '../utils/db';
import { getEnvConfig } from './environments';

const router = Router();

function p(val: string | string[] | undefined): string {
  return String(val ?? '');
}

function isValidDateString(dateStr?: string): boolean {
  if (!dateStr) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

function buildDateFilter(prefix: string, startDate?: string, endDate?: string): { sql: string; params: any[] } {
  if (startDate && endDate) {
    return {
      sql: `AND ${prefix}start_time BETWEEN ? AND ?`,
      params: [`${startDate} 00:00:00`, `${endDate} 23:59:59`],
    };
  }
  return { sql: '', params: [] };
}

router.get('/hourly-distribution/:envId', async (req: Request, res: Response) => {
  try {
    const envId = p(req.params.envId);
    const { startDate, endDate } = req.query;
    const envConfig = getEnvConfig(envId);
    if (!envConfig) {
      res.status(404).json({ success: false, message: 'Environment not found' });
      return;
    }

    if (!isValidDateString(startDate as string) || !isValidDateString(endDate as string)) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    const { sql: dateFilter, params } = buildDateFilter('', startDate as string, endDate as string);

    const sql = `
      SELECT
        HOUR(start_time) AS hour_slot,
        COUNT(*) AS total_count,
        SUM(CASE WHEN state = 7 THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN state = 6 THEN 1 ELSE 0 END) AS failure_count,
        SUM(CASE WHEN state = 1 THEN 1 ELSE 0 END) AS running_count
      FROM t_ds_process_instance
      WHERE 1=1 ${dateFilter}
      GROUP BY HOUR(start_time)
      ORDER BY hour_slot
    `;

    const data = await dbUtil.query(envId, envConfig, sql, params);

    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const found = (data as any[]).find((row: any) => row.hour_slot === i);
      return {
        hour: i,
        label: `${i.toString().padStart(2, '0')}:00`,
        total_count: found ? Number(found.total_count) : 0,
        success_count: found ? Number(found.success_count) : 0,
        failure_count: found ? Number(found.failure_count) : 0,
        running_count: found ? Number(found.running_count) : 0,
      };
    });

    res.json({ success: true, data: hourlyData });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/worker-distribution/:envId', async (req: Request, res: Response) => {
  try {
    const envId = p(req.params.envId);
    const { startDate, endDate } = req.query;
    const envConfig = getEnvConfig(envId);
    if (!envConfig) {
      res.status(404).json({ success: false, message: 'Environment not found' });
      return;
    }

    if (!isValidDateString(startDate as string) || !isValidDateString(endDate as string)) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    const { sql: dateFilter, params } = buildDateFilter('ti.', startDate as string, endDate as string);

    const sql = `
      SELECT
        ti.worker_group,
        COUNT(*) AS total_count,
        SUM(CASE WHEN ti.state = 7 THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN ti.state = 6 THEN 1 ELSE 0 END) AS failure_count,
        ROUND(AVG(TIMESTAMPDIFF(SECOND, ti.start_time, ti.end_time)), 2) AS avg_duration_sec
      FROM t_ds_task_instance ti
      WHERE 1=1 ${dateFilter}
      GROUP BY ti.worker_group
      ORDER BY total_count DESC
    `;

    const data = await dbUtil.query(envId, envConfig, sql, params);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/host-distribution/:envId', async (req: Request, res: Response) => {
  try {
    const envId = p(req.params.envId);
    const { startDate, endDate } = req.query;
    const envConfig = getEnvConfig(envId);
    if (!envConfig) {
      res.status(404).json({ success: false, message: 'Environment not found' });
      return;
    }

    if (!isValidDateString(startDate as string) || !isValidDateString(endDate as string)) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    const { sql: dateFilter, params } = buildDateFilter('ti.', startDate as string, endDate as string);

    const sql = `
      SELECT
        ti.host,
        COUNT(*) AS total_count,
        SUM(CASE WHEN ti.state = 7 THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN ti.state = 6 THEN 1 ELSE 0 END) AS failure_count,
        ROUND(AVG(TIMESTAMPDIFF(SECOND, ti.start_time, ti.end_time)), 2) AS avg_duration_sec,
        ROUND(SUM(TIMESTAMPDIFF(SECOND, ti.start_time, ti.end_time)), 2) AS total_duration_sec
      FROM t_ds_task_instance ti
      WHERE 1=1 ${dateFilter}
      GROUP BY ti.host
      ORDER BY INET_ATON(SUBSTRING_INDEX(ti.host, ':', 1)) ASC, CAST(SUBSTRING_INDEX(ti.host, ':', -1) AS UNSIGNED) ASC
    `;

    const data = await dbUtil.query(envId, envConfig, sql, params);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/task-type-distribution/:envId', async (req: Request, res: Response) => {
  try {
    const envId = p(req.params.envId);
    const { startDate, endDate } = req.query;
    const envConfig = getEnvConfig(envId);
    if (!envConfig) {
      res.status(404).json({ success: false, message: 'Environment not found' });
      return;
    }

    if (!isValidDateString(startDate as string) || !isValidDateString(endDate as string)) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    const { sql: dateFilter, params } = buildDateFilter('ti.', startDate as string, endDate as string);

    const sql = `
      SELECT
        td.task_type,
        COUNT(*) AS total_count,
        SUM(CASE WHEN ti.state = 7 THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN ti.state = 6 THEN 1 ELSE 0 END) AS failure_count,
        ROUND(AVG(TIMESTAMPDIFF(SECOND, ti.start_time, ti.end_time)), 2) AS avg_duration_sec
      FROM t_ds_task_instance ti
      LEFT JOIN t_ds_task_definition td ON ti.task_code = td.code
      WHERE 1=1 ${dateFilter}
      GROUP BY td.task_type
      ORDER BY total_count DESC
    `;

    const data = await dbUtil.query(envId, envConfig, sql, params);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/duration-stats/:envId', async (req: Request, res: Response) => {
  try {
    const envId = p(req.params.envId);
    const { startDate, endDate } = req.query;
    const envConfig = getEnvConfig(envId);
    if (!envConfig) {
      res.status(404).json({ success: false, message: 'Environment not found' });
      return;
    }

    if (!isValidDateString(startDate as string) || !isValidDateString(endDate as string)) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    const { sql: dateFilter, params } = buildDateFilter('pi.', startDate as string, endDate as string);

    const sql = `
      SELECT
        pd.name AS process_name,
        p.name AS project_name,
        COUNT(*) AS run_count,
        ROUND(AVG(TIMESTAMPDIFF(SECOND, pi.start_time, pi.end_time)), 2) AS avg_duration_sec,
        ROUND(MIN(TIMESTAMPDIFF(SECOND, pi.start_time, pi.end_time)), 2) AS min_duration_sec,
        ROUND(MAX(TIMESTAMPDIFF(SECOND, pi.start_time, pi.end_time)), 2) AS max_duration_sec,
        ROUND(
          STDDEV(TIMESTAMPDIFF(SECOND, pi.start_time, pi.end_time)), 2
        ) AS stddev_duration_sec
      FROM t_ds_process_instance pi
      LEFT JOIN t_ds_process_definition pd ON pi.process_definition_code = pd.code
      LEFT JOIN t_ds_project p ON pd.project_code = p.code
      WHERE pi.state = 7 ${dateFilter}
      GROUP BY pd.name, p.name
      ORDER BY avg_duration_sec DESC
      LIMIT 50
    `;

    const data = await dbUtil.query(envId, envConfig, sql, params);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/failure-analysis/:envId', async (req: Request, res: Response) => {
  try {
    const envId = p(req.params.envId);
    const { startDate, endDate, limit } = req.query;
    const envConfig = getEnvConfig(envId);
    if (!envConfig) {
      res.status(404).json({ success: false, message: 'Environment not found' });
      return;
    }

    if (!isValidDateString(startDate as string) || !isValidDateString(endDate as string)) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    const { sql: dateFilter, params } = buildDateFilter('ti.', startDate as string, endDate as string);

    const limitVal = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const sql = `
      SELECT
        td.name AS task_name,
        td.task_type,
        p.name AS project_name,
        pi2.name AS process_name,
        COUNT(*) AS fail_count,
        MAX(ti.start_time) AS last_fail_time
      FROM t_ds_task_instance ti
      LEFT JOIN t_ds_task_definition td ON ti.task_code = td.code
      LEFT JOIN t_ds_process_instance pi2 ON ti.process_instance_id = pi2.id
      LEFT JOIN t_ds_process_definition pd ON pi2.process_definition_code = pd.code
      LEFT JOIN t_ds_project p ON pd.project_code = p.code
      WHERE ti.state = 6 ${dateFilter}
      GROUP BY td.name, td.task_type, p.name, pi2.name
      ORDER BY fail_count DESC
      LIMIT ${limitVal}
    `;

    const data = await dbUtil.query(envId, envConfig, sql, params);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/dashboard/:envId', async (req: Request, res: Response) => {
  try {
    const envId = p(req.params.envId);
    const { startDate, endDate } = req.query;
    const envConfig = getEnvConfig(envId);
    if (!envConfig) {
      res.status(404).json({ success: false, message: 'Environment not found' });
      return;
    }

    if (!isValidDateString(startDate as string) || !isValidDateString(endDate as string)) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    const { sql: dateFilter, params } = buildDateFilter('', startDate as string, endDate as string);

    const summarySql = `
      SELECT
        COUNT(*) AS total_process_instances,
        SUM(CASE WHEN state = 7 THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN state = 6 THEN 1 ELSE 0 END) AS failure_count,
        SUM(CASE WHEN state = 13 THEN 1 ELSE 0 END) AS forced_success_count,
        SUM(CASE WHEN state = 1 THEN 1 ELSE 0 END) AS running_count,
        COUNT(DISTINCT process_definition_code) AS active_processes,
        COUNT(DISTINCT worker_group) AS active_worker_groups
      FROM t_ds_process_instance
      WHERE 1=1 ${dateFilter}
    `;

    const taskSummarySql = `
      SELECT
        COUNT(*) AS total_task_instances,
        SUM(CASE WHEN state = 7 THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN state = 6 THEN 1 ELSE 0 END) AS failure_count,
        COUNT(DISTINCT host) AS active_hosts,
        COUNT(DISTINCT task_code) AS active_tasks
      FROM t_ds_task_instance
      WHERE 1=1 ${dateFilter}
    `;

    const [processSummary, taskSummary] = await Promise.all([
      dbUtil.query(envId, envConfig, summarySql, params),
      dbUtil.query(envId, envConfig, taskSummarySql, params),
    ]);

    res.json({
      success: true,
      data: {
        processSummary: (processSummary as any[])[0] || {},
        taskSummary: (taskSummary as any[])[0] || {},
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/failure-trend/:envId', async (req: Request, res: Response) => {
  try {
    const envId = p(req.params.envId);
    const { startDate, endDate, level, dimension, projectId } = req.query;
    const envConfig = getEnvConfig(envId);
    if (!envConfig) {
      res.status(404).json({ success: false, message: 'Environment not found' });
      return;
    }
    if (!isValidDateString(startDate as string) || !isValidDateString(endDate as string)) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    const { sql: dateFilter, params } = buildDateFilter('', startDate as string, endDate as string);
    const lvl = p(level as string) || 'overall';
    const dim = p(dimension as string) || 'hour';

    let dateFormat: string;
    if (dim === 'day') {
      dateFormat = '%Y-%m-%d';
    } else if (dim === 'week') {
      dateFormat = '%x-W%v';
    } else if (dim === 'month') {
      dateFormat = '%Y-%m';
    } else {
      dateFormat = '%Y-%m-%d %H:00';
    }

    const projectParams: any[] = [];
    let projectFilter = '';
    if (projectId && /^\d+$/.test(projectId as string)) {
      projectFilter = 'AND p.id = ?';
      projectParams.push(Number(projectId));
    }

    const allParams = [...params, ...projectParams];
    let sql = '';

    if (lvl === 'overall') {
      sql = `
        SELECT DATE_FORMAT(pi.start_time, '${dateFormat}') AS run_date, '整体' AS group_name,
          COUNT(*) AS total_count,
          SUM(CASE WHEN pi.state = 6 THEN 1 ELSE 0 END) AS failure_count,
          SUM(CASE WHEN pi.state = 7 THEN 1 ELSE 0 END) AS success_count
        FROM t_ds_process_instance pi
        LEFT JOIN t_ds_process_definition pd ON pi.process_definition_code = pd.code
        LEFT JOIN t_ds_project p ON pd.project_code = p.code
        WHERE 1=1 ${dateFilter} ${projectFilter}
        GROUP BY DATE_FORMAT(pi.start_time, '${dateFormat}')
        ORDER BY run_date
      `;
    } else if (lvl === 'project') {
      sql = `
        SELECT DATE_FORMAT(pi.start_time, '${dateFormat}') AS run_date, p.name AS group_name,
          COUNT(*) AS total_count,
          SUM(CASE WHEN pi.state = 6 THEN 1 ELSE 0 END) AS failure_count,
          SUM(CASE WHEN pi.state = 7 THEN 1 ELSE 0 END) AS success_count
        FROM t_ds_process_instance pi
        LEFT JOIN t_ds_process_definition pd ON pi.process_definition_code = pd.code
        LEFT JOIN t_ds_project p ON pd.project_code = p.code
        WHERE 1=1 ${dateFilter} ${projectFilter}
        GROUP BY DATE_FORMAT(pi.start_time, '${dateFormat}'), p.name
        ORDER BY run_date, group_name
      `;
    } else if (lvl === 'process') {
      sql = `
        SELECT DATE_FORMAT(pi.start_time, '${dateFormat}') AS run_date, pd.name AS group_name,
          COUNT(*) AS total_count,
          SUM(CASE WHEN pi.state = 6 THEN 1 ELSE 0 END) AS failure_count,
          SUM(CASE WHEN pi.state = 7 THEN 1 ELSE 0 END) AS success_count
        FROM t_ds_process_instance pi
        LEFT JOIN t_ds_process_definition pd ON pi.process_definition_code = pd.code
        LEFT JOIN t_ds_project p ON pd.project_code = p.code
        WHERE 1=1 ${dateFilter} ${projectFilter}
        GROUP BY DATE_FORMAT(pi.start_time, '${dateFormat}'), pd.name
        ORDER BY run_date, group_name
      `;
    } else {
      sql = `
        SELECT DATE_FORMAT(ti.start_time, '${dateFormat}') AS run_date, td.name AS group_name,
          COUNT(*) AS total_count,
          SUM(CASE WHEN ti.state = 6 THEN 1 ELSE 0 END) AS failure_count,
          SUM(CASE WHEN ti.state = 7 THEN 1 ELSE 0 END) AS success_count
        FROM t_ds_task_instance ti
        LEFT JOIN t_ds_task_definition td ON ti.task_code = td.code
        LEFT JOIN t_ds_process_instance pi2 ON ti.process_instance_id = pi2.id
        LEFT JOIN t_ds_process_definition pd ON pi2.process_definition_code = pd.code
        LEFT JOIN t_ds_project p ON pd.project_code = p.code
        WHERE 1=1 ${dateFilter.replace(/start_time/g, 'ti.start_time')} ${projectFilter}
        GROUP BY DATE_FORMAT(ti.start_time, '${dateFormat}'), td.name
        ORDER BY run_date, group_name
      `;
    }

    const data = await dbUtil.query(envId, envConfig, sql, allParams);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/consecutive-failures/:envId', async (req: Request, res: Response) => {
  try {
    const envId = p(req.params.envId);
    const { startDate, endDate, minConsecutive, projectId } = req.query;
    const envConfig = getEnvConfig(envId);
    if (!envConfig) {
      res.status(404).json({ success: false, message: 'Environment not found' });
      return;
    }
    if (!isValidDateString(startDate as string) || !isValidDateString(endDate as string)) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    const { sql: dateFilter, params } = buildDateFilter('ti.', startDate as string, endDate as string);
    const minC = Math.max(Number(minConsecutive) || 2, 2);

    const projectParams: any[] = [];
    let projectFilter = '';
    if (projectId && /^\d+$/.test(projectId as string)) {
      projectFilter = 'AND p.id = ?';
      projectParams.push(Number(projectId));
    }

    const allParams = [...params, ...projectParams];

    const sql = `
      SELECT
        ranked.task_name,
        ranked.project_name,
        ranked.process_name,
        ranked.task_type,
        ranked.consecutive_fail_count,
        ranked.first_fail_time,
        ranked.last_fail_time,
        ranked.host AS last_fail_host,
        ranked.retry_times AS last_retry_times
      FROM (
        SELECT
          td.name AS task_name,
          p.name AS project_name,
          pi2.name AS process_name,
          td.task_type,
          ti.host,
          ti.retry_times,
          ROW_NUMBER() OVER (PARTITION BY td.name, p.name ORDER BY ti.start_time DESC) AS rn,
          COUNT(*) OVER (PARTITION BY td.name, p.name) AS consecutive_fail_count,
          MAX(ti.start_time) OVER (PARTITION BY td.name, p.name) AS last_fail_time,
          MIN(ti.start_time) OVER (PARTITION BY td.name, p.name) AS first_fail_time
        FROM t_ds_task_instance ti
        LEFT JOIN t_ds_task_definition td ON ti.task_code = td.code
        LEFT JOIN t_ds_process_instance pi2 ON ti.process_instance_id = pi2.id
        LEFT JOIN t_ds_process_definition pd ON pi2.process_definition_code = pd.code
        LEFT JOIN t_ds_project p ON pd.project_code = p.code
        WHERE ti.state = 6 ${dateFilter} ${projectFilter}
      ) ranked
      WHERE ranked.rn = 1 AND ranked.consecutive_fail_count >= ${minC}
      ORDER BY ranked.consecutive_fail_count DESC, ranked.last_fail_time DESC
      LIMIT 100
    `;

    const data = await dbUtil.query(envId, envConfig, sql, allParams);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/worker-load-trend/:envId', async (req: Request, res: Response) => {
  try {
    const envId = p(req.params.envId);
    const { startDate, endDate, projectId } = req.query;
    const envConfig = getEnvConfig(envId);
    if (!envConfig) {
      res.status(404).json({ success: false, message: 'Environment not found' });
      return;
    }
    if (!isValidDateString(startDate as string) || !isValidDateString(endDate as string)) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    const { sql: dateFilter, params } = buildDateFilter('ti.', startDate as string, endDate as string);

    const projectParams: any[] = [];
    let projectFilter = '';
    if (projectId && /^\d+$/.test(projectId as string)) {
      projectFilter = 'AND p.id = ?';
      projectParams.push(Number(projectId));
    }

    const allParams = [...params, ...projectParams];

    const sql = `
      SELECT
        DATE_FORMAT(ti.start_time, '%Y-%m-%d %H:%i') AS run_date,
        ti.worker_group,
        COUNT(*) AS task_count,
        SUM(CASE WHEN ti.state = 6 THEN 1 ELSE 0 END) AS failure_count,
        SUM(CASE WHEN ti.state = 7 THEN 1 ELSE 0 END) AS success_count,
        ROUND(AVG(TIMESTAMPDIFF(SECOND, ti.start_time, ti.end_time)), 2) AS avg_duration_sec
      FROM t_ds_task_instance ti
      LEFT JOIN t_ds_process_instance pi2 ON ti.process_instance_id = pi2.id
      LEFT JOIN t_ds_process_definition pd ON pi2.process_definition_code = pd.code
      LEFT JOIN t_ds_project p ON pd.project_code = p.code
      WHERE ti.worker_group IS NOT NULL AND ti.worker_group != '' ${dateFilter} ${projectFilter}
      GROUP BY DATE_FORMAT(ti.start_time, '%Y-%m-%d %H:%i'), ti.worker_group
      ORDER BY run_date, ti.worker_group
    `;

    const data = await dbUtil.query(envId, envConfig, sql, allParams);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/host-concurrent-trend/:envId', async (req: Request, res: Response) => {
  try {
    const envId = p(req.params.envId);
    const { startDate, endDate, projectId } = req.query;
    const envConfig = getEnvConfig(envId);
    if (!envConfig) {
      res.status(404).json({ success: false, message: 'Environment not found' });
      return;
    }
    if (!isValidDateString(startDate as string) || !isValidDateString(endDate as string)) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    const { sql: dateFilter, params } = buildDateFilter('ti.', startDate as string, endDate as string);

    const projectParams: any[] = [];
    let projectFilter = '';
    if (projectId && /^\d+$/.test(projectId as string)) {
      projectFilter = 'AND p.id = ?';
      projectParams.push(Number(projectId));
    }

    const allParams = [...params, ...projectParams];

    const sql = `
      SELECT
        DATE_FORMAT(ti.start_time, '%Y-%m-%d %H:%i') AS run_date,
        ti.host,
        COUNT(*) AS task_count,
        SUM(CASE WHEN ti.state = 1 THEN 1 ELSE 0 END) AS running_count,
        SUM(CASE WHEN ti.state = 6 THEN 1 ELSE 0 END) AS failure_count,
        SUM(CASE WHEN ti.state = 7 THEN 1 ELSE 0 END) AS success_count,
        ROUND(AVG(TIMESTAMPDIFF(SECOND, ti.start_time, ti.end_time)), 2) AS avg_duration_sec
      FROM t_ds_task_instance ti
      LEFT JOIN t_ds_process_instance pi2 ON ti.process_instance_id = pi2.id
      LEFT JOIN t_ds_process_definition pd ON pi2.process_definition_code = pd.code
      LEFT JOIN t_ds_project p ON pd.project_code = p.code
      WHERE ti.host IS NOT NULL AND ti.host != '' ${dateFilter} ${projectFilter}
      GROUP BY DATE_FORMAT(ti.start_time, '%Y-%m-%d %H:%i'), ti.host
      ORDER BY run_date,
        INET_ATON(SUBSTRING_INDEX(ti.host, ':', 1)) ASC,
        CAST(SUBSTRING_INDEX(ti.host, ':', -1) AS UNSIGNED) ASC
    `;

    const data = await dbUtil.query(envId, envConfig, sql, allParams);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
