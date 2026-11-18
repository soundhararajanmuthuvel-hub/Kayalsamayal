"use client";

export const ADMIN_STORAGE_KEY = "kayal_admin_authenticated";
export const ADMIN_USER_KEY = "kayal_admin_username";

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(ADMIN_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function getAdminUser(): string {
  if (typeof window === "undefined") return "admin";
  try {
    return localStorage.getItem(ADMIN_USER_KEY) || "admin";
  } catch {
    return "admin";
  }
}

export function loginAdmin(username: string, password: string): { success: boolean; error?: string } {
  const configuredUser = (process.env.NEXT_PUBLIC_ADMIN_USERNAME || "admin").trim();
  const configuredPass = (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin@kayal2026").trim();

  const u = (username || "").trim();
  const p = (password || "").trim();

  if (u === configuredUser && p === configuredPass) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(ADMIN_STORAGE_KEY, "true");
        localStorage.setItem(ADMIN_USER_KEY, u);
      } catch (e) {
        console.error("Storage error", e);
      }
    }
    return { success: true };
  }

  return { success: false, error: "Invalid admin username or password" };
}

export function logoutAdmin(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
    } catch (e) {
      console.error("Storage error", e);
    }
  }
}
