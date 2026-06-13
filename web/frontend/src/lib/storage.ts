export type ScopedStorageResource =
  | "profile"
  | "applications"
  | "savedJobs"
  | "cvIds"
  | "lastCvId";

export function normalizeUserKey(userId?: string | null): string {
  const normalized = userId?.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  return normalized || "demo-user";
}

export function buildStorageKey(
  userId: string | null | undefined,
  resource: ScopedStorageResource
): string {
  return `vica:${normalizeUserKey(userId)}:${resource}`;
}
