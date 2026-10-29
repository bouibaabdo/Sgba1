import type { JwtSignOptions } from '@nestjs/jwt';

const MIN_JWT_SECRET_BYTES = 32;
const JWT_EXPIRES_IN_PATTERN = /^\d+(?:\.\d+)?\s*(?:ms|s|m|h|d|w|y)$/i;

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret || Buffer.byteLength(secret, 'utf8') < MIN_JWT_SECRET_BYTES) {
    throw new Error(
      'JWT_SECRET must be set to a random value of at least 32 bytes in backend/.env.',
    );
  }

  return secret;
}

export function getJwtExpiresIn(): JwtSignOptions['expiresIn'] {
  const expiresIn = process.env.JWT_EXPIRES_IN?.trim() || '15m';

  if (!JWT_EXPIRES_IN_PATTERN.test(expiresIn)) {
    throw new Error('JWT_EXPIRES_IN must use a duration such as 15m, 12h, or 7d.');
  }

  return expiresIn as JwtSignOptions['expiresIn'];
}
