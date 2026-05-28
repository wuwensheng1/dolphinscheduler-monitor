import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Spin, message, Table, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, DesktopOutlined, ThunderboltOutlined, WarningOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { dashboardApi } from '../services/api';
import { useOutletContext } from 'react-router-dom';
import { AppContextType } from '../layouts/AppLayout';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const DashboardPage: React.FC = () => {
  const { currentEnv } = useOutletContext<AppContextType>();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([dayjs().subtract(1, 'day'), dayjs()]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [workerData, setWorkerData] = useState<any[]>([]);
  const [hostData, setHostData] = useState<any[]>([]);
  const [taskTypeData, setTaskTypeData] = useState<any[]>([]);
  const [durationData, setDurationData] = useState<any[]>([]);
  const [failureData, setFailureData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (currentEnv) fetchAllData();
  }, [currentEnv, dateRange]);

  const getParams = () => {
    const params: any = {};
    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].format('YYYY-MM-DD');
      params.endDate = dateRange[1].format('YYYY-MM-DD');
    }
    return params;
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const params = getParams();
      const [hourly, worker, host, taskType, duration, failure, dash] = await Promise.all([
        dashboardApi.hourlyDistribution(currentEnv, params),
        dashboardApi.workerDistribution(currentEnv, params),
        dashboardApi.hostDistribution(currentEnv, params),
        dashboardApi.taskTypeDistribution(currentEnv, params),
        dashboardApi.durationStats(currentEnv, params),
        dashboardApi.failureAnalysis(currentEnv, params),
        dashboardApi.dashboard(currentEnv, params),
      ]);
      setHourlyData(hourly);
      setWorkerData(worker);
      setHostData(host);
      setTaskTypeData(taskType);
      setDurationData(duration);
      setFailureData(failure);
      setSummary(dash);
    } catch (e: any) {
      message.error('加载数据失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const hourlyChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['总执行数', '成功', '失败'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: hourlyData.map(h => h.label),
      axisLabel: { interval: 1 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '总执行数',
        type: 'bar',
        data: hourlyData.map(h => h.total_count),
        itemStyle: { color: '#1890ff', borderRadius: [2, 2, 0, 0] },
      },
      {
        name: '成功',
        type: 'bar',
        data: hourlyData.map(h => h.success_count),
        itemStyle: { color: '#52c41a', borderRadius: [2, 2, 0, 0] },
      },
      {
        name: '失败',
        type: 'bar',
        data: hourlyData.map(h => h.failure_count),
        itemStyle: { color: '#ff4d4f', borderRadius: [2, 2, 0, 0] },
      },
    ],
  };

  const workerChartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left', top: 'middle' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: workerData.map(w => ({ value: Number(w.total_count), name: w.worker_group || 'default' })),
    }],
  };

  const sortedHostData = [...hostData].sort((a, b) => {
    const ipA = (a.host || '').split(':')[0];
    const ipB = (b.host || '').split(':')[0];
    const portA = parseInt((a.host || '').split(':')[1] || '0', 10);
    const portB = parseInt((b.host || '').split(':')[1] || '0', 10);
    const partsA = ipA.split('.').map(Number);
    const partsB = ipB.split('.').map(Number);
    for (let i = 0; i < 4; i++) {
      const na = partsA[i] || 0;
      const nb = partsB[i] || 0;
      if (na !== nb) return na - nb;
    }
    return portA - portB;
  });

  const hostChartOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['任务数', '平均耗时(秒)'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: sortedHostData.map(h => h.host),
      axisLabel: { rotate: 30, fontSize: 11 },
    },
    yAxis: [
      { type: 'value', name: '任务数' },
      { type: 'value', name: '耗时(秒)' },
    ],
    series: [
      {
        name: '任务数',
        type: 'bar',
        data: sortedHostData.map(h => Number(h.total_count)),
        itemStyle: { color: '#1890ff', borderRadius: [2, 2, 0, 0] },
      },
      {
        name: '平均耗时(秒)',
        type: 'line',
        yAxisIndex: 1,
        data: sortedHostData.map(h => Number(h.avg_duration_sec || 0)),
        itemStyle: { color: '#faad14' },
        lineStyle: { width: 2 },
        symbolSize: 6,
      },
    ],
  };

  const taskTypeChartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left', top: 'middle' },
    series: [{
      type: 'pie',
      radius: '60%',
      center: ['60%', '50%'],
      data: taskTypeData.map(t => ({ value: Number(t.total_count), name: t.task_type || 'unknown' })),
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } },
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
    }],
  };

  const durationColumns = [
    {
      title: '项目',
      dataIndex: 'project_name',
      key: 'project_name',
      ellipsis: true,
    },
    {
      title: '流程名称',
      dataIndex: 'process_name',
      key: 'process_name',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
      ellipsis: true,
    },
    {
      title: '运行次数',
      dataIndex: 'run_count',
      key: 'run_count',
      width: 100,
    },
    {
      title: '平均耗时(秒)',
      dataIndex: 'avg_duration_sec',
      key: 'avg_duration_sec',
      width: 120,
      defaultSortOrder: 'descend' as const,
      render: (v: any) => v != null ? Number(v).toFixed(1) : '-',
      sorter: (a: any, b: any) => (Number(a.avg_duration_sec) || 0) - (Number(b.avg_duration_sec) || 0),
    },
    {
      title: '最小耗时(秒)',
      dataIndex: 'min_duration_sec',
      key: 'min_duration_sec',
      width: 120,
      render: (v: any) => v != null ? Number(v).toFixed(1) : '-',
    },
    {
      title: '最大耗时(秒)',
      dataIndex: 'max_duration_sec',
      key: 'max_duration_sec',
      width: 120,
      render: (v: any) => v != null ? Number(v).toFixed(1) : '-',
    },
    {
      title: '标准差(秒)',
      dataIndex: 'stddev_duration_sec',
      key: 'stddev_duration_sec',
      width: 110,
      render: (v: any) => v != null ? Number(v).toFixed(1) : '-',
    },
  ];

  const failureColumns = [
    {
      title: '项目',
      dataIndex: 'project_name',
      key: 'project_name',
      ellipsis: true,
    },
    {
      title: '流程名称',
      dataIndex: 'process_name',
      key: 'process_name',
      ellipsis: true,
    },
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      render: (text: string) => <span style={{ fontWeight: 500, color: '#ff4d4f' }}>{text}</span>,
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
      title: '失败次数',
      dataIndex: 'fail_count',
      key: 'fail_count',
      width: 100,
      defaultSortOrder: 'descend' as const,
      sorter: (a: any, b: any) => Number(a.fail_count) - Number(b.fail_count),
      render: (v: any) => <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: '最近失败时间',
      dataIndex: 'last_fail_time',
      key: 'last_fail_time',
      width: 180,
    },
  ];

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
        </Row>
      </Card>

      {summary && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card size="small" styles={{ body: { padding: '16px 20px' } }}>
              <Statistic title="流程实例总数" value={summary.processSummary?.total_process_instances} prefix={<ThunderboltOutlined style={{ color: '#1890ff' }} />} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" styles={{ body: { padding: '16px 20px' } }}>
              <Statistic title="流程成功数" value={summary.processSummary?.success_count} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" styles={{ body: { padding: '16px 20px' } }}>
              <Statistic title="流程失败数" value={summary.processSummary?.failure_count} valueStyle={{ color: '#ff4d4f' }} prefix={<CloseCircleOutlined />} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" styles={{ body: { padding: '16px 20px' } }}>
              <Statistic title="任务实例总数" value={summary.taskSummary?.total_task_instances} prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" styles={{ body: { padding: '16px 20px' } }}>
              <Statistic title="活跃主机数" value={summary.taskSummary?.active_hosts} prefix={<DesktopOutlined style={{ color: '#13c2c2' }} />} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" styles={{ body: { padding: '16px 20px' } }}>
              <Statistic title="Worker组数" value={summary.processSummary?.active_worker_groups} prefix={<WarningOutlined style={{ color: '#faad14' }} />} />
            </Card>
          </Col>
        </Row>
      )}

      <Spin spinning={loading}>
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card title="按小时执行分布" size="small" headStyle={{ fontSize: 14, fontWeight: 600, borderBottom: '1px solid #f0f0f0' }}>
              <ReactECharts option={hourlyChartOption} style={{ height: 340 }} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Worker组任务分布" size="small" headStyle={{ fontSize: 14, fontWeight: 600, borderBottom: '1px solid #f0f0f0' }}>
              <ReactECharts option={workerChartOption} style={{ height: 340 }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card title="主机任务分布与耗时" size="small" headStyle={{ fontSize: 14, fontWeight: 600, borderBottom: '1px solid #f0f0f0' }}>
              <ReactECharts option={hostChartOption} style={{ height: 340 }} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="任务类型分布" size="small" headStyle={{ fontSize: 14, fontWeight: 600, borderBottom: '1px solid #f0f0f0' }}>
              <ReactECharts option={taskTypeChartOption} style={{ height: 340 }} />
            </Card>
          </Col>
        </Row>

        <Card title="流程耗时统计 (Top 50)" size="small" style={{ marginBottom: 16 }} headStyle={{ fontSize: 14, fontWeight: 600 }}>
          <Table
            columns={durationColumns}
            dataSource={durationData}
            rowKey={(r) => `${r.project_name}_${r.process_name}`}
            pagination={{ pageSize: 10, size: 'small' }}
            size="small"
            scroll={{ x: 800 }}
          />
        </Card>

        <Card title="失败任务分析 (Top 20)" size="small" headStyle={{ fontSize: 14, fontWeight: 600 }}>
          <Table
            columns={failureColumns}
            dataSource={failureData}
            rowKey={(r) => `${r.task_name}_${r.process_name}`}
            pagination={{ pageSize: 10, size: 'small' }}
            size="small"
          />
        </Card>
      </Spin>
    </div>
  );
};

export default DashboardPage;
