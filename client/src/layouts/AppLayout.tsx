import React, { useState } from 'react';
import { Layout, Menu, Select, message } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { EnvIcon, ChartIcon, IndicatorIcon, DashboardIcon, DolphinIcon, DolphinIconSmall, AlertIcon } from '../components/Icons';
import { envApi, Environment } from '../services/api';

const { Header, Sider, Content } = Layout;

export interface AppContextType {
  currentEnv: string;
  setCurrentEnv: (id: string) => void;
  environments: Environment[];
}

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [currentEnv, setCurrentEnv] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    envApi.list().then(data => {
      setEnvironments(data);
      if (data.length > 0 && !currentEnv) {
        setCurrentEnv(data[0].id);
      }
    }).catch(() => {
      message.error('Failed to load environments');
    });
  }, []);

  const menuItems = [
    {
      key: '/environments',
      icon: <EnvIcon style={{ marginRight: 10, fontSize: 18 }} />,
      label: '环境管理',
    },
    {
      key: '/projects',
      icon: <ChartIcon style={{ marginRight: 10, fontSize: 18 }} />,
      label: '项目调度',
    },
    {
      key: '/alerts',
      icon: <AlertIcon style={{ marginRight: 10, fontSize: 18 }} />,
      label: '告警中心',
    },
    {
      key: '/dashboard',
      icon: <DashboardIcon style={{ marginRight: 10, fontSize: 18 }} />,
      label: '综合评估',
    },
    {
      key: '/indicators',
      icon: <IndicatorIcon style={{ marginRight: 10, fontSize: 18 }} />,
      label: '指标判定',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleEnvChange = (value: string) => {
    setCurrentEnv(value);
  };

  const contextValue: AppContextType = {
    currentEnv,
    setCurrentEnv: handleEnvChange,
    environments,
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
        collapsedWidth={64}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}>
          {collapsed ? (
            <DolphinIconSmall />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <DolphinIcon />
              <span style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                marginLeft: 10,
                whiteSpace: 'nowrap',
              }}>
                DS Monitor
              </span>
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          inlineCollapsed={collapsed}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 64 : 220, transition: 'margin-left 0.2s' }}>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>
            DolphinScheduler 运行监控平台
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#666', fontSize: 14 }}>当前环境:</span>
            <Select
              value={currentEnv || undefined}
              onChange={handleEnvChange}
              style={{ width: 200 }}
              placeholder="请选择环境"
              options={environments.map(e => ({
                value: e.id,
                label: e.name,
              }))}
            />
          </div>
        </Header>
        <Content style={{
          margin: 16,
          padding: 20,
          background: '#fff',
          minHeight: 'calc(100vh - 64px - 32px)',
          borderRadius: 8,
          overflow: 'auto',
        }}>
          <Outlet context={contextValue} />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
