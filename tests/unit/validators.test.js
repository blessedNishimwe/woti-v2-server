/**
 * Unit Tests for Validators
 */

const validators = require('../../src/utils/validators');

describe('Validators', () => {
  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      expect(validators.isValidEmail('test@example.com')).toBe(true);
      expect(validators.isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validators.isValidEmail('invalid')).toBe(false);
      expect(validators.isValidEmail('@example.com')).toBe(false);
      expect(validators.isValidEmail('test@')).toBe(false);
    });
  });

  describe('isValidCoordinates', () => {
    it('should validate correct coordinates', () => {
      expect(validators.isValidCoordinates(-1.9536, 30.0606)).toBe(true);
      expect(validators.isValidCoordinates(0, 0)).toBe(true);
    });

    it('should reject invalid coordinates', () => {
      expect(validators.isValidCoordinates(91, 30)).toBe(false);
      expect(validators.isValidCoordinates(-91, 30)).toBe(false);
      expect(validators.isValidCoordinates(45, 181)).toBe(false);
      expect(validators.isValidCoordinates(45, -181)).toBe(false);
    });
  });

  describe('isValidRole', () => {
    it('should validate correct roles', () => {
      expect(validators.isValidRole('admin')).toBe(true);
      expect(validators.isValidRole('supervisor')).toBe(true);
      expect(validators.isValidRole('tester')).toBe(true);
    });

    it('should reject invalid roles', () => {
      expect(validators.isValidRole('invalid')).toBe(false);
      expect(validators.isValidRole('superadmin')).toBe(false);
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUID', () => {
      expect(validators.isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should reject invalid UUID', () => {
      expect(validators.isValidUUID('invalid-uuid')).toBe(false);
      expect(validators.isValidUUID('12345')).toBe(false);
    });
  });
});
