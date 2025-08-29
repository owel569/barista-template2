
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export class SecurityUtils {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    return bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  static generateRequestId(): string {
    return crypto.randomUUID();
  }

  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Supprimer les balises HTML basiques
      .trim();
  }

  static validateCSRFToken(token: string, sessionToken: string): boolean {
    return token === sessionToken;
  }

  static isStrongPassword(password: string): boolean {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }

  static maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const masked = { ...data };

    for (const [key, value] of Object.entries(masked)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        masked[key] = '[MASKED]';
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskSensitiveData(value as Record<string, unknown>);
      }
    }

    return masked;
  }

  static generateApiKey(): string {
    const prefix = 'bcp_'; // Barista Café Pro
    const randomPart = crypto.randomBytes(24).toString('base64url');
    return `${prefix}${randomPart}`;
  }

  static validateApiKey(apiKey: string): boolean {
    return apiKey.startsWith('bcp_') && apiKey.length === 36;
  }
}
