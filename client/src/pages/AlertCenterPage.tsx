import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, DatePicker, Select, Spin, message, Table, Tag, Segmented, InputNumber, Space, Statistic, Badge } from 'antd';
import { CloseCircleOutlined, WarningOutlined, ClusterOutlined, DesktopOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { dashboardApi, projectApi } from '../services/api';
import { useOutletContext } from 'react-router-dom';
import { AppContextType } from '../layouts/AppLayout';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const formatXLabel = (value: string, dimension: string) => {
  if (dimension === 'month') return value;
  if (dimension === 'week') return value;
  if (dimension === 'day') return dayjs(value).format('MM/DD');
  return dayjs(value).format('MM/DD') + '\n' + dayjs(value).format('HH:mm');
};

const formatSliderLabel = (value: string, dimension: string) => {
  if (dimension === 'month' || dimension === 'week') return value;
  if (dimension === 'day') return dayjs(value).format('MM/DD');
  return dayjs(value).format('MM/DD HH:mm');
};

const AlertCenterPage: React.FC = () => {
  const { currentEnv } = useOutletContext<AppContextType>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([dayjs().subtract(1, 'day'), dayjs()]);
  const [loading, setLoading] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);
  const [currentProject, setCurrentProject] = useState<string>('');

  const [failureLevel, setFailureLevel] = useState<string>('overall');
  const [failureDimension, setFailureDimension] = useState<string>('hour');
  const [failureTrendData, setFailureTrendData] = useState<any[]>([]);
  const [consecutiveData, setConsecutiveData] = useState<any[]>([]);
  const [minConsecutive, setMinConsecutive] = useState<number>(2);
  const [workerLoadData, setWorkerLoadData] = useState<any[]>([]);
  const [hostConcurrentData, setHostConcurrentData] = useState<any[]>([]);

  useEffect(() => {
    if (currentEnv) {
      projectApi.list(currentEnv).then(data => {
        setProjects(data);
        setCurrentProject('');
      }).catch(() => {
        setProjects([]);
        setCurrentProject('');
      });
    }
  }, [currentEnv]);

  useEffect(() => {
    if (currentEnv) fetchAllData();
  }, [currentEnv, dateRange, currentProject, failureLevel, failureDimension, minConsecutive]);

  const getParams = () => {
    const params: any = {};
    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].format('YYYY-MM-DD');
      params.endDate = dateRange[1].format('YYYY-MM-DD');
    }
    if (currentProject) {
      params.projectId = currentProject;
    }
    return params;
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const params = getParams();
      const [failure, consecutive, workerLoad, hostConcurrent] = await Promise.all([
        dashboardApi.failureTrend(currentEnv, { ...params, level: failureLevel, dimension: failureDimension }),
        dashboardApi.consecutiveFailures(currentEnv, { ...params, minConsecutive }),
        dashboardApi.workerLoadTrend(currentEnv, params),
        dashboardApi.hostConcurrentTrend(currentEnv, params),
      ]);
      setFailureTrendData(failure);
      setConsecutiveData(consecutive);
      setWorkerLoadData(workerLoad);
      setHostConcurrentData(hostConcurrent);
    } catch (e: any) {
      message.error('加载数据失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const buildDataZoom = (dates: string[]) => {
    return [
      { type: 'inside' as const, xAxisIndex: 0, filterMode: 'none' as const },
      {
        type: 'slider' as const,
        xAxisIndex: 0,
        filterMode: 'none' as const,
        height: 24,
        bottom: 4,
        borderColor: 'transparent',
        backgroundColor: 'rgba(0,0,0,0.04)',
        fillerColor: 'rgba(24,144,255,0.15)',
        handleStyle: { color: '#1890ff', borderColor: '#1890ff' },
        textStyle: { fontSize: 11 },
        labelFormatter: (value: number) => formatSliderLabel(dates[value] || '', failureDimension),
      },
    ];
  };

  const failureTrendChartOption = useMemo(() => {
    if (failureTrendData.length === 0) return {};

    const isHour = failureDimension === 'hour';
    const isDay = failureDimension === 'day';

    if (failureLevel === 'overall') {
      const dates = failureTrendData.map((d: any) => d.run_date);
      return {
        tooltip: { trigger: 'axis' },
        legend: { data: ['总执行数', '失败数', '成功数'], top: 0 },
        grid: { left: '3%', right: '4%', bottom: isHour ? 60 : 40, top: 40, containLabel: true },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: {
            fontSize: 11,
            formatter: (value: string) => formatXLabel(value, failureDimension),
            lineHeight: 18,
            interval: isHour ? Math.max(Math.floor(dates.length / 12), 0) : 'auto' as const,
          },
        },
        yAxis: { type: 'value' },
        dataZoom: isHour || isDay ? buildDataZoom(dates) : undefined,
        series: [
          {
            name: '总执行数',
            type: 'bar',
            data: failureTrendData.map((d: any) => Number(d.total_count)),
            itemStyle: { color: '#1890ff', borderRadius: [2, 2, 0, 0] },
          },
          {
            name: '成功数',
            type: 'bar',
            data: failureTrendData.map((d: any) => Number(d.success_count)),
            itemStyle: { color: '#52c41a', borderRadius: [2, 2, 0, 0] },
          },
          {
            name: '失败数',
            type: 'bar',
            data: failureTrendData.map((d: any) => Number(d.failure_count)),
            itemStyle: { color: '#ff4d4f', borderRadius: [2, 2, 0, 0] },
          },
        ],
      };
    }

    const dates = [...new Set(failureTrendData.map((d: any) => d.run_date))].sort();
    const groups = [...new Set(failureTrendData.map((d: any) => d.group_name))];
    const dataMap = new Map<string, any>();
    failureTrendData.forEach((d: any) => {
      dataMap.set(`${d.run_date}_${d.group_name}`, d);
    });

    const topGroups = groups
      .map(g => ({
        name: g,
        total: failureTrendData.filter((d: any) => d.group_name === g).reduce((s, d) => s + Number(d.failure_count), 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(g => g.name);

    return {
      tooltip: { trigger: 'axis' },
      legend: { data: topGroups, top: 0, type: 'scroll' },
      grid: { left: '3%', right: '4%', bottom: isHour ? 60 : 40, top: 40, containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          fontSize: 11,
          formatter: (value: string) => formatXLabel(value, failureDimension),
          lineHeight: 18,
          interval: isHour ? Math.max(Math.floor(dates.length / 12), 0) : 'auto' as const,
        },
      },
      yAxis: { type: 'value' },
      dataZoom: isHour || isDay ? buildDataZoom(dates) : undefined,
      series: topGroups.map(name => ({
        name,
        type: 'line',
        data: dates.map(date => {
          const d = dataMap.get(`${date}_${name}`);
          return d ? Number(d.failure_count) : 0;
        }),
        smooth: true,
        symbolSize: 4,
      })),
    };
  }, [failureTrendData, failureLevel, failureDimension]);

  const failureSummary = useMemo(() => {
    if (failureTrendData.length === 0) return null;
    const totalFail = failureTrendData.reduce((s, d) => s + Number(d.failure_count), 0);
    const totalAll = failureTrendData.reduce((s, d) => s + Number(d.total_count), 0);
    return { totalFail, totalAll };
  }, [failureTrendData]);

  const workerLoadChartOption = useMemo(() => {
    if (workerLoadData.length === 0) return {};

    const dates = [...new Set(workerLoadData.map((d: any) => d.run_date))].sort();
    const workers = [...new Set(workerLoadData.map((d: any) => d.worker_group))];
    const dataMap = new Map<string, any>();
    workerLoadData.forEach((d: any) => {
      dataMap.set(`${d.run_date}_${d.worker_group}`, d);
    });

    return {
      tooltip: { trigger: 'axis' },
      legend: { data: workers, top: 0, type: 'scroll' },
      grid: { left: '3%', right: '4%', bottom: 60, top: 40, containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          fontSize: 11,
          formatter: (value: string) => {
            const d = dayjs(value);
            return d.format('MM/DD') + '\n' + d.format('HH:mm');
          },
          lineHeight: 18,
          interval: Math.max(Math.floor(dates.length / 10), 0),
        },
      },
      yAxis: { type: 'value', name: '任务数' },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
        {
          type: 'slider',
          xAxisIndex: 0,
          filterMode: 'none',
          height: 24,
          bottom: 4,
          borderColor: 'transparent',
          backgroundColor: 'rgba(0,0,0,0.04)',
          fillerColor: 'rgba(24,144,255,0.15)',
          handleStyle: { color: '#1890ff', borderColor: '#1890ff' },
          textStyle: { fontSize: 11 },
          labelFormatter: (value: number) => dayjs(dates[value]).format('MM/DD HH:mm'),
        },
      ],
      series: workers.map(wg => ({
        name: wg,
        type: 'line',
        data: dates.map(date => {
          const d = dataMap.get(`${date}_${wg}`);
          return d ? Number(d.task_count) : 0;
        }),
        smooth: true,
        symbolSize: 3,
        areaStyle: { opacity: 0.1 },
      })),
    };
  }, [workerLoadData]);

  const hostConcurrentChartOption = useMemo(() => {
    if (hostConcurrentData.length === 0) return {};

    const dates = [...new Set(hostConcurrentData.map((d: any) => d.run_date))].sort();
    const hosts = [...new Set(hostConcurrentData.map((d: any) => d.host))];
    const dataMap = new Map<string, any>();
    hostConcurrentData.forEach((d: any) => {
      dataMap.set(`${d.run_date}_${d.host}`, d);
    });

    return {
      tooltip: { trigger: 'axis' },
      legend: { data: hosts, top: 0, type: 'scroll' },
      grid: { left: '3%', right: '4%', bottom: 60, top: 40, containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          fontSize: 11,
          formatter: (value: string) => {
            const d = dayjs(value);
            return d.format('MM/DD') + '\n' + d.format('HH:mm');
          },
          lineHeight: 18,
          interval: Math.max(Math.floor(dates.length / 10), 0),
        },
      },
      yAxis: { type: 'value', name: '任务数' },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
        {
          type: 'slider',
          xAxisIndex: 0,
          filterMode: 'none',
          height: 24,
          bottom: 4,
          borderColor: 'transparent',
          backgroundColor: 'rgba(0,0,0,0.04)',
          fillerColor: 'rgba(24,144,255,0.15)',
          handleStyle: { color: '#1890ff', borderColor: '#1890ff' },
          textStyle: { fontSize: 11 },
          labelFormatter: (value: number) => dayjs(dates[value]).format('MM/DD HH:mm'),
        },
      ],
      series: hosts.map(host => ({
        name: host,
        type: 'line',
        data: dates.map(date => {
          const d = dataMap.get(`${date}_${host}`);
          return d ? Number(d.task_count) : 0;
        }),
        smooth: true,
        symbolSize: 3,
      })),
    };
  }, [hostConcurrentData]);

  const consecutiveColumns = [
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>,
      ellipsis: true,
    },
    {
      title: '所属项目',
      dataIndex: 'project_name',
      key: 'project_name',
      ellipsis: true,
    },
    {
      title: '所属流程',
      dataIndex: 'process_name',
      key: 'process_name',
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
      title: '连续失败次数',
      dataIndex: 'consecutive_fail_count',
      key: 'consecutive_fail_count',
      width: 120,
      sorter: (a: any, b: any) => Number(a.consecutive_fail_count) - Number(b.consecutive_fail_count),
      defaultSortOrder: 'descend' as const,
      render: (v: any) => {
        const n = Number(v);
        const color = n >= 5 ? '#ff4d4f' : n >= 3 ? '#faad14' : '#1890ff';
        return (
          <span style={{ color, fontWeight: 700, fontSize: 16 }}>
            {n}
          </span>
        );
      },
    },
    {
      title: '最早失败时间',
      dataIndex: 'first_fail_time',
      key: 'first_fail_time',
      width: 180,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '最近失败时间',
      dataIndex: 'last_fail_time',
      key: 'last_fail_time',
      width: 180,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '失败主机',
      dataIndex: 'last_fail_host',
      key: 'last_fail_host',
      width: 160,
      ellipsis: true,
    },
    {
      title: '重试次数',
      dataIndex: 'last_retry_times',
      key: 'last_retry_times',
      width: 90,
      render: (v: any) => Number(v) > 0 ? <Tag color="orange">{v}</Tag> : <Tag>0</Tag>,
    },
  ];

  return (
    <Spin spinning={loading}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Space wrap>
          <span style={{ color: '#666' }}>项目:</span>
          <Select
            value={currentProject || undefined}
            onChange={(v) => setCurrentProject(v || '')}
            style={{ width: 200 }}
            placeholder="全部项目"
            allowClear
            showSearch
            optionFilterProp="label"
            options={[
              { value: '', label: '全部项目' },
              ...projects.map((p: any) => ({ value: String(p.id), label: p.name })),
            ]}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as any)}
            format="YYYY-MM-DD"
          />
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small" style={{ borderLeft: '4px solid #ff4d4f' }}>
            <Statistic
              title="失败总数"
              value={failureSummary?.totalFail || 0}
              valueStyle={{ color: '#ff4d4f', fontWeight: 700 }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ borderLeft: '4px solid #faad14' }}>
            <Statistic
              title="连续失败任务"
              value={consecutiveData.length}
              valueStyle={{ color: '#faad14', fontWeight: 700 }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ borderLeft: '4px solid #1890ff' }}>
            <Statistic
              title="活跃Worker组"
              value={new Set(workerLoadData.map((d: any) => d.worker_group)).size}
              valueStyle={{ color: '#1890ff', fontWeight: 700 }}
              prefix={<ClusterOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>失败趋势图</span>
          </Space>
        }
        extra={
          <Space size="middle">
            <Segmented
              value={failureDimension}
              onChange={(v) => setFailureDimension(v as string)}
              options={[
                { label: '小时', value: 'hour' },
                { label: '天', value: 'day' },
                { label: '周', value: 'week' },
                { label: '月', value: 'month' },
              ]}
              size="small"
            />
            <Segmented
              value={failureLevel}
              onChange={(v) => setFailureLevel(v as string)}
              options={[
                { label: '整体', value: 'overall' },
                { label: '按项目', value: 'project' },
                { label: '按流程', value: 'process' },
                { label: '按任务', value: 'task' },
              ]}
              size="small"
            />
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        {failureTrendData.length > 0 ? (
          <ReactECharts option={failureTrendChartOption} style={{ height: 350 }} />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无数据</div>
        )}
      </Card>

      <Card
        title={
          <Space>
            <WarningOutlined style={{ color: '#faad14' }} />
            <span>连续失败任务标记</span>
            {consecutiveData.length > 0 && (
              <Badge count={consecutiveData.length} style={{ backgroundColor: '#ff4d4f' }} />
            )}
          </Space>
        }
        extra={
          <Space>
            <span style={{ fontSize: 13, color: '#666' }}>最少连续失败次数:</span>
            <InputNumber
              min={2}
              max={20}
              value={minConsecutive}
              onChange={(v) => setMinConsecutive(v || 2)}
              size="small"
              style={{ width: 70 }}
            />
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Table
          columns={consecutiveColumns}
          dataSource={consecutiveData}
          rowKey={(r) => `${r.task_name}_${r.project_name}`}
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          rowClassName={(record) => {
            const n = Number(record.consecutive_fail_count);
            if (n >= 5) return 'consecutive-fail-critical';
            if (n >= 3) return 'consecutive-fail-warning';
            return '';
          }}
        />
      </Card>

      <Card
        title={
          <Space>
            <ClusterOutlined style={{ color: '#1890ff' }} />
            <span>Worker 节点负载趋势</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        {workerLoadData.length > 0 ? (
          <ReactECharts option={workerLoadChartOption} style={{ height: 350 }} />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无数据</div>
        )}
      </Card>

      <Card
        title={
          <Space>
            <DesktopOutlined style={{ color: '#722ed1' }} />
            <span>主机并发任务趋势</span>
          </Space>
        }
      >
        {hostConcurrentData.length > 0 ? (
          <ReactECharts option={hostConcurrentChartOption} style={{ height: 350 }} />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无数据</div>
        )}
      </Card>
    </Spin>
  );
};

export default AlertCenterPage;
