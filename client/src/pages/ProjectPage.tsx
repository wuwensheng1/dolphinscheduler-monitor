import React, { useEffect, useState, useMemo } from 'react';
import { Table, Card, Row, Col, Statistic, DatePicker, Select, Tag, Spin, message, Badge, Space, Breadcrumb, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, SyncOutlined, ThunderboltOutlined, FieldTimeOutlined, ArrowLeftOutlined, RightOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { projectApi } from '../services/api';
import { useOutletContext } from 'react-router-dom';
import { AppContextType } from '../layouts/AppLayout';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const stateConfig: Record<string, { color: string; label: string }> = {
  success: { color: '#52c41a', label: '成功' },
  failure: { color: '#ff4d4f', label: '失败' },
  forced_success: { color: '#faad14', label: '强制成功' },
  running: { color: '#1890ff', label: '运行中' },
  submitted: { color: '#d9d9d9', label: '已提交' },
  stopped: { color: '#8c8c8c', label: '已停止' },
  paused: { color: '#bfbfbf', label: '已暂停' },
  kill: { color: '#eb2f96', label: '已Kill' },
  wait_depend: { color: '#13c2c2', label: '等待依赖' },
  wait_thread: { color: '#2f54eb', label: '等待线程' },
  delay: { color: '#fa8c16', label: '延迟' },
  unknown: { color: '#8c8c8c', label: '未知' },
};

type DrillLevel = 'platform' | 'project' | 'process';

const ProjectPage: React.FC = () => {
  const { currentEnv, setCurrentEnv } = useOutletContext<AppContextType>();
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [taskStats, setTaskStats] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([dayjs().subtract(1, 'day'), dayjs()]);
  const [selectedProject, setSelectedProject] = useState<string | undefined>();
  const [projectList, setProjectList] = useState<any[]>([]);

  const [drillLevel, setDrillLevel] = useState<DrillLevel>('platform');
  const [drillProjectId, setDrillProjectId] = useState<string>('');
  const [drillProjectName, setDrillProjectName] = useState<string>('');
  const [drillProcessCode, setDrillProcessCode] = useState<string>('');
  const [drillProcessName, setDrillProcessName] = useState<string>('');
  const [processList, setProcessList] = useState<any[]>([]);
  const [processDetail, setProcessDetail] = useState<any[]>([]);
  const [processSummary, setProcessSummary] = useState<any>(null);
  const [processLoading, setProcessLoading] = useState(false);

  useEffect(() => {
    if (currentEnv) {
      projectApi.list(currentEnv).then(data => {
        setProjectList(data);
      }).catch(() => {
        setProjectList([]);
      });
    }
  }, [currentEnv]);

  useEffect(() => {
    if (currentEnv) fetchData();
  }, [currentEnv, dateRange, selectedProject]);

  useEffect(() => {
    if (currentEnv && selectedProject) fetchTimeline();
    else setTimelineData([]);
  }, [currentEnv, selectedProject, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      if (selectedProject) params.projectId = selectedProject;

      const [overviewData, taskData, trendData] = await Promise.all([
        projectApi.overview(currentEnv, params),
        projectApi.taskStats(currentEnv, params),
        projectApi.taskTrend(currentEnv, params),
      ]);
      setOverview(overviewData);
      setTaskStats(taskData);
      setTrend(trendData);
    } catch (e: any) {
      message.error('加载数据失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    if (!selectedProject) return;
    setTimelineLoading(true);
    try {
      const params: any = { projectId: selectedProject };
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const data = await projectApi.timeline(currentEnv, params);
      setTimelineData(data);
    } catch (e: any) {
      message.error('加载时间线数据失败: ' + e.message);
    } finally {
      setTimelineLoading(false);
    }
  };

  const fetchProcessList = async (projectId: string) => {
    setProcessLoading(true);
    try {
      const params: any = { projectId };
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const data = await projectApi.processList(currentEnv, params);
      setProcessList(data);
    } catch (e: any) {
      message.error('加载流程列表失败: ' + e.message);
    } finally {
      setProcessLoading(false);
    }
  };

  const fetchProcessDetail = async (processCode: string) => {
    setProcessLoading(true);
    try {
      const params: any = { processCode };
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const data = await projectApi.processDetail(currentEnv, params);
      setProcessDetail(data.tasks || []);
      setProcessSummary(data.summary || null);
    } catch (e: any) {
      message.error('加载流程详情失败: ' + e.message);
    } finally {
      setProcessLoading(false);
    }
  };

  const handleDrillToProject = (projectId: string, projectName: string) => {
    setDrillLevel('project');
    setDrillProjectId(projectId);
    setDrillProjectName(projectName);
    setSelectedProject(projectId);
    fetchProcessList(projectId);
  };

  const handleDrillToProcess = (processCode: string, processName: string) => {
    setDrillLevel('process');
    setDrillProcessCode(processCode);
    setDrillProcessName(processName);
    fetchProcessDetail(processCode);
  };

  const handleBack = () => {
    if (drillLevel === 'process') {
      setDrillLevel('project');
      setDrillProcessCode('');
      setDrillProcessName('');
    } else if (drillLevel === 'project') {
      setDrillLevel('platform');
      setDrillProjectId('');
      setDrillProjectName('');
      setSelectedProject(undefined);
    }
  };

  const handleBreadcrumbClick = (level: DrillLevel) => {
    if (level === drillLevel) return;
    if (level === 'platform') {
      setDrillLevel('platform');
      setDrillProjectId('');
      setDrillProjectName('');
      setDrillProcessCode('');
      setDrillProcessName('');
      setSelectedProject(undefined);
    } else if (level === 'project') {
      setDrillLevel('project');
      setDrillProcessCode('');
      setDrillProcessName('');
      setSelectedProject(drillProjectId);
    }
  };

  const timelineChartOption = useMemo(() => {
    if (timelineData.length === 0) return {};

    const taskNames = [...new Set(timelineData.map((t: any) => t.task_name))];
    const failureOnly = timelineData.filter((t: any) => t.state === 6);
    const successData = timelineData.filter((t: any) => t.state === 7);
    const forcedSuccessData = timelineData.filter((t: any) => t.state === 13);
    const otherData = timelineData.filter((t: any) => t.state !== 6 && t.state !== 7 && t.state !== 13);

    const buildSeriesData = (items: any[], color: string, opacity: number) =>
      items
        .filter((t: any) => t.start_time && t.end_time)
        .map((t: any) => ({
          value: [
            taskNames.indexOf(t.task_name),
            new Date(t.start_time).getTime(),
            new Date(t.end_time).getTime(),
            t.duration_sec,
            t.state_label,
            t.process_name,
            t.host,
          ],
          itemStyle: { color, opacity },
        }));

    return {
      tooltip: {
        formatter: (params: any) => {
          const d = params.value;
          const start = dayjs(d[1]).format('YYYY-MM-DD HH:mm:ss');
          const end = dayjs(d[2]).format('YYYY-MM-DD HH:mm:ss');
          const dur = d[3] != null ? `${Number(d[3]).toFixed(0)}秒` : '-';
          return `<div style="font-size:12px">
            <b>${taskNames[d[0]]}</b><br/>
            状态: <span style="color:${params.color}">${d[4]}</span><br/>
            流程: ${d[5] || '-'}<br/>
            开始: ${start}<br/>
            结束: ${end}<br/>
            耗时: ${dur}<br/>
            主机: ${d[6] || '-'}
          </div>`;
        },
      },
      grid: { left: '15%', right: '4%', top: 30, bottom: 80, containLabel: false },
      xAxis: {
        type: 'time',
        axisLabel: {
          fontSize: 11,
          formatter: (value: number) => {
            const d = dayjs(value);
            return d.format('MM/DD') + '\n' + d.format('HH:mm');
          },
          interval: 0,
          rotate: 0,
          lineHeight: 18,
        },
        splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.3 } },
      },
      yAxis: {
        type: 'category',
        data: taskNames,
        inverse: true,
        axisLabel: { fontSize: 11, width: 120, overflow: 'truncate' },
        splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.3 } },
      },
      series: [
        {
          type: 'custom',
          renderItem: (params: any, api: any) => {
            const categoryIndex = api.value!(0);
            const start = api.coord!([api.value!(1), categoryIndex]);
            const end = api.coord!([api.value!(2), categoryIndex]);
            const height = api.size!([0, 1])[1] * 0.5;
            const rectShape = {
              x: start[0],
              y: start[1] - height / 2,
              width: Math.max(end[0] - start[0], 2),
              height,
            };
            return {
              type: 'rect',
              transition: ['shape'],
              shape: rectShape,
              style: api.style!(),
            };
          },
          encode: { x: [1, 2], y: 0 },
          data: [
            ...buildSeriesData(otherData, '#8c8c8c', 0.4),
            ...buildSeriesData(successData, '#52c41a', 0.7),
            ...buildSeriesData(forcedSuccessData, '#faad14', 0.7),
            ...buildSeriesData(failureOnly, '#ff4d4f', 1),
          ],
        },
      ],
      dataZoom: [
        { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
        {
          type: 'slider',
          xAxisIndex: 0,
          filterMode: 'none',
          height: 24,
          bottom: 10,
          borderColor: 'transparent',
          backgroundColor: 'rgba(0,0,0,0.04)',
          fillerColor: 'rgba(24,144,255,0.15)',
          handleStyle: { color: '#1890ff', borderColor: '#1890ff' },
          textStyle: { fontSize: 11 },
          labelFormatter: (value: number) => dayjs(value).format('MM/DD HH:mm'),
        },
      ],
    };
  }, [timelineData]);

  const timelineSummary = useMemo(() => {
    if (timelineData.length === 0) return null;
    const total = timelineData.length;
    const success = timelineData.filter((t: any) => t.state === 7).length;
    const failure = timelineData.filter((t: any) => t.state === 6).length;
    const forced = timelineData.filter((t: any) => t.state === 13).length;
    const running = timelineData.filter((t: any) => t.state === 1).length;
    return { total, success, failure, forced, running };
  }, [timelineData]);

  const trendChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['总执行数', '成功数', '失败数'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
    xAxis: { type: 'category', data: trend.map((t: any) => t.run_date) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '总执行数',
        type: 'bar',
        data: trend.map((t: any) => Number(t.total_count)),
        itemStyle: { color: '#1890ff', borderRadius: [2, 2, 0, 0] },
      },
      {
        name: '成功数',
        type: 'bar',
        data: trend.map((t: any) => Number(t.success_count)),
        itemStyle: { color: '#52c41a', borderRadius: [2, 2, 0, 0] },
      },
      {
        name: '失败数',
        type: 'bar',
        data: trend.map((t: any) => Number(t.failure_count)),
        itemStyle: { color: '#ff4d4f', borderRadius: [2, 2, 0, 0] },
      },
    ],
  };

  const projectColumns = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text: string, record: any) => (
        <a onClick={() => handleDrillToProject(String(record.project_id), text)} style={{ fontWeight: 600 }}>
          {text} <RightOutlined style={{ fontSize: 10 }} />
        </a>
      ),
    },
    {
      title: '总实例数',
      dataIndex: 'total_instances',
      key: 'total_instances',
      sorter: (a: any, b: any) => Number(a.total_instances) - Number(b.total_instances),
    },
    {
      title: '成功数',
      dataIndex: 'success_count',
      key: 'success_count',
      render: (v: any) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '失败数',
      dataIndex: 'failure_count',
      key: 'failure_count',
      render: (v: any) => <span style={{ color: '#ff4d4f', fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '强制成功数',
      dataIndex: 'forced_success_count',
      key: 'forced_success_count',
      render: (v: any) => <span style={{ color: '#faad14' }}>{v}</span>,
    },
    {
      title: '成功率',
      dataIndex: 'success_rate',
      key: 'success_rate',
      defaultSortOrder: 'ascend' as const,
      sorter: (a: any, b: any) => Number(a.success_rate) - Number(b.success_rate),
      render: (v: any) => {
        const n = Number(v);
        const color = n >= 95 ? '#52c41a' : n >= 80 ? '#faad14' : '#ff4d4f';
        return <span style={{ color, fontWeight: 600 }}>{n}%</span>;
      },
    },
  ];

  const taskColumns = [
    {
      title: '项目',
      dataIndex: 'project_name',
      key: 'project_name',
      ellipsis: true,
    },
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
      ellipsis: true,
    },
    {
      title: '任务类型',
      dataIndex: 'task_type',
      key: 'task_type',
      width: 100,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '调用次数',
      dataIndex: 'total_count',
      key: 'total_count',
      width: 100,
      sorter: (a: any, b: any) => Number(a.total_count) - Number(b.total_count),
    },
    {
      title: '成功',
      dataIndex: 'success_count',
      key: 'success_count',
      width: 80,
      render: (v: any) => <span style={{ color: '#52c41a' }}>{v}</span>,
    },
    {
      title: '失败',
      dataIndex: 'failure_count',
      key: 'failure_count',
      width: 80,
      render: (v: any) => <span style={{ color: '#ff4d4f' }}>{v}</span>,
    },
    {
      title: '成功率',
      dataIndex: 'success_rate',
      key: 'success_rate',
      width: 100,
      defaultSortOrder: 'ascend' as const,
      sorter: (a: any, b: any) => Number(a.success_rate) - Number(b.success_rate),
      render: (v: any) => {
        const n = Number(v);
        const color = n >= 95 ? '#52c41a' : n >= 80 ? '#faad14' : '#ff4d4f';
        return <span style={{ color, fontWeight: 600 }}>{n}%</span>;
      },
    },
    {
      title: '平均耗时(秒)',
      dataIndex: 'avg_duration_sec',
      key: 'avg_duration_sec',
      width: 120,
      defaultSortOrder: 'descend' as const,
      sorter: (a: any, b: any) => (Number(a.avg_duration_sec) || 0) - (Number(b.avg_duration_sec) || 0),
      render: (v: any) => {
        const n = Number(v || 0);
        const color = n > 300 ? '#ff4d4f' : n > 60 ? '#faad14' : '#52c41a';
        return <span style={{ color, fontWeight: 500 }}>{v != null ? n.toFixed(1) : '-'}</span>;
      },
    },
  ];

  const processColumns = [
    {
      title: '流程名称',
      dataIndex: 'process_name',
      key: 'process_name',
      render: (text: string, record: any) => (
        <a onClick={() => handleDrillToProcess(String(record.process_code), text)} style={{ fontWeight: 500 }}>
          {text} <RightOutlined style={{ fontSize: 10 }} />
        </a>
      ),
      ellipsis: true,
    },
    {
      title: '总实例数',
      dataIndex: 'total_instances',
      key: 'total_instances',
      width: 100,
      sorter: (a: any, b: any) => Number(a.total_instances) - Number(b.total_instances),
    },
    {
      title: '成功数',
      dataIndex: 'success_count',
      key: 'success_count',
      width: 80,
      render: (v: any) => <span style={{ color: '#52c41a' }}>{v}</span>,
    },
    {
      title: '失败数',
      dataIndex: 'failure_count',
      key: 'failure_count',
      width: 80,
      render: (v: any) => <span style={{ color: '#ff4d4f', fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '强制成功',
      dataIndex: 'forced_success_count',
      key: 'forced_success_count',
      width: 90,
      render: (v: any) => <span style={{ color: '#faad14' }}>{v}</span>,
    },
    {
      title: '运行中',
      dataIndex: 'running_count',
      key: 'running_count',
      width: 80,
      render: (v: any) => Number(v) > 0 ? <span style={{ color: '#1890ff' }}>{v}</span> : v,
    },
    {
      title: '成功率',
      dataIndex: 'success_rate',
      key: 'success_rate',
      width: 100,
      defaultSortOrder: 'ascend' as const,
      sorter: (a: any, b: any) => Number(a.success_rate) - Number(b.success_rate),
      render: (v: any) => {
        if (v == null) return '-';
        const n = Number(v);
        const color = n >= 95 ? '#52c41a' : n >= 80 ? '#faad14' : '#ff4d4f';
        return <span style={{ color, fontWeight: 600 }}>{n}%</span>;
      },
    },
    {
      title: '平均耗时(秒)',
      dataIndex: 'avg_duration_sec',
      key: 'avg_duration_sec',
      width: 120,
      sorter: (a: any, b: any) => (Number(a.avg_duration_sec) || 0) - (Number(b.avg_duration_sec) || 0),
      render: (v: any) => {
        if (v == null) return '-';
        const n = Number(v);
        const color = n > 300 ? '#ff4d4f' : n > 60 ? '#faad14' : '#52c41a';
        return <span style={{ color, fontWeight: 500 }}>{n.toFixed(1)}</span>;
      },
    },
    {
      title: '最近运行',
      dataIndex: 'last_run_time',
      key: 'last_run_time',
      width: 170,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
  ];

  const processDetailColumns = [
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
      ellipsis: true,
    },
    {
      title: '任务类型',
      dataIndex: 'task_type',
      key: 'task_type',
      width: 100,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '调用次数',
      dataIndex: 'total_count',
      key: 'total_count',
      width: 100,
      sorter: (a: any, b: any) => Number(a.total_count) - Number(b.total_count),
    },
    {
      title: '成功',
      dataIndex: 'success_count',
      key: 'success_count',
      width: 80,
      render: (v: any) => <span style={{ color: '#52c41a' }}>{v}</span>,
    },
    {
      title: '失败',
      dataIndex: 'failure_count',
      key: 'failure_count',
      width: 80,
      render: (v: any) => <span style={{ color: '#ff4d4f', fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '成功率',
      dataIndex: 'success_rate',
      key: 'success_rate',
      width: 100,
      defaultSortOrder: 'ascend' as const,
      sorter: (a: any, b: any) => Number(a.success_rate) - Number(b.success_rate),
      render: (v: any) => {
        if (v == null) return '-';
        const n = Number(v);
        const color = n >= 95 ? '#52c41a' : n >= 80 ? '#faad14' : '#ff4d4f';
        return <span style={{ color, fontWeight: 600 }}>{n}%</span>;
      },
    },
    {
      title: '平均耗时(秒)',
      dataIndex: 'avg_duration_sec',
      key: 'avg_duration_sec',
      width: 120,
      sorter: (a: any, b: any) => (Number(a.avg_duration_sec) || 0) - (Number(b.avg_duration_sec) || 0),
      render: (v: any) => {
        if (v == null) return '-';
        const n = Number(v);
        const color = n > 300 ? '#ff4d4f' : n > 60 ? '#faad14' : '#52c41a';
        return <span style={{ color, fontWeight: 500 }}>{n.toFixed(1)}</span>;
      },
    },
    {
      title: '最近运行',
      dataIndex: 'last_run_time',
      key: 'last_run_time',
      width: 170,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '最近失败',
      dataIndex: 'last_fail_time',
      key: 'last_fail_time',
      width: 170,
      render: (v: string) => v ? <span style={{ color: '#ff4d4f' }}>{dayjs(v).format('YYYY-MM-DD HH:mm:ss')}</span> : '-',
    },
  ];

  const timelineDetailColumns = [
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
      ellipsis: true,
    },
    {
      title: '流程',
      dataIndex: 'process_name',
      key: 'process_name',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'state_label',
      key: 'state_label',
      width: 100,
      render: (label: string) => {
        const cfg = stateConfig[label] || stateConfig.unknown;
        return <Badge color={cfg.color} text={<span style={{ color: cfg.color, fontWeight: 500 }}>{cfg.label}</span>} />;
      },
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 170,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '结束时间',
      dataIndex: 'end_time',
      key: 'end_time',
      width: 170,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '耗时(秒)',
      dataIndex: 'duration_sec',
      key: 'duration_sec',
      width: 100,
      sorter: (a: any, b: any) => (Number(a.duration_sec) || 0) - (Number(b.duration_sec) || 0),
      render: (v: any) => {
        if (v == null) return '-';
        const n = Number(v);
        const color = n > 300 ? '#ff4d4f' : n > 60 ? '#faad14' : '#52c41a';
        return <span style={{ color, fontWeight: 500 }}>{n.toFixed(0)}</span>;
      },
    },
    {
      title: '主机',
      dataIndex: 'host',
      key: 'host',
      width: 150,
      ellipsis: true,
    },
    {
      title: '重试',
      dataIndex: 'retry_times',
      key: 'retry_times',
      width: 60,
      render: (v: any) => Number(v) > 0 ? <span style={{ color: '#faad14' }}>{v}</span> : v,
    },
  ];

  const selectedProjectName = projectList.find((p: any) => String(p.id) === selectedProject)?.name;

  const renderBreadcrumb = () => (
    <Breadcrumb style={{ marginBottom: 16 }}>
      <Breadcrumb.Item>
        <a onClick={() => handleBreadcrumbClick('platform')} style={{ color: drillLevel === 'platform' ? undefined : '#1890ff' }}>
          平台概览
        </a>
      </Breadcrumb.Item>
      {drillLevel !== 'platform' && (
        <Breadcrumb.Item>
          <a onClick={() => handleBreadcrumbClick('project')} style={{ color: drillLevel === 'project' ? undefined : '#1890ff' }}>
            {drillProjectName}
          </a>
        </Breadcrumb.Item>
      )}
      {drillLevel === 'process' && (
        <Breadcrumb.Item>{drillProcessName}</Breadcrumb.Item>
      )}
    </Breadcrumb>
  );

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ marginRight: 8, color: '#666' }}>日期范围:</span>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as any)}
            />
          </Col>
          {drillLevel !== 'platform' && (
            <Col>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>返回</Button>
            </Col>
          )}
        </Row>
      </Card>

      {renderBreadcrumb()}

      {drillLevel === 'platform' && (
        <>
          {overview?.summary && (
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
              <Col span={4}>
                <Card size="small" styles={{ body: { padding: '16px 20px' } }}>
                  <Statistic title="总实例数" value={overview.summary.total_instances} prefix={<SyncOutlined style={{ color: '#1890ff' }} />} />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small" styles={{ body: { padding: '16px 20px' } }}>
                  <Statistic title="成功数" value={overview.summary.total_success} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small" styles={{ body: { padding: '16px 20px' } }}>
                  <Statistic title="失败数" value={overview.summary.total_failure} valueStyle={{ color: '#ff4d4f' }} prefix={<CloseCircleOutlined />} />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small" styles={{ body: { padding: '16px 20px' } }}>
                  <Statistic title="总成功率" value={Number(overview.summary.overall_success_rate)} suffix="%" valueStyle={{ color: Number(overview.summary.overall_success_rate) >= 95 ? '#52c41a' : Number(overview.summary.overall_success_rate) >= 80 ? '#faad14' : '#ff4d4f' }} prefix={<ExclamationCircleOutlined />} />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small" styles={{ body: { padding: '16px 20px' } }}>
                  <Statistic title="项目数" value={overview.projects?.length || 0} prefix={<ThunderboltOutlined style={{ color: '#722ed1' }} />} />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small" styles={{ body: { padding: '16px 20px' } }}>
                  <Statistic title="任务类型数" value={taskStats.length} prefix={<FieldTimeOutlined style={{ color: '#13c2c2' }} />} />
                </Card>
              </Col>
            </Row>
          )}

          <Card title="执行趋势" size="small" style={{ marginBottom: 16 }} headStyle={{ fontSize: 14, fontWeight: 600 }}>
            <Spin spinning={loading}>
              <ReactECharts option={trendChartOption} style={{ height: 340 }} />
            </Spin>
          </Card>

          <Card
            title="项目调度统计（点击项目名称穿透查看流程）"
            size="small"
            style={{ marginBottom: 16 }}
            headStyle={{ fontSize: 14, fontWeight: 600 }}
          >
            <Table
              columns={projectColumns}
              dataSource={overview?.projects || []}
              rowKey="project_id"
              loading={loading}
              pagination={{ pageSize: 10, size: 'small' }}
              size="small"
            />
          </Card>

          <Card title="任务级统计（按成功率升序、耗时降序排列）" size="small" headStyle={{ fontSize: 14, fontWeight: 600 }}>
            <Table
              columns={taskColumns}
              dataSource={taskStats}
              rowKey={(r) => `${r.project_name}_${r.task_name}`}
              loading={loading}
              pagination={{ pageSize: 15, size: 'small' }}
              size="small"
              scroll={{ x: 900 }}
            />
          </Card>
        </>
      )}

      {drillLevel === 'project' && (
        <>
          <Card
            title={
              <span>
                <FieldTimeOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                任务执行时间线 - {drillProjectName}
              </span>
            }
            size="small"
            style={{ marginBottom: 16 }}
            headStyle={{ fontSize: 14, fontWeight: 600 }}
            extra={
              timelineSummary && (
                <Space size="middle">
                  <span style={{ fontSize: 12, color: '#666' }}>
                    共 <b>{timelineSummary.total}</b> 次执行
                  </span>
                  <Badge color="#52c41a" text={<span style={{ fontSize: 12 }}>成功 {timelineSummary.success}</span>} />
                  <Badge color="#ff4d4f" text={<span style={{ fontSize: 12, fontWeight: timelineSummary.failure > 0 ? 700 : 400, color: timelineSummary.failure > 0 ? '#ff4d4f' : undefined }}>失败 {timelineSummary.failure}</span>} />
                  {timelineSummary.forced > 0 && <Badge color="#faad14" text={<span style={{ fontSize: 12 }}>强制成功 {timelineSummary.forced}</span>} />}
                  {timelineSummary.running > 0 && <Badge color="#1890ff" text={<span style={{ fontSize: 12 }}>运行中 {timelineSummary.running}</span>} />}
                </Space>
              )
            }
          >
            <Spin spinning={timelineLoading}>
              {timelineData.length > 0 ? (
                <ReactECharts option={timelineChartOption} style={{ height: Math.max(300, Math.min(new Set(timelineData.map((t: any) => t.task_name)).size * 36 + 60, 600)) }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  暂无时间线数据
                </div>
              )}
            </Spin>
          </Card>

          <Card
            title="流程列表（点击流程名称穿透查看任务详情）"
            size="small"
            style={{ marginBottom: 16 }}
            headStyle={{ fontSize: 14, fontWeight: 600 }}
          >
            <Table
              columns={processColumns}
              dataSource={processList}
              rowKey="process_code"
              loading={processLoading}
              pagination={{ pageSize: 15, size: 'small' }}
              size="small"
              scroll={{ x: 1000 }}
            />
          </Card>

          {timelineData.length > 0 && (
            <Card
              title="时间线明细（失败记录优先）"
              size="small"
              headStyle={{ fontSize: 14, fontWeight: 600 }}
            >
              <Table
                columns={timelineDetailColumns}
                dataSource={[...timelineData].sort((a, b) => {
                  if (a.state === 6 && b.state !== 6) return -1;
                  if (a.state !== 6 && b.state === 6) return 1;
                  return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
                })}
                rowKey="task_instance_id"
                loading={timelineLoading}
                pagination={{ pageSize: 15, size: 'small' }}
                size="small"
                scroll={{ x: 900 }}
                rowClassName={(record) => record.state === 6 ? 'row-failure' : ''}
              />
            </Card>
          )}
        </>
      )}

      {drillLevel === 'process' && (
        <>
          {processSummary && (
            <Card
              size="small"
              styles={{ body: { padding: '12px 20px' } }}
              style={{ marginBottom: 12 }}
            >
              <Row gutter={16}>
                <Col span={4}>
                  <Statistic
                    title="总实例数"
                    value={processSummary.total_instances}
                    prefix={<ThunderboltOutlined style={{ color: '#1890ff' }} />}
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="成功数"
                    value={processSummary.success_count}
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ fontSize: 20, color: '#52c41a' }}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="失败数"
                    value={processSummary.failure_count}
                    prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                    valueStyle={{ fontSize: 20, color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="强制成功"
                    value={processSummary.forced_success_count}
                    prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
                    valueStyle={{ fontSize: 20, color: '#faad14' }}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="成功率"
                    value={processSummary.success_rate}
                    suffix="%"
                    valueStyle={{
                      fontSize: 20,
                      color: Number(processSummary.success_rate) >= 95 ? '#52c41a' : Number(processSummary.success_rate) >= 80 ? '#faad14' : '#ff4d4f',
                      fontWeight: 600,
                    }}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="平均耗时(秒)"
                    value={processSummary.avg_duration_sec}
                    prefix={<FieldTimeOutlined style={{ color: '#722ed1' }} />}
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
              </Row>
            </Card>
          )}
          <Card
            title={
              <span>
                <ThunderboltOutlined style={{ marginRight: 8, color: '#722ed1' }} />
                任务明细 - {drillProcessName}
              </span>
            }
            size="small"
            headStyle={{ fontSize: 14, fontWeight: 600 }}
          >
            <Table
              columns={processDetailColumns}
              dataSource={processDetail}
              rowKey={(r) => `${r.task_name}_${r.task_type}`}
              loading={processLoading}
              pagination={{ pageSize: 15, size: 'small' }}
              size="small"
              scroll={{ x: 1000 }}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default ProjectPage;
