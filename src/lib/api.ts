import { DEMO_USER_ID } from "./demo-constants";
import { useRelay } from "./store";

// NB: 127.0.0.1 (not "localhost") — on Windows "localhost" can resolve to IPv6
// ::1 where the Docker-published API (bound to IPv4 0.0.0.0) isn't listening,
// which makes every request hang for 30s and silently fall back to empty data.
const BASE =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_URL ??
  "http://127.0.0.1:8010";

export function getUserId(): string {
  if (typeof window !== "undefined") {
    return useRelay.getState().userId;
  }
  return DEMO_USER_ID;
}

export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const headers: Record<string, string> = {
    "X-User-Id": getUserId(),
    Accept: "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  let body: BodyInit | undefined = init?.body as BodyInit | undefined;
  if (init?.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.json);
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(`${BASE}${path}`, { ...init, headers, body, signal: ctrl.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${res.status}${text ? `: ${text.slice(0, 120)}` : ""}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export async function withFallback<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (e) {
    console.warn("[relay-api fallback]", e);
    return fallback;
  }
}

/** DELETE that tolerates an empty (204) body — `api()` would choke on JSON parse. */
export async function del(path: string): Promise<void> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "DELETE",
      headers: { "X-User-Id": getUserId(), Accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${res.status}${text ? `: ${text.slice(0, 120)}` : ""}`);
    }
  } finally {
    clearTimeout(t);
  }
}

type MediaResult = { job_id: string; status: string; passport_id?: string };

export async function uploadReturnMedia(returnId: string, file: Blob, filename = "demo.jpg") {
  return uploadReturnMediaFiles(returnId, [file], filename.replace(/\.[^.]+$/, ""));
}

/**
 * Multi-angle / video upload. The backend accepts multiple files under the
 * repeated `files` field (photos for several angles + an optional video).
 */
export async function uploadReturnMediaFiles(
  returnId: string,
  files: Blob[],
  namePrefix = "angle",
): Promise<MediaResult> {
  return uploadFiles<MediaResult>(`/returns/${returnId}/media`, files, namePrefix);
}

/**
 * Generic multipart upload — posts 1..n images/video under the repeated `files`
 * field (the contract for return media, resell, and seller relist). Carries the
 * persona-aware `X-User-Id` header like the JSON client.
 */
export async function uploadFiles<T>(
  path: string,
  files: Blob[],
  namePrefix = "file",
): Promise<T> {
  const form = new FormData();
  files.forEach((f, i) => {
    const ext = f.type?.startsWith("video/") ? "mp4" : "jpg";
    form.append("files", f, `${namePrefix}-${i + 1}.${ext}`);
  });
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 60000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "X-User-Id": getUserId() },
      body: form,
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${res.status}${text ? `: ${text.slice(0, 120)}` : ""}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}
