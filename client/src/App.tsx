import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppLayout from './layouts/AppLayout';
import EnvironmentPage from './pages/EnvironmentPage';
import ProjectPage from './pages/ProjectPage';
import IndicatorPage from './pages/IndicatorPage';
import DashboardPage from './pages/DashboardPage';
import AlertCenterPage from './pages/AlertCenterPage';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN} theme={{
      token: {
        colorPrimary: '#1890ff',
        borderRadius: 6,
      },
    }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="environments" element={<EnvironmentPage />} />
            <Route path="projects" element={<ProjectPage />} />
            <Route path="indicators" element={<IndicatorPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="alerts" element={<AlertCenterPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
