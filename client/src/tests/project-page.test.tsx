import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

vi.mock('echarts-for-react', () => ({
  default: () => React.createElement('div', { 'data-testid': 'echarts-mock' }, 'Chart'),
}));

import ProjectPage from '../pages/ProjectPage';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ConfigProvider locale={zhCN}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </ConfigProvider>
);

describe('ProjectPage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: [] }),
    });
  });

  it('should render project page with title', async () => {
    render(<ProjectPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('执行趋势')).toBeInTheDocument();
    });
  });

  it('should show project stats table', async () => {
    render(<ProjectPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('项目调度统计')).toBeInTheDocument();
      expect(screen.getByText('任务级统计')).toBeInTheDocument();
    });
  });

  it('should render echarts mock for trend chart', async () => {
    render(<ProjectPage />, { wrapper });

    await waitFor(() => {
      const charts = screen.getAllByTestId('echarts-mock');
      expect(charts.length).toBeGreaterThanOrEqual(1);
    });
  });
});
