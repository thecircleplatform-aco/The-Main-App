/**
 * ACO (Access Code) invitation codes: validate, apply role, log usage.
 */

import { query } from "@/database/db";
import { ACO_ROLES, type AcoRole } from "@/auth/constants/acoRoles";

export { ACO_ROLES, type AcoRole };

export type ValidatedAcoCode = {
  id: string;
  code: string;
  role: AcoRole;
};

const INVALID_MESSAGE = "Invalid or expired ACO code.";

/**
 * Validate ACO code: exists, not disabled, not expired, under usage limit.
 * Returns the code record for role assignment, or null if invalid.
 */
export async function validateAcoCode(
  codeInput: string
): Promise<{ ok: true; code: ValidatedAcoCode } | { ok: false; error: string }> {
  const trimmed = codeInput?.trim();
  if (!trimmed) {
    return { ok: false, error: INVALID_MESSAGE };
  }

  const res = await query<{
    id: string;
    code: string;
    role: string;
    uses_limit: number;
    uses_count: number;
    expires_at: string | null;
    disabled: boolean;
  }>(
    `SELECT id, code, role, uses_limit, uses_count, expires_at, disabled
     FROM aco_codes WHERE lower(trim(code)) = lower(trim($1))`,
    [trimmed]
  );
  const row = res.rows[0];
  if (!row) {
    return { ok: false, error: INVALID_MESSAGE };
  }
  if (row.disabled) {
    return { ok: false, error: INVALID_MESSAGE };
  }
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { ok: false, error: INVALID_MESSAGE };
  }
  if (row.uses_limit > 0 && row.uses_count >= row.uses_limit) {
    return { ok: false, error: INVALID_MESSAGE };
  }
  if (!ACO_ROLES.includes(row.role as AcoRole)) {
    return { ok: false, error: INVALID_MESSAGE };
  }

  return {
    ok: true,
    code: {
      id: row.id,
      code: row.code,
      role: row.role as AcoRole,
    },
  };
}

/**
 * After successful signup: increment uses_count and log usage.
 */
export async function recordAcoCodeUsage(codeId: string, userId: string): Promise<void> {
  await query(
    `UPDATE aco_codes SET uses_count = uses_count + 1 WHERE id = $1`,
    [codeId]
  );
  await query(
    `INSERT INTO aco_code_logs (code_id, user_id) VALUES ($1, $2)`,
    [codeId, userId]
  );
}
