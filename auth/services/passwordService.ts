/**
 * Password hashing and verification. Wraps auth utils/hash for use by authService and others.
 */

import { hashPassword as hash, verifyPassword as verify } from "@/auth/utils/hash";

export const hashPassword = hash;
export const verifyPassword = verify;
