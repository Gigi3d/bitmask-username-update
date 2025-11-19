/**
 * Tests for Step2Form component
 * 
 * Tests the telegram account verification flow
 */

import { describe, it, expect, beforeEach, vi } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Step2Form from '@/components/Step2Form';

// Mock fetch
global.fetch = vi.fn();

describe('Step2Form', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();
  const oldUsername = 'testuser';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form with input and buttons', () => {
    render(<Step2Form onNext={mockOnNext} onBack={mockOnBack} oldUsername={oldUsername} />);
    
    expect(screen.getByLabelText(/telegram account/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('should display old username in helper text', () => {
    render(<Step2Form onNext={mockOnNext} onBack={mockOnBack} oldUsername={oldUsername} />);
    
    expect(screen.getByText(new RegExp(oldUsername, 'i'))).toBeInTheDocument();
  });

  it('should show error if telegram account is empty', async () => {
    render(<Step2Form onNext={mockOnNext} onBack={mockOnBack} oldUsername={oldUsername} />);
    
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/please enter your telegram account/i)).toBeInTheDocument();
    });
    
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  it('should call API with oldUsername and telegramAccount', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ valid: true, message: 'Verified' }),
    });

    render(<Step2Form onNext={mockOnNext} onBack={mockOnBack} oldUsername={oldUsername} />);
    
    const input = screen.getByLabelText(/telegram account/i);
    fireEvent.change(input, { target: { value: '@telegramuser' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users/verify',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            oldUsername: oldUsername,
            telegramAccount: '@telegramuser',
          }),
        })
      );
    });
  });

  it('should show error if telegram account does not match old username', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        valid: false, 
        message: 'Telegram account does not match the old username',
        expectedUsername: 'different_user',
      }),
    });

    render(<Step2Form onNext={mockOnNext} onBack={mockOnBack} oldUsername={oldUsername} />);
    
    const input = screen.getByLabelText(/telegram account/i);
    fireEvent.change(input, { target: { value: '@wrong_telegram' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/does not match/i)).toBeInTheDocument();
    });
    
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  it('should show loading state during verification', async () => {
    (global.fetch as any).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ valid: true }),
      }), 100))
    );

    render(<Step2Form onNext={mockOnNext} onBack={mockOnBack} oldUsername={oldUsername} />);
    
    const input = screen.getByLabelText(/telegram account/i);
    fireEvent.change(input, { target: { value: '@telegramuser' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/verifying telegram account matches username/i)).toBeInTheDocument();
    });
  });

  it('should call onNext if verification succeeds', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ valid: true, message: 'Verified' }),
    });

    render(<Step2Form onNext={mockOnNext} onBack={mockOnBack} oldUsername={oldUsername} />);
    
    const input = screen.getByLabelText(/telegram account/i);
    fireEvent.change(input, { target: { value: '@telegramuser' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalledWith('@telegramuser');
    });
  });

  it('should call onBack when back button is clicked', () => {
    render(<Step2Form onNext={mockOnNext} onBack={mockOnBack} oldUsername={oldUsername} />);
    
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    
    expect(mockOnBack).toHaveBeenCalled();
  });
});







