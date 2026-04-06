// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NoResultsOverlay from '../NoResultsOverlay';

describe('NoResultsOverlay', () => {
  it('renders no-results message', () => {
    render(<NoResultsOverlay onClearFilters={vi.fn()} />);
    expect(screen.getByText('沒有符合條件的結果')).toBeTruthy();
    expect(screen.getByText('請嘗試調整篩選條件或清除篩選')).toBeTruthy();
  });

  it('renders clear filters button', () => {
    render(<NoResultsOverlay onClearFilters={vi.fn()} />);
    expect(screen.getByText('清除全部篩選')).toBeTruthy();
  });

  it('calls onClearFilters when button clicked', () => {
    const onClear = vi.fn();
    render(<NoResultsOverlay onClearFilters={onClear} />);
    fireEvent.click(screen.getByTestId('clear-filters'));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
