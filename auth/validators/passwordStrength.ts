/**
 * Password strength validation using zxcvbn.
 * Usable on server (register API) and client (real-time signup UI).
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const zxcvbn = require("zxcvbn") as (password: string) => {
  score: number;
  feedback: { suggestions?: string[]; warning?: string };
};

export type PasswordStrengthResult = {
  score: number;
  percentage: number;
  label: string;
  suggestions: string[];
};

const SCORE_LABELS: Record<number, string> = {
  0: "Very Weak",
  1: "Weak",
  2: "Medium",
  3: "Strong",
  4: "Very Strong",
};

/**
 * Map zxcvbn score (0–4) to percentage (0–100) using midpoints of ranges:
 * 0 → 10, 1 → 30, 2 → 50, 3 → 70, 4 → 90
 */
function scoreToPercentage(score: number): number {
  const map: Record<number, number> = {
    0: 10,
    1: 30,
    2: 50,
    3: 70,
    4: 90,
  };
  return map[Math.max(0, Math.min(4, Math.floor(score)))] ?? 0;
}

/**
 * Evaluate password strength with zxcvbn.
 * Returns score (0–4), percentage (0–100), label, and suggestions.
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      percentage: 0,
      label: SCORE_LABELS[0],
      suggestions: ["Enter a password to see strength"],
    };
  }
  const result = zxcvbn(password);
  const score = Math.max(0, Math.min(4, result.score));
  const percentage = scoreToPercentage(score);
  const suggestions = Array.isArray(result.feedback?.suggestions)
    ? result.feedback.suggestions
    : [];
  if (result.feedback?.warning && !suggestions.includes(result.feedback.warning)) {
    suggestions.unshift(result.feedback.warning);
  }
  return {
    score,
    percentage,
    label: SCORE_LABELS[score],
    suggestions,
  };
}

/** Minimum percentage required for signup (40 = Weak/Medium boundary). */
export const MIN_STRENGTH_PERCENTAGE = 40;

/**
 * Returns true if the password is strong enough for signup (percentage >= 40).
 */
export function isPasswordStrongEnough(password: string): boolean {
  return getPasswordStrength(password).percentage >= MIN_STRENGTH_PERCENTAGE;
}
