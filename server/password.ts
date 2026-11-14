import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

const SALT_BYTES = 16;
const KEY_BYTES = 64;
const SCHEME = 'scrypt';

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = (await scrypt(password, salt, KEY_BYTES)) as Buffer;
  return `${SCHEME}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== SCHEME) return false;

  const [, saltBase64, hashBase64] = parts;
  if (!saltBase64 || !hashBase64) return false;

  let expected: Buffer;
  try {
    expected = Buffer.from(hashBase64, 'base64');
  } catch {
    return false;
  }
  if (expected.length === 0) return false;

  const derived = (await scrypt(password, Buffer.from(saltBase64, 'base64'), expected.length)) as Buffer;
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
