import { createHash } from "crypto";

export type ServerTimingMetric = {
  name: string;
  durationMs: number;
  description?: string;
};

export function hrNow() {
  return process.hrtime.bigint();
}

export function hrElapsedMs(start: bigint) {
  return Number(process.hrtime.bigint() - start) / 1_000_000;
}

function sanitizeServerTimingToken(token: string) {
  return token.replace(/[^A-Za-z0-9!#$%&'*+.^_`|~-]/g, "").slice(0, 40) || "metric";
}

export function buildServerTimingHeader(metrics: ServerTimingMetric[]) {
  return metrics
    .filter((metric) => Number.isFinite(metric.durationMs) && metric.durationMs >= 0)
    .map((metric) => {
      const token = sanitizeServerTimingToken(metric.name);
      const dur = metric.durationMs.toFixed(2);
      if (!metric.description) {
        return `${token};dur=${dur}`;
      }
      const desc = metric.description.replace(/"/g, "");
      return `${token};dur=${dur};desc="${desc}"`;
    })
    .join(", ");
}

export function weakEtagFromJson(payload: unknown) {
  const serialized = JSON.stringify(payload);
  const hash = createHash("sha1").update(serialized).digest("base64url");
  return {
    etag: `W/"${hash}"`,
    serialized
  };
}

export function ifNoneMatchHit(request: Request, etag: string) {
  const header = request.headers.get("if-none-match");
  if (!header) {
    return false;
  }
  return header
    .split(",")
    .map((value) => value.trim())
    .some((candidate) => candidate === etag || candidate === "*");
}

