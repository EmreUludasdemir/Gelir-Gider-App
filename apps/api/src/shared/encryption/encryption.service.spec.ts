import { Logger } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(() => {
    process.env.BANK_ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok';
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    service = new EncryptionService();
  });

  afterEach(() => {
    delete process.env.BANK_ENCRYPTION_KEY;
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const plaintext = 'my-secret-token-12345';
      
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
      expect(encrypted).not.toBe(plaintext);
    });

    it('should produce different ciphertexts for same plaintext (random IV)', () => {
      const plaintext = 'test-token';
      
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);
      
      expect(encrypted1).not.toBe(encrypted2);
      expect(service.decrypt(encrypted1)).toBe(plaintext);
      expect(service.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      expect(service.encrypt('')).toBe('');
      expect(service.decrypt('')).toBe('');
    });

    it('should handle Turkish characters', () => {
      const plaintext = 'Türkçe karakterler: şİğÜöÇ';
      
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle long tokens', () => {
      const plaintext = 'a'.repeat(1000);
      
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should throw on tampered ciphertext', () => {
      const plaintext = 'secret-data';
      const encrypted = service.encrypt(plaintext);
      
      // Tamper with the encrypted data
      const tampered = encrypted.slice(0, -4) + 'XXXX';
      
      expect(() => service.decrypt(tampered)).toThrow('Decryption failed');
    });
  });

  describe('isEncrypted', () => {
    it('should detect encrypted data', () => {
      const encrypted = service.encrypt('test-data');
      
      expect(service.isEncrypted(encrypted)).toBe(true);
    });

    it('should reject plain text', () => {
      expect(service.isEncrypted('plain-text')).toBe(false);
      expect(service.isEncrypted('')).toBe(false);
    });

    it('should reject short base64', () => {
      expect(service.isEncrypted('YWJj')).toBe(false); // 'abc' in base64
    });
  });

  describe('generateKey', () => {
    it('should generate a 64-character hex key', () => {
      const key = EncryptionService.generateKey();
      
      expect(key).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(key)).toBe(true);
    });

    it('should generate unique keys', () => {
      const key1 = EncryptionService.generateKey();
      const key2 = EncryptionService.generateKey();
      
      expect(key1).not.toBe(key2);
    });
  });
});
