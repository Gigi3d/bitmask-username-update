/**
 * Tests for /api/users/verify endpoint
 * 
 * Tests the verification of telegram account matching old username
 */

import { describe, it, expect } from '@jest/globals';

describe('POST /api/users/verify', () => {
  describe('Validation', () => {
    it('should return 400 if telegramAccount is missing', async () => {
      const response = await fetch('/api/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldUsername: 'test' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.valid).toBe(false);
      expect(data.message).toContain('Telegram account');
    });

    it('should return 400 if oldUsername is missing', async () => {
      const response = await fetch('/api/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramAccount: '@test' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.valid).toBe(false);
      expect(data.message).toContain('Old username');
    });
  });

  describe('Matching Logic', () => {
    it('should return valid: false if telegram account not found', async () => {
      const response = await fetch('/api/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldUsername: 'testuser',
          telegramAccount: '@nonexistent' 
        }),
      });
      
      const data = await response.json();
      expect(data.valid).toBe(false);
      expect(data.message).toContain('not found');
    });

    it('should return valid: false if telegram account does not match old username', async () => {
      const response = await fetch('/api/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldUsername: 'wrong_user',
          telegramAccount: '@correct_telegram' 
        }),
      });
      
      const data = await response.json();
      expect(data.valid).toBe(false);
      expect(data.message).toContain('does not match');
      expect(data.expectedUsername).toBeDefined();
    });

    it('should return valid: true if telegram account matches old username', async () => {
      const response = await fetch('/api/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldUsername: 'correct_user',
          telegramAccount: '@correct_telegram' 
        }),
      });
      
      const data = await response.json();
      if (data.valid) {
        expect(data.data).toBeDefined();
        expect(data.data.oldUsername).toBe('correct_user');
        expect(data.data.telegramAccount).toBeDefined();
      }
    });

    it('should normalize telegram account (remove @, lowercase)', async () => {
      const response1 = await fetch('/api/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldUsername: 'testuser',
          telegramAccount: '@TestUser' 
        }),
      });
      
      const response2 = await fetch('/api/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldUsername: 'testuser',
          telegramAccount: 'testuser' 
        }),
      });
      
      const data1 = await response1.json();
      const data2 = await response2.json();
      
      // Both should produce the same result
      expect(data1.valid).toBe(data2.valid);
    });

    it('should be case-insensitive when matching old username', async () => {
      const response1 = await fetch('/api/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldUsername: 'TestUser',
          telegramAccount: '@test' 
        }),
      });
      
      const response2 = await fetch('/api/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldUsername: 'testuser',
          telegramAccount: '@test' 
        }),
      });
      
      const data1 = await response1.json();
      const data2 = await response2.json();
      
      expect(data1.valid).toBe(data2.valid);
    });
  });
});







