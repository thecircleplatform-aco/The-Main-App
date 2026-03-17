/**
 * Password hashing utilities (bcrypt).
 */

import * as bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/** Hash a plain password for storage. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Verify a plain password against a stored hash. */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
