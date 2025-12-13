import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import * as crypto from "crypto";
import { PrismaService } from "../../prisma.service";

// Simple TOTP implementation without external dependency
// In production, consider using 'otplib' package

interface TOTPConfig {
  secret: string;
  digits: number;
  period: number;
}

@Injectable()
export class TwoFactorService {
  private readonly DIGITS = 6;
  private readonly PERIOD = 30; // seconds
  private readonly BACKUP_CODES_COUNT = 10;

  constructor(private prisma: PrismaService) {}

  // Generate a random secret for TOTP
  generateSecret(): string {
    const buffer = crypto.randomBytes(20);
    return this.base32Encode(buffer);
  }

  // Generate QR code URL for authenticator apps
  generateQRCodeUrl(email: string, secret: string): string {
    const issuer = "Gelir-Gider Takip";
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(email);
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&digits=${this.DIGITS}&period=${this.PERIOD}`;
  }

  // Generate current TOTP code
  generateTOTP(secret: string, timestamp?: number): string {
    const time = Math.floor((timestamp || Date.now()) / 1000 / this.PERIOD);
    const decodedSecret = this.base32Decode(secret);

    // Create HMAC
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeBigUInt64BE(BigInt(time));

    const hmac = crypto.createHmac("sha1", decodedSecret);
    hmac.update(timeBuffer);
    const hash = hmac.digest();

    // Dynamic truncation
    const offset = hash[hash.length - 1] & 0x0f;
    const code =
      (((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff)) %
      Math.pow(10, this.DIGITS);

    return code.toString().padStart(this.DIGITS, "0");
  }

  // Verify TOTP code with time window
  verifyTOTP(secret: string, code: string): boolean {
    const now = Date.now();

    // Check current and adjacent time windows
    for (let i = -1; i <= 1; i++) {
      const timestamp = now + i * this.PERIOD * 1000;
      if (this.generateTOTP(secret, timestamp) === code) {
        return true;
      }
    }

    return false;
  }

  // Generate backup codes
  generateBackupCodes(): { codes: string[]; hashedCodes: string[] } {
    const codes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      const code = crypto.randomBytes(4).toString("hex").toUpperCase();
      codes.push(code);
      hashedCodes.push(this.hashBackupCode(code));
    }

    return { codes, hashedCodes };
  }

  // Hash a backup code for storage
  private hashBackupCode(code: string): string {
    return crypto.createHash("sha256").update(code).digest("hex");
  }

  // Verify and consume a backup code
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { backupCodes: true },
    });

    if (!user?.backupCodes) return false;

    const hashedCodes: string[] = JSON.parse(user.backupCodes);
    const hashedInput = this.hashBackupCode(code.toUpperCase());
    const index = hashedCodes.indexOf(hashedInput);

    if (index === -1) return false;

    // Remove used backup code
    hashedCodes.splice(index, 1);
    await this.prisma.user.update({
      where: { id: userId },
      data: { backupCodes: JSON.stringify(hashedCodes) },
    });

    return true;
  }

  // Enable 2FA for a user
  async enable2FA(
    userId: string,
    code: string
  ): Promise<{ success: boolean; backupCodes?: string[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) throw new BadRequestException("User not found");
    if (user.twoFactorEnabled)
      throw new BadRequestException("2FA is already enabled");
    if (!user.twoFactorSecret)
      throw new BadRequestException("2FA setup not initiated");

    // Verify the code
    if (!this.verifyTOTP(user.twoFactorSecret, code)) {
      throw new UnauthorizedException("Invalid verification code");
    }

    // Generate backup codes
    const { codes, hashedCodes } = this.generateBackupCodes();

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        backupCodes: JSON.stringify(hashedCodes),
      },
    });

    return { success: true, backupCodes: codes };
  }

  // Disable 2FA for a user
  async disable2FA(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) throw new BadRequestException("User not found");
    if (!user.twoFactorEnabled)
      throw new BadRequestException("2FA is not enabled");

    // Verify the code
    if (!this.verifyTOTP(user.twoFactorSecret!, code)) {
      throw new UnauthorizedException("Invalid verification code");
    }

    // Disable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
      },
    });

    return true;
  }

  // Base32 encoding/decoding
  private base32Encode(buffer: Buffer): string {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let result = "";
    let bits = 0;
    let value = 0;

    for (const byte of buffer) {
      value = (value << 8) | byte;
      bits += 8;

      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 31];
    }

    return result;
  }

  private base32Decode(encoded: string): Buffer {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const bytes: number[] = [];
    let bits = 0;
    let value = 0;

    for (const char of encoded.toUpperCase()) {
      const index = alphabet.indexOf(char);
      if (index === -1) continue;

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(bytes);
  }
}
