import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { DolphinIcon, EnvIcon, ChartIcon, IndicatorIcon, DashboardIcon } from '../components/Icons';

describe('Icons Components', () => {
  it('DolphinIcon should render SVG', () => {
    const { container } = render(<DolphinIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('width')).toBe('28');
    expect(svg?.getAttribute('height')).toBe('28');
  });

  it('EnvIcon should render SVG', () => {
    const { container } = render(<EnvIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('width')).toBe('16');
  });

  it('ChartIcon should render SVG', () => {
    const { container } = render(<ChartIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('IndicatorIcon should render SVG', () => {
    const { container } = render(<IndicatorIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('DashboardIcon should render SVG', () => {
    const { container } = render(<DashboardIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
