// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DescriptionPanel from '../DescriptionPanel';

function renderPanel(onClose = vi.fn()) {
  return { onClose, ...render(<MemoryRouter><DescriptionPanel onClose={onClose} /></MemoryRouter>) };
}

describe('DescriptionPanel', () => {
  it('renders title and description', () => {
    renderPanel();
    expect(screen.getByText('VTuber 生物分類系統')).toBeTruthy();
    expect(screen.getByText(/角色形象對應到生物分類學體系/)).toBeTruthy();
  });

  it('renders about link', () => {
    renderPanel();
    const link = screen.getByText('關於本站');
    expect(link.getAttribute('href')).toBe('/about');
  });

  it('calls onClose when close button clicked', () => {
    const { onClose } = renderPanel();
    fireEvent.click(screen.getByTestId('description-close'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
