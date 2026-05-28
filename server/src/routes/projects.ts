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

router.get('/overview/:envId', async (req: Request, res: Response) => {
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

    const params: any[] = [];
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = 'AND pi.start_time BETWEEN ? AND ?';
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    let projectFilter = '';
    if (projectId && /^\d+$/.test(projectId as string)) {
      projectFilter = 'AND p.id = ?';
      params.push(Number(projectId));
    }

    const projectStatsSql = `
      SELECT
        p.id AS project_id,
        p.name AS project_name,
        COUNT(DISTINCT pi.id) AS total_instances,
        SUM(CASE WHEN pi.state = 7 THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN pi.state = 6 THEN 1 ELSE 0 END) AS failure_count,
        SUM(CASE WHEN pi.state = 0 THEN 1 ELSE 0 END) AS submitted_count,
        SUM(CASE WHEN pi.state = 1 THEN 1 ELSE 0 END) AS running_count,
        SUM(CASE WHEN pi.state = 4 THEN 1 ELSE 0 END) AS ready_pause_count,
        SUM(CASE WHEN pi.state = 5 THEN 1 ELSE 0 END) AS pause_count,
        SUM(CASE WHEN pi.state = 3 THEN 1 ELSE 0 END) AS ready_stop_count,
        SUM(CASE WHEN pi.state = 8 THEN 1 ELSE 0 END) AS stop_count,
        SUM(CASE WHEN pi.state = 9 THEN 1 ELSE 0 END) AS wait_thread_count,
        SUM(CASE WHEN pi.state = 10 THEN 1 ELSE 0 END) AS wait_depend_count,
        SUM(CASE WHEN pi.state = 12 THEN 1 ELSE 0 END) AS delay_count,
        SUM(CASE WHEN pi.state = 13 THEN 1 ELSE 0 END) AS forced_success_count,
        ROUND(
          CASE WHEN COUNT(DISTINCT pi.id) > 0
            THEN SUM(CASE WHEN pi.state IN (7, 13) THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT pi.id)
            ELSE 0 END, 2
        ) AS success_rate
      FROM t_ds_project p
      LEFT JOIN t_ds_process_definition pd ON p.code = pd.project_code
      LEFT JOIN t_ds_process_instance pi ON pd.code = pi.process_definition_code
      WHERE 1=1 ${dateFilter} ${projectFilter}
      GROUP BY p.id, p.name
      ORDER BY total_instances DESC
    `;

    const projectStats = await dbUtil.query(envId, envConfig, projectStatsSql, params);

    const totalParams: any[] = [];
    let totalDateFilter = '';
    if (startDate && endDate) {
      totalDateFilter = 'AND start_time BETWEEN ? AND ?';
      totalParams.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    let totalProjectFilter = '';
    if (projectId && /^\d+$/.test(projectId as string)) {
      totalProjectFilter = `AND process_definition_code IN (SELECT code FROM t_ds_process_definition WHERE project_code = (SELECT code FROM t_ds_project WHERE id = ?))`;
      totalParams.push(Number(projectId));
    }

    const totalSql = `
      SELECT
        COUNT(*) AS total_instances,
        SUM(CASE WHEN state = 7 THEN 1 ELSE 0 END) AS total_success,
        SUM(CASE WHEN state = 6 THEN 1 ELSE 0 END) AS total_failure,
        SUM(CASE WHEN state = 13 THEN 1 ELSE 0 END) AS total_forced_success,
        ROUND(
          CASE WHEN COUNT(*) > 0
            THEN SUM(CASE WHEN state IN (7, 13) THEN 1 ELSE 0 END) * 100.0 / COUNT(*)
            ELSE 0 END, 2
        ) AS overall_success_rate
      FROM t_ds_process_instance
      WHERE 1=1 ${totalDateFilter} ${totalProjectFilter}
    `;

    const totalStats = await dbUtil.query(envId, envConfig, totalSql, totalParams);

    res.json({
      success: true,
      data: {
        projects: projectStats,
        summary: totalStats[0] || {},
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/task-stats/:envId', async (req: Request, res: Response) => {
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

    const params: any[] = [];
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = 'AND ti.start_time BETWEEN ? AND ?';
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    let projectFilter = '';
    if (projectId && /^\d+$/.test(projectId as string)) {
      projectFilter = 'AND p.id = ?';
      params.push(Number(projectId));
    }

    const taskStatsSql = `
      SELECT
        p.name AS project_name,
        td.name AS task_name,
        td.task_type,
        COUNT(*) AS total_count,
        SUM(CASE WHEN ti.state = 7 THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN ti.state = 6 THEN 1 ELSE 0 END) AS failure_count,
        SUM(CASE WHEN ti.state = 13 THEN 1 ELSE 0 END) AS forced_success_count,
        ROUND(
          CASE WHEN COUNT(*) > 0
            THEN SUM(CASE WHEN ti.state IN (7, 13) THEN 1 ELSE 0 END) * 100.0 / COUNT(*)
            ELSE 0 END, 2
        ) AS success_rate,
        ROUND(AVG(TIMESTAMPDIFF(SECOND, ti.start_time, ti.end_time)), 2) AS avg_duration_sec,
        ROUND(MIN(TIMESTAMPDIFF(SECOND, ti.start_time, ti.end_time)), 2) AS min_duration_sec,
        ROUND(MAX(TIMESTAMPDIFF(SECOND, ti.start_time, ti.end_time)), 2) AS max_duration_sec
      FROM t_ds_task_instance ti
      LEFT JOIN t_ds_task_definition td ON ti.task_code = td.code
      LEFT JOIN t_ds_process_instance pi2 ON ti.process_instance_id = pi2.id
      LEFT JOIN t_ds_process_definition pd ON pi2.process_definition_code = pd.code
      LEFT JOIN t_ds_project p ON pd.project_code = p.code
      WHERE 1=1 ${dateFilter} ${projectFilter}
      GROUP BY p.name, td.name, td.task_type
      ORDER BY success_rate ASC, avg_duration_sec DESC
    `;

    const taskStats = await dbUtil.query(envId, envConfig, taskStatsSql, params);

    res.json({
      success: true,
      data: taskStats,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/task-trend/:envId', async (req: Request, res: Response) => {
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

    const params: any[] = [];
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = 'AND pi.start_time BETWEEN ? AND ?';
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    let projectFilter = '';
    if (projectId && /^\d+$/.test(projectId as string)) {
      projectFilter = 'AND p.id = ?';
      params.push(Number(projectId));
    }

    const trendSql = `
      SELECT
        DATE(pi.start_time) AS run_date,
        COUNT(*) AS total_count,
        SUM(CASE WHEN pi.state = 7 THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN pi.state = 6 THEN 1 ELSE 0 END) AS failure_count,
        SUM(CASE WHEN pi.state = 13 THEN 1 ELSE 0 END) AS forced_success_count
      FROM t_ds_process_instance pi
      LEFT JOIN t_ds_process_definition pd ON pi.process_definition_code = pd.code
      LEFT JOIN t_ds_project p ON pd.project_code = p.code
      WHERE 1=1 ${dateFilter} ${projectFilter}
      GROUP BY DATE(pi.start_time)
      ORDER BY run_date
    `;

    const trend = await dbUtil.query(envId, envConfig, trendSql, params);

    res.json({
      success: true,
      data: trend,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/list/:envId', async (req: Request, res: Response) => {
  try {
    const envId = p(req.params.envId);
    const envConfig = getEnvConfig(envId);
    if (!envConfig) {
      res.status(404).json({ success: false, message: 'Environment not found' });
      return;
    }

    const sql = `SELECT id, name FROM t_ds_project ORDER BY name`;
    const projects = await dbUtil.query(envId, envConfig, sql, []);

    res.json({
      success: true,
      data: projects,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/timeline/:envId', async (req: Request, res: Response) => {
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

    if (!projectId || !/^\d+$/.test(projectId as string)) {
      res.status(400).json({ success: false, message: 'projectId is required' });
      return;
    }

    const params: any[] = [];
    params.push(Number(projectId));
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = 'AND ti.start_time BETWEEN ? AND ?';
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    const sql = `
      SELECT
        ti.id AS task_instance_id,
        td.name AS task_name,
        td.task_type,
        pi.name AS process_name,
        ti.state,
        ti.start_time,
        ti.end_time,
        ti.host,
        ti.retry_times,
        CASE ti.state
          WHEN 0 THEN 'submitted'
          WHEN 1 THEN 'running'
          WHEN 2 THEN 'ready_pause'
          WHEN 3 THEN 'ready_stop'
          WHEN 4 THEN 'paused'
          WHEN 5 THEN 'stopped'
          WHEN 6 THEN 'failure'
          WHEN 7 THEN 'success'
          WHEN 8 THEN 'need_fault_tolerance'
          WHEN 9 THEN 'kill'
          WHEN 10 THEN 'wait_depend'
          WHEN 11 THEN 'wait_thread'
          WHEN 12 THEN 'delay'
          WHEN 13 THEN 'forced_success'
          ELSE 'unknown'
        END AS state_label,
        CASE
          WHEN ti.start_time IS NOT NULL AND ti.end_time IS NOT NULL
          THEN TIMESTAMPDIFF(SECOND, ti.start_time, ti.end_time)
          ELSE NULL
        END AS duration_sec
      FROM t_ds_task_instance ti
      LEFT JOIN t_ds_task_definition td ON ti.task_code = td.code
      LEFT JOIN t_ds_process_instance pi ON ti.process_instance_id = pi.id
      LEFT JOIN t_ds_process_definition pd ON pi.process_definition_code = pd.code
      LEFT JOIN t_ds_project p ON pd.project_code = p.code
      WHERE p.id = ? ${dateFilter}
      ORDER BY ti.start_time ASC
      LIMIT 2000
    `;

    const data = await dbUtil.query(envId, envConfig, sql, params);

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/process-list/:envId', async (req: Request, res: Response) => {
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

    if (!projectId || !/^\d+$/.test(projectId as string)) {
      res.status(400).json({ success: false, message: 'projectId is required' });
      return;
    }

    const params: any[] = [];
    params.push(Number(projectId));
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = 'AND pi.start_time BETWEEN ? AND ?';
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    const sql = `
      SELECT
        pd.code AS process_code,
        pd.name AS process_name,
        COUNT(pi.id) AS total_instances,
        SUM(CASE WHEN pi.state = 7 THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN pi.state = 6 THEN 1 ELSE 0 END) AS failure_count,
        SUM(CASE WHEN pi.state = 13 THEN 1 ELSE 0 END) AS forced_success_count,
        SUM(CASE WHEN pi.state = 1 THEN 1 ELSE 0 END) AS running_count,
        ROUND(
          SUM(CASE WHEN pi.state IN (7, 13) THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(pi.id), 0), 2
        ) AS success_rate,
        ROUND(AVG(CASE WHEN pi.state = 7 THEN TIMESTAMPDIFF(SECOND, pi.start_time, pi.end_time) END), 2) AS avg_duration_sec,
        MAX(pi.start_time) AS last_run_time
      FROM t_ds_process_instance pi
      LEFT JOIN t_ds_process_definition pd ON pi.process_definition_code = pd.code
      LEFT JOIN t_ds_project p ON pd.project_code = p.code
      WHERE p.id = ? ${dateFilter}
      GROUP BY pd.code, pd.name
      ORDER BY success_rate ASC, avg_duration_sec DESC
    `;

    const data = await dbUtil.query(envId, envConfig, sql, params);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/process-detail/:envId', async (req: Request, res: Response) => {
  try {
    const envId = p(req.params.envId);
    const { startDate, endDate, processCode } = req.query;
    const envConfig = getEnvConfig(envId);
    if (!envConfig) {
      res.status(404).json({ success: false, message: 'Environment not found' });
      return;
    }

    if (!isValidDateString(startDate as string) || !isValidDateString(endDate as string)) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    if (!processCode || !/^\d+$/.test(processCode as string)) {
      res.status(400).json({ success: false, message: 'processCode is required' });
      return;
    }

    const params: any[] = [];
    params.push(String(processCode));
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = 'AND pi.start_time BETWEEN ? AND ?';
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    const processSummarySql = `
      SELECT
        COUNT(pi.id) AS total_instances,
        SUM(CASE WHEN pi.state = 7 THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN pi.state = 6 THEN 1 ELSE 0 END) AS failure_count,
        SUM(CASE WHEN pi.state = 13 THEN 1 ELSE 0 END) AS forced_success_count,
        SUM(CASE WHEN pi.state = 1 THEN 1 ELSE 0 END) AS running_count,
        ROUND(
          SUM(CASE WHEN pi.state IN (7, 13) THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(pi.id), 0), 2
        ) AS success_rate,
        ROUND(AVG(CASE WHEN pi.state = 7 THEN TIMESTAMPDIFF(SECOND, pi.start_time, pi.end_time) END), 2) AS avg_duration_sec,
        MAX(pi.start_time) AS last_run_time
      FROM t_ds_process_instance pi
      WHERE pi.process_definition_code = ? ${dateFilter}
    `;

    const taskDetailSql = `
      SELECT
        td.name AS task_name,
        td.task_type,
        COUNT(ti.id) AS total_count,
        SUM(CASE WHEN ti.state = 7 THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN ti.state = 6 THEN 1 ELSE 0 END) AS failure_count,
        SUM(CASE WHEN ti.state = 13 THEN 1 ELSE 0 END) AS forced_success_count,
        ROUND(
          SUM(CASE WHEN ti.state IN (7, 13) THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(ti.id), 0), 2
        ) AS success_rate,
        ROUND(AVG(CASE WHEN ti.state = 7 THEN TIMESTAMPDIFF(SECOND, ti.start_time, ti.end_time) END), 2) AS avg_duration_sec,
        MAX(ti.start_time) AS last_run_time,
        MAX(CASE WHEN ti.state = 6 THEN ti.start_time END) AS last_fail_time
      FROM t_ds_task_instance ti
      LEFT JOIN t_ds_task_definition td ON ti.task_code = td.code
      LEFT JOIN t_ds_process_instance pi ON ti.process_instance_id = pi.id
      WHERE pi.process_definition_code = ? ${dateFilter}
      GROUP BY td.name, td.task_type
      ORDER BY success_rate ASC, avg_duration_sec DESC
    `;

    const [processSummary, taskDetail] = await Promise.all([
      dbUtil.query(envId, envConfig, processSummarySql, params),
      dbUtil.query(envId, envConfig, taskDetailSql, params),
    ]);

    res.json({
      success: true,
      data: {
        summary: (processSummary as any[])[0] || {},
        tasks: taskDetail,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
