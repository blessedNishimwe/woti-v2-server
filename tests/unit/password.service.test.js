/**
 * Unit Tests for Password Service
 */

const passwordService = require('../../src/modules/auth/password.service');

describe('Password Service', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'Test@123';
      const hash = await passwordService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'Test@123';
      const hash1 = await passwordService.hashPassword(password);
      const hash2 = await passwordService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'Test@123';
      const hash = await passwordService.hashPassword(password);
      const isMatch = await passwordService.comparePassword(password, hash);
      
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'Test@123';
      const wrongPassword = 'Wrong@123';
      const hash = await passwordService.hashPassword(password);
      const isMatch = await passwordService.comparePassword(wrongPassword, hash);
      
      expect(isMatch).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate a strong password', () => {
      const result = passwordService.validatePasswordStrength('Test@123');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password without uppercase', () => {
      const result = passwordService.validatePasswordStrength('test@123');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject password without special character', () => {
      const result = passwordService.validatePasswordStrength('Test1234');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject short password', () => {
      const result = passwordService.validatePasswordStrength('Test@1');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
