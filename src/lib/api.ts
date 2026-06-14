import { DEMO_USER_ID } from "./demo-constants";
import { useRelay } from "./store";

const BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8010";

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

export async function uploadReturnMedia(returnId: string, file: Blob, filename = "demo.jpg") {
  const form = new FormData();
  form.append("files", file, filename);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 60000);
  try {
    const res = await fetch(`${BASE}/returns/${returnId}/media`, {
      method: "POST",
      headers: { "X-User-Id": getUserId() },
      body: form,
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return (await res.json()) as { job_id: string; status: string; passport_id?: string };
  } finally {
    clearTimeout(t);
  }
}
