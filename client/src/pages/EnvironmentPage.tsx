import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, Space, message, Popconfirm, Tag, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ApiOutlined, CheckCircleOutlined, CloseCircleOutlined, DatabaseOutlined } from '@ant-design/icons';
import { envApi, Environment } from '../services/api';

const EnvironmentPage: React.FC = () => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [form] = Form.useForm();

  const fetchEnvironments = async () => {
    setLoading(true);
    try {
      const data = await envApi.list();
      setEnvironments(data);
    } catch (e: any) {
      message.error('加载环境列表失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const handleAdd = () => {
    setEditingEnv(null);
    form.resetFields();
    form.setFieldsValue({ port: 3306, db_type: 'mysql' });
    setModalVisible(true);
  };

  const handleEdit = (record: Environment) => {
    setEditingEnv(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await envApi.delete(id);
      message.success('删除成功');
      fetchEnvironments();
    } catch (e: any) {
      message.error('删除失败: ' + e.message);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      await envApi.test(id);
      setTestResults(prev => ({ ...prev, [id]: true }));
      message.success('连接测试成功');
    } catch (e: any) {
      setTestResults(prev => ({ ...prev, [id]: false }));
      message.error('连接测试失败: ' + e.message);
    } finally {
      setTestingId(null);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingEnv) {
        await envApi.update(editingEnv.id, values);
        message.success('更新成功');
      } else {
        await envApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchEnvironments();
    } catch (e: any) {
      if (e.message) {
        message.error('操作失败: ' + e.message);
      }
    }
  };

  const columns = [
    {
      title: '环境名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: '数据库类型',
      dataIndex: 'db_type',
      key: 'db_type',
      render: (type: string) => (
        <Tag color={type === 'mysql' ? 'blue' : type === 'doris' ? 'green' : 'default'}>
          {type?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '主机地址',
      key: 'host_info',
      render: (_: any, record: Environment) => `${record.host}:${record.port}`,
    },
    {
      title: '数据库',
      dataIndex: 'database_name',
      key: 'database_name',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '连接状态',
      key: 'status',
      width: 110,
      render: (_: any, record: Environment) => {
        if (testResults[record.id] === true) {
          return <Tag icon={<CheckCircleOutlined />} color="success">已连接</Tag>;
        }
        if (testResults[record.id] === false) {
          return <Tag icon={<CloseCircleOutlined />} color="error">失败</Tag>;
        }
        return <Tag color="default">未测试</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: Environment) => (
        <Space size={0}>
          <Button
            type="link"
            size="small"
            icon={<ApiOutlined />}
            loading={testingId === record.id}
            onClick={() => handleTest(record.id)}
          >
            测试
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除该环境？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <span>
            <DatabaseOutlined style={{ marginRight: 8 }} />
            环境管理
          </span>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加环境
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={environments}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>

      <Modal
        title={editingEnv ? '编辑环境' : '添加环境'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={640}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="环境名称" rules={[{ required: true, message: '请输入环境名称' }]}>
                <Input placeholder="如: 生产环境、测试环境" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="db_type" label="数据库类型" rules={[{ required: true, message: '请选择数据库类型' }]}>
                <Select options={[
                  { value: 'mysql', label: 'MySQL' },
                  { value: 'doris', label: 'Doris' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="host" label="主机地址" rules={[{ required: true, message: '请输入主机地址' }]}>
                <Input placeholder="如: 10.66.28.175" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="port" label="端口" rules={[{ required: true, message: '请输入端口' }]}>
                <InputNumber min={1} max={65535} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="database_name" label="数据库名" rules={[{ required: true, message: '请输入数据库名' }]}>
            <Input placeholder="如: dolphinscheduler" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input placeholder="如: dsru" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="环境描述信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EnvironmentPage;
