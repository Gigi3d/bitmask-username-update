/**
 * Tests for Step1Form component
 * 
 * Tests the old username verification flow
 */

import { describe, it, expect, beforeEach, vi } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Step1Form from '@/components/Step1Form';

// Mock fetch
global.fetch = vi.fn();

describe('Step1Form', () => {
  const mockOnNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form with input and button', () => {
    render(<Step1Form onNext={mockOnNext} />);
    
    expect(screen.getByLabelText(/old bitmask username/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('should show error if username is empty', async () => {
    render(<Step1Form onNext={mockOnNext} />);
    
    const submitButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter your old bitmask username/i)).toBeInTheDocument();
    });
    
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  it('should show error if username is invalid length', async () => {
    render(<Step1Form onNext={mockOnNext} />);
    
    const input = screen.getByLabelText(/old bitmask username/i);
    fireEvent.change(input, { target: { value: 'a'.repeat(51) } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/username must be between 1 and 50 characters/i)).toBeInTheDocument();
    });
  });

  it('should call API to verify username', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ valid: true, message: 'Old username verified' }),
    });

    render(<Step1Form onNext={mockOnNext} />);
    
    const input = screen.getByLabelText(/old bitmask username/i);
    fireEvent.change(input, { target: { value: 'testuser' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users/verify-old-username',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldUsername: 'testuser' }),
        })
      );
    });
  });

  it('should show loading state during verification', async () => {
    (global.fetch as any).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ valid: true }),
      }), 100))
    );

    render(<Step1Form onNext={mockOnNext} />);
    
    const input = screen.getByLabelText(/old bitmask username/i);
    fireEvent.change(input, { target: { value: 'testuser' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/verifying username in database/i)).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /verifying/i })).toBeDisabled();
  });

  it('should show error if username not found', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        valid: false, 
        message: 'Old username not found in campaign records' 
      }),
    });

    render(<Step1Form onNext={mockOnNext} />);
    
    const input = screen.getByLabelText(/old bitmask username/i);
    fireEvent.change(input, { target: { value: 'nonexistent' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/not found in campaign records/i)).toBeInTheDocument();
    });
    
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  it('should call onNext if verification succeeds', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ valid: true, message: 'Old username verified' }),
    });

    render(<Step1Form onNext={mockOnNext} />);
    
    const input = screen.getByLabelText(/old bitmask username/i);
    fireEvent.change(input, { target: { value: 'testuser' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalledWith('testuser');
    });
  });
});








