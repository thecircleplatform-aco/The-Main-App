/** ACO code roles - shared by client and server (no DB dependency). */
export const ACO_ROLES = ["user", "tester", "developer", "partner"] as const;
export type AcoRole = (typeof ACO_ROLES)[number];
