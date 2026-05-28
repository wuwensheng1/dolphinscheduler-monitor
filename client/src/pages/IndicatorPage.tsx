import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, Space, message, Popconfirm, Tag, Row, Col, Statistic, Progress, Spin, Alert, Steps, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, QuestionCircleOutlined, InfoCircleOutlined, BulbOutlined, SafetyCertificateOutlined, DashboardOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { indicatorApi, Indicator, EvaluationResult } from '../services/api';
import { useOutletContext } from 'react-router-dom';
import { AppContextType } from '../layouts/AppLayout';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

const IndicatorPage: React.FC = () => {
  const { currentEnv } = useOutletContext<AppContextType>();
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (currentEnv) fetchIndicators();
  }, [currentEnv]);

  const fetchIndicators = async () => {
    setLoading(true);
    try {
      const data = await indicatorApi.list(currentEnv);
      setIndicators(data);
    } catch (e: any) {
      message.error('加载指标失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingIndicator(null);
    form.resetFields();
    form.setFieldsValue({ result_type: 'number', weight: 1.0, sort_order: 0, env_id: currentEnv });
    setModalVisible(true);
  };

  const handleEdit = (record: Indicator) => {
    setEditingIndicator(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await indicatorApi.delete(id);
      message.success('删除成功');
      fetchIndicators();
    } catch (e: any) {
      message.error('删除失败: ' + e.message);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingIndicator) {
        await indicatorApi.update(editingIndicator.id, values);
        message.success('更新成功');
      } else {
        values.env_id = currentEnv;
        await indicatorApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchIndicators();
    } catch (e: any) {
      if (e.message) message.error('操作失败: ' + e.message);
    }
  };

  const handleEvaluate = async () => {
    if (!currentEnv) {
      message.warning('请先选择环境');
      return;
    }
    if (indicators.length === 0) {
      message.warning('请先添加至少一个指标');
      return;
    }
    setEvaluating(true);
    try {
      const result = await indicatorApi.evaluate(currentEnv);
      setEvalResult(result);
      message.success('评估完成');
    } catch (e: any) {
      message.error('评估失败: ' + e.message);
    } finally {
      setEvaluating(false);
    }
  };

  const handleAddExample = async (example: { name: string; description: string; sql_text: string; min_value: number | null; max_value: number | null; weight: number }) => {
    try {
      await indicatorApi.create({
        env_id: currentEnv,
        name: example.name,
        description: example.description,
        sql_text: example.sql_text,
        result_type: 'number',
        min_value: example.min_value,
        max_value: example.max_value,
        min_sql: null,
        max_sql: null,
        weight: example.weight,
        sort_order: 0,
      });
      message.success(`示例指标「${example.name}」已添加`);
      fetchIndicators();
    } catch (e: any) {
      message.error('添加失败: ' + e.message);
    }
  };

  const exampleIndicators = [
    {
      name: '日流程成功率',
      description: '当天流程实例的成功率(%)',
      sql_text: `SELECT ROUND(SUM(CASE WHEN state IN (7,13) THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) FROM t_ds_process_instance WHERE DATE(start_time) = CURDATE()`,
      min_value: 95,
      max_value: null,
      weight: 1.5,
    },
    {
      name: '日任务成功率',
      description: '当天任务实例的成功率(%)',
      sql_text: `SELECT ROUND(SUM(CASE WHEN state IN (7,13) THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) FROM t_ds_task_instance WHERE DATE(start_time) = CURDATE()`,
      min_value: 98,
      max_value: null,
      weight: 1.0,
    },
    {
      name: '日失败任务数',
      description: '当天失败的任务实例数',
      sql_text: `SELECT COUNT(*) FROM t_ds_task_instance WHERE state = 6 AND DATE(start_time) = CURDATE()`,
      min_value: null,
      max_value: 50,
      weight: 1.0,
    },
  ];

  const statusColorMap: Record<string, string> = {
    excellent: '#52c41a',
    good: '#1890ff',
    warning: '#faad14',
    critical: '#ff4d4f',
  };

  const statusTextMap: Record<string, string> = {
    excellent: '优秀',
    good: '良好',
    warning: '警告',
    critical: '严重',
  };

  const gaugeOption = evalResult ? {
    series: [{
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 1,
      splitNumber: 10,
      itemStyle: { color: statusColorMap[evalResult.overallStatus] },
      progress: { show: true, width: 30 },
      pointer: { show: false },
      axisLine: { lineStyle: { width: 30 } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: {
        valueAnimation: true,
        fontSize: 36,
        fontWeight: 'bold',
        formatter: (value: any) => `${(Number(value) * 100).toFixed(0)}分`,
        color: statusColorMap[evalResult.overallStatus],
        offsetCenter: [0, '10%'],
      },
      title: {
        offsetCenter: [0, '40%'],
        fontSize: 20,
        color: statusColorMap[evalResult.overallStatus],
      },
      data: [{ value: evalResult.overallScore, name: statusTextMap[evalResult.overallStatus] }],
    }],
  } : {};

  const evalColumns = [
    {
      title: '指标名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '实际值',
      dataIndex: 'actualValue',
      key: 'actualValue',
      render: (v: number | null) => v !== null ? <span style={{ fontWeight: 600 }}>{v}</span> : <Tag>无数据</Tag>,
    },
    {
      title: '范围',
      key: 'range',
      render: (_: any, record: any) => {
        const min = record.minBound !== null ? record.minBound : '-∞';
        const max = record.maxBound !== null ? record.maxBound : '+∞';
        return <span>{min} ~ {max}</span>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: Record<string, { icon: any; color: string; text: string }> = {
          pass: { icon: <CheckCircleOutlined />, color: 'success', text: '通过' },
          fail: { icon: <CloseCircleOutlined />, color: 'error', text: '未通过' },
          unknown: { icon: <QuestionCircleOutlined />, color: 'default', text: '未知' },
        };
        const c = config[status] || config.unknown;
        return <Tag icon={c.icon} color={c.color}>{c.text}</Tag>;
      },
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      render: (v: number) => <Progress percent={Math.round(v * 100)} size="small" status={v >= 0.7 ? 'success' : 'exception'} />,
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
    },
  ];

  const indicatorColumns = [
    {
      title: '指标名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '结果类型',
      dataIndex: 'result_type',
      key: 'result_type',
      width: 90,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: '最小值',
      dataIndex: 'min_value',
      key: 'min_value',
      width: 80,
      render: (v: number | null) => v !== null ? v : '-∞',
    },
    {
      title: '最大值',
      dataIndex: 'max_value',
      key: 'max_value',
      width: 80,
      render: (v: number | null) => v !== null ? v : '+∞',
    },
    {
      title: '查询SQL',
      dataIndex: 'sql_text',
      key: 'sql_text',
      ellipsis: true,
      render: (v: string) => <Text copyable={{ tooltips: ['复制', '已复制'] }}>{v}</Text>,
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
      width: 70,
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: any, record: Indicator) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除该指标？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleEvaluate} loading={evaluating} disabled={indicators.length === 0}>
              执行评估
            </Button>
          </Col>
        </Row>
      </Card>

      <Alert
        message="指标判定使用说明"
        description={
          <div>
            <Steps
              size="small"
              current={-1}
              items={[
                { title: '选择环境', description: '选择要评估的DolphinScheduler环境' },
                { title: '添加指标', description: '配置评估指标及其SQL查询和判定范围' },
                { title: '执行评估', description: '点击"执行评估"按钮，系统将自动查询并判定' },
                { title: '查看结果', description: '查看综合评分和各指标评估详情' },
              ]}
            />
            <Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
              <Text strong>指标判定逻辑：</Text>每个指标通过SQL查询获取实际值，与设定的最小值/最大值范围比较。
              在范围内为"通过"，否则为"未通过"。综合得分为各指标加权平均分（0~1分）。
              <br />
              <Text strong>范围来源：</Text>最小值和最大值可以固定填写，也可以通过"最小值SQL/最大值SQL"从其他系统动态查询获取。
            </Paragraph>
          </div>
        }
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />

      {evalResult && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card size="small" headStyle={{ fontSize: 14, fontWeight: 600 }}>
              <ReactECharts option={gaugeOption} style={{ height: 250 }} />
              <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
                评估时间: {new Date(evalResult.evaluatedAt).toLocaleString()}
              </div>
            </Card>
          </Col>
          <Col span={16}>
            <Card title="指标评估结果" size="small" headStyle={{ fontSize: 14, fontWeight: 600 }}>
              <Table
                columns={evalColumns}
                dataSource={evalResult.evaluations}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card
        title={
          <span>
            <SafetyCertificateOutlined style={{ marginRight: 8 }} />
            指标配置
          </span>
        }
        size="small"
        headStyle={{ fontSize: 14, fontWeight: 600 }}
        extra={
          <Space>
            {indicators.length === 0 && (
              <Button icon={<BulbOutlined />} onClick={() => {
                exampleIndicators.forEach(ex => handleAddExample(ex));
              }}>
                添加示例指标
              </Button>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!currentEnv}>
              添加指标
            </Button>
          </Space>
        }
      >
        {indicators.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <QuestionCircleOutlined style={{ fontSize: 48, marginBottom: 16, color: '#d9d9d9' }} />
            <div style={{ fontSize: 16, marginBottom: 8 }}>暂无指标配置</div>
            <div style={{ marginBottom: 16 }}>点击"添加指标"手动创建，或点击"添加示例指标"快速添加常用指标</div>
            <div style={{ textAlign: 'left', maxWidth: 600, margin: '0 auto' }}>
              <Text strong>示例指标说明：</Text>
              <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                <li><Text strong>日流程成功率</Text>：查询当天流程实例成功率，要求 ≥ 95%</li>
                <li><Text strong>日任务成功率</Text>：查询当天任务实例成功率，要求 ≥ 98%</li>
                <li><Text strong>日失败任务数</Text>：查询当天失败任务数，要求 ≤ 50</li>
              </ul>
            </div>
          </div>
        ) : (
          <Table
            columns={indicatorColumns}
            dataSource={indicators}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
            scroll={{ x: 1000 }}
          />
        )}
      </Card>

      <Modal
        title={editingIndicator ? '编辑指标' : '添加指标'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="指标名称" rules={[{ required: true, message: '请输入指标名称' }]}>
                <Input placeholder="如: 日成功率" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="description" label="描述">
                <Input placeholder="指标说明" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="sql_text"
            label="查询SQL"
            rules={[{ required: true, message: '请输入查询SQL' }]}
            extra="SQL查询结果应为单个数值，用于与判定范围比较。可使用 DolphinScheduler 元数据表如 t_ds_process_instance、t_ds_task_instance 等"
          >
            <TextArea rows={4} placeholder="SELECT ROUND(SUM(CASE WHEN state IN (7,13) THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) FROM t_ds_process_instance WHERE DATE(start_time) = CURDATE()" />
          </Form.Item>
          <Form.Item name="result_type" label="结果类型">
            <Select options={[{ value: 'number', label: '数值' }]} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="min_value" label="最小值(固定)" extra="实际值需 ≥ 此值才算通过，留空表示无下限">
                <InputNumber style={{ width: '100%' }} placeholder="如: 95" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="max_value" label="最大值(固定)" extra="实际值需 ≤ 此值才算通过，留空表示无上限">
                <InputNumber style={{ width: '100%' }} placeholder="如: 50" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="min_sql" label="最小值SQL(动态)" extra="可选，从其他系统动态查询最小值，优先于固定值">
                <TextArea rows={2} placeholder="SELECT min_value FROM config_table WHERE metric = 'success_rate'" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="max_sql" label="最大值SQL(动态)" extra="可选，从其他系统动态查询最大值，优先于固定值">
                <TextArea rows={2} placeholder="SELECT max_value FROM config_table WHERE metric = 'fail_count'" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="weight" label="权重" extra="指标在综合评估中的权重，默认1.0">
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sort_order" label="排序">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default IndicatorPage;
