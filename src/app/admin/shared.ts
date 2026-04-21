/**
 * Shared utilities for the admin tabs.
 * Every tab lives under `src/app/admin/` and reuses this module.
 */

export function scoreColor(score: number): string {
  if (score >= 7) return "text-emerald-600";
  if (score >= 5) return "text-amber-600";
  return "text-red-600";
}

export function scoreBg(score: number): string {
  if (score >= 7) return "bg-emerald-50 border-emerald-200";
  if (score >= 5) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function authHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

export function tierColor(tier: string): string {
  switch (tier) {
    case "internal":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "enterprise":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "agency":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "trial":
    default:
      return "bg-zinc-50 text-zinc-700 border-zinc-200";
  }
}
