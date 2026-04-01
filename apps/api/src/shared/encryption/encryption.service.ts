import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { getEncryptionSecret } from '../security/security.config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly encryptionKey: string;

  constructor() {
    this.encryptionKey = getEncryptionSecret();
  }

  /**
   * Derive a key from password and salt using PBKDF2
   */
  private deriveKey(salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(this.encryptionKey, salt, 100000, KEY_LENGTH, 'sha256');
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   * Returns: salt:iv:tag:ciphertext (base64 encoded)
   */
  encrypt(plaintext: string): string {
    if (!plaintext) return '';

    try {
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);
      const key = this.deriveKey(salt);

      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      const tag = cipher.getAuthTag();

      // Combine: salt + iv + tag + ciphertext
      const combined = Buffer.concat([
        salt,
        iv,
        tag,
        Buffer.from(encrypted, 'base64')
      ]);

      return combined.toString('base64');
    } catch (error) {
      this.logger.error('Encryption failed', error instanceof Error ? error.stack : undefined);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data encrypted with encrypt()
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData) return '';

    try {
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract parts
      const salt = combined.subarray(0, SALT_LENGTH);
      const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
      const ciphertext = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

      const key = this.deriveKey(salt);

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error('Decryption failed', error instanceof Error ? error.stack : undefined);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Check if a string appears to be encrypted (base64 with correct length)
   */
  isEncrypted(data: string): boolean {
    if (!data) return false;
    try {
      const decoded = Buffer.from(data, 'base64');
      // Minimum length: salt + iv + tag + at least 1 byte
      return decoded.length > SALT_LENGTH + IV_LENGTH + TAG_LENGTH;
    } catch {
      return false;
    }
  }

  /**
   * Generate a secure random key for BANK_ENCRYPTION_KEY
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
