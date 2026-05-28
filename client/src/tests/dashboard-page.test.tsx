import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

vi.mock('echarts-for-react', () => ({
  default: () => React.createElement('div', { 'data-testid': 'echarts-mock' }, 'Chart'),
}));

import DashboardPage from '../pages/DashboardPage';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ConfigProvider locale={zhCN}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </ConfigProvider>
);

describe('DashboardPage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: [] }),
    });
  });

  it('should render dashboard page with charts', async () => {
    render(<DashboardPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('按小时执行分布')).toBeInTheDocument();
    });
  });

  it('should show all chart sections', async () => {
    render(<DashboardPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('按小时执行分布')).toBeInTheDocument();
      expect(screen.getByText('Worker组任务分布')).toBeInTheDocument();
      expect(screen.getByText('主机任务分布与耗时')).toBeInTheDocument();
      expect(screen.getByText('任务类型分布')).toBeInTheDocument();
    });
  });

  it('should show table sections', async () => {
    render(<DashboardPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('流程耗时统计 (Top 50)')).toBeInTheDocument();
      expect(screen.getByText('失败任务分析 (Top 20)')).toBeInTheDocument();
    });
  });

  it('should render echarts mock components', async () => {
    render(<DashboardPage />, { wrapper });

    await waitFor(() => {
      const charts = screen.getAllByTestId('echarts-mock');
      expect(charts.length).toBeGreaterThanOrEqual(4);
    });
  });
});
