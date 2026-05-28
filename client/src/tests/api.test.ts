import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Request failed');
  }
  return data.data as T;
}

describe('API request utility', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should make successful GET request and return data', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: [{ id: '1', name: 'test' }] }),
    });

    const result = await request('/test');
    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual([{ id: '1', name: 'test' }]);
  });

  it('should make POST request with body', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: { id: 'new-id' } }),
    });

    const result = await request('/test', {
      method: 'POST',
      body: JSON.stringify({ name: 'new' }),
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({ name: 'new' }),
    });
    expect(result).toEqual({ id: 'new-id' });
  });

  it('should throw error when success is false', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: false, message: 'Not found' }),
    });

    await expect(request('/test')).rejects.toThrow('Not found');
  });

  it('should throw default error message when success is false and no message', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: false }),
    });

    await expect(request('/test')).rejects.toThrow('Request failed');
  });

  it('should make PUT request', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: null }),
    });

    await request('/test/1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'updated' }),
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
      body: JSON.stringify({ name: 'updated' }),
    });
  });

  it('should make DELETE request', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: null }),
    });

    await request('/test/1', { method: 'DELETE' });

    expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
      headers: { 'Content-Type': 'application/json' },
      method: 'DELETE',
    });
  });
});
