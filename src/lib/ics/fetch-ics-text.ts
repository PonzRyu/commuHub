const DEFAULT_TIMEOUT_MS = 8_000;

function isProbablyTextCalendar(contentType: string | null): boolean {
  if (!contentType) return true;
  const ct = contentType.toLowerCase();
  if (ct.includes("text/calendar")) return true;
  if (ct.includes("text/plain")) return true;
  if (ct.includes("application/octet-stream")) return true;
  return false;
}

export async function fetchIcsText(
  url: string,
  opts?: {
    timeoutMs?: number;
    revalidateSeconds?: number;
    /** true のとき Next.js の fetch データキャッシュを使わず取得元へ毎回取りに行く */
    bypassCache?: boolean;
  },
): Promise<string> {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const revalidateSeconds = opts?.revalidateSeconds ?? 300;
  const bypassCache = opts?.bypassCache ?? false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      ...(bypassCache
        ? { cache: "no-store" as const }
        : { next: { revalidate: revalidateSeconds } }),
    });
    if (!res.ok) throw new Error(`ICS fetch failed: ${res.status}`);
    if (!isProbablyTextCalendar(res.headers.get("content-type")))
      throw new Error("ICS fetch failed: invalid content-type");
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

