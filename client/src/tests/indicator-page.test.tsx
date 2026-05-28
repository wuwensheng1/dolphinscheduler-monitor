import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

vi.mock('echarts-for-react', () => ({
  default: () => React.createElement('div', { 'data-testid': 'echarts-mock' }, 'Chart'),
}));

import IndicatorPage from '../pages/IndicatorPage';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ConfigProvider locale={zhCN}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </ConfigProvider>
);

describe('IndicatorPage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: [] }),
    });
  });

  it('should render indicator page with title', async () => {
    render(<IndicatorPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('指标配置')).toBeInTheDocument();
    });
  });

  it('should show add indicator button', async () => {
    render(<IndicatorPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('添加指标')).toBeInTheDocument();
    });
  });

  it('should show evaluate button', async () => {
    render(<IndicatorPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('执行评估')).toBeInTheDocument();
    });
  });

  it('should display indicators from API', async () => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        data: [{
          id: '1',
          name: '生产环境',
          host: '10.0.0.1',
          port: 3306,
          database_name: 'ds',
          username: 'root',
          password: 'root',
          db_type: 'mysql',
          description: '',
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        }],
      }),
    });
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        data: [{
          id: 'ind-1',
          env_id: '1',
          name: '日成功率',
          description: '每日调度成功率',
          sql_text: 'SELECT 95',
          result_type: 'number',
          min_value: 90,
          max_value: 100,
          min_sql: null,
          max_sql: null,
          weight: 1.0,
          sort_order: 0,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        }],
      }),
    });

    render(<IndicatorPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('日成功率')).toBeInTheDocument();
    });
  });
});
