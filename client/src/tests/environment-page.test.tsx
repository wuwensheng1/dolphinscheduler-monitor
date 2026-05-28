import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import EnvironmentPage from '../pages/EnvironmentPage';
import '@testing-library/jest-dom/vitest';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ConfigProvider locale={zhCN}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </ConfigProvider>
);

describe('EnvironmentPage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should render environment management page', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    render(<EnvironmentPage />, { wrapper });

    expect(screen.getByText('环境管理')).toBeInTheDocument();
    expect(screen.getByText('添加环境')).toBeInTheDocument();
  });

  it('should display environments from API', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        data: [{
          id: '1',
          name: '生产环境',
          host: '10.0.0.1',
          port: 3306,
          database_name: 'dolphinscheduler',
          username: 'root',
          password: 'root',
          db_type: 'mysql',
          description: '测试',
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        }],
      }),
    });

    render(<EnvironmentPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('生产环境')).toBeInTheDocument();
    });
  });

  it('should show empty table when no environments', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    render(<EnvironmentPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('添加环境')).toBeInTheDocument();
    });
  });

  it('should display database type tag', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        data: [{
          id: '1',
          name: 'Doris环境',
          host: '10.0.0.2',
          port: 9030,
          database_name: 'test_db',
          username: 'root',
          password: 'root',
          db_type: 'doris',
          description: '',
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        }],
      }),
    });

    render(<EnvironmentPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('DORIS')).toBeInTheDocument();
    });
  });
});
