import process from "process";

type JsonRecord = Record<string, unknown>;

type SampleStats = {
  count: number;
  avg: number;
  p50: number;
  p95: number;
  min: number;
  max: number;
};

type SessionStartPayload = {
  sessionId: string;
  firstCard: { itemId: string } | null;
};

type ReviewPayload = {
  nextCard: { itemId: string } | null;
};

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string | boolean> = {};
  for (const arg of args) {
    if (arg.startsWith("--")) {
      const [key, value] = arg.replace(/^--/, "").split("=");
      parsed[key] = value ?? true;
    }
  }
  return parsed;
}

function percentile(values: number[], value: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(value * sorted.length) - 1));
  return sorted[index];
}

function summarize(values: number[]): SampleStats {
  if (values.length === 0) {
    return { count: 0, avg: 0, p50: 0, p95: 0, min: 0, max: 0 };
  }
  const sum = values.reduce((acc, entry) => acc + entry, 0);
  return {
    count: values.length,
    avg: sum / values.length,
    p50: percentile(values, 0.5),
    p95: percentile(values, 0.95),
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

async function timedRequest(url: string, timeoutMs: number, init?: RequestInit) {
  const start = performance.now();
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs)
  });
  const elapsedMs = performance.now() - start;
  return { response, elapsedMs };
}

async function sampleRoute(route: {
  label: string;
  method?: "GET" | "POST";
  url: string;
  samples: number;
  body?: JsonRecord;
  timeoutMs: number;
}) {
  const values: number[] = [];
  for (let index = 0; index < route.samples; index += 1) {
    const { response, elapsedMs } = await timedRequest(route.url, route.timeoutMs, {
      method: route.method ?? "GET",
      headers: route.body ? { "Content-Type": "application/json" } : undefined,
      body: route.body ? JSON.stringify(route.body) : undefined,
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error(`${route.label} failed with status ${response.status}`);
    }
    values.push(elapsedMs);
  }
  return summarize(values);
}

async function benchmarkReviewFlow(baseUrl: string, reviewCount: number, timeoutMs: number) {
  const allowMutating = process.env.ALLOW_MUTATING_BENCH === "1";
  if (!allowMutating) {
    throw new Error(
      "Refusing mutating benchmark. Set ALLOW_MUTATING_BENCH=1 to run /api/reviews flow explicitly."
    );
  }

  const startSession = await timedRequest(`${baseUrl}/api/session/start`, timeoutMs, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "everyday" }),
    cache: "no-store"
  });
  if (!startSession.response.ok) {
    throw new Error(`session start failed with status ${startSession.response.status}`);
  }

  const started = (await startSession.response.json()) as SessionStartPayload;
  if (!started.sessionId || !started.firstCard?.itemId) {
    return summarize([]);
  }

  const samples: number[] = [];
  let nextItemId: string | null = started.firstCard.itemId;
  for (let index = 0; index < reviewCount; index += 1) {
    if (!nextItemId) {
      break;
    }

    const idempotencyKey = `perf-${Date.now()}-${index}-${nextItemId}`;
    const { response, elapsedMs } = await timedRequest(`${baseUrl}/api/reviews`, timeoutMs, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-idempotency-key": idempotencyKey
      },
      body: JSON.stringify({
        sessionId: started.sessionId,
        itemId: nextItemId,
        rating: 3,
        elapsedMs: 250
      }),
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error(`/api/reviews failed with status ${response.status} on step ${index + 1}`);
    }
    const payload = (await response.json()) as ReviewPayload;
    nextItemId = payload.nextCard?.itemId ?? null;
    samples.push(elapsedMs);
  }

  return summarize(samples);
}

function formatMs(value: number) {
  return `${value.toFixed(2)}ms`;
}

async function main() {
  const args = parseArgs();
  const host = String(args.host ?? process.env.HOST ?? "127.0.0.1");
  const port = Number(args.port ?? process.env.PORT ?? "3000");
  const samples = Math.max(1, Number(args.samples ?? "15"));
  const includeReviews = args["include-reviews"] === true;
  const reviewSamples = Math.max(1, Number(args["review-samples"] ?? "100"));
  const timeoutMs = Math.max(1_000, Number(args.timeout ?? "25000"));
  const baseUrl = `http://${host}:${port}`;

  const routes = [
    { label: "GET /api/health", method: "GET" as const, url: `${baseUrl}/api/health`, samples, timeoutMs },
    { label: "GET /api/settings", method: "GET" as const, url: `${baseUrl}/api/settings`, samples, timeoutMs },
    { label: "GET /api/dashboard", method: "GET" as const, url: `${baseUrl}/api/dashboard`, samples, timeoutMs },
    {
      label: "POST /api/session/start",
      method: "POST" as const,
      url: `${baseUrl}/api/session/start`,
      samples,
      body: { mode: "everyday" },
      timeoutMs
    },
    { label: "GET /dashboard", method: "GET" as const, url: `${baseUrl}/dashboard`, samples, timeoutMs },
    { label: "GET /study", method: "GET" as const, url: `${baseUrl}/study`, samples, timeoutMs }
  ];

  const output: Array<{ label: string; stats: SampleStats }> = [];
  for (const route of routes) {
    const stats = await sampleRoute(route);
    output.push({ label: route.label, stats });
  }

  if (includeReviews) {
    const stats = await benchmarkReviewFlow(baseUrl, reviewSamples, timeoutMs);
    output.push({
      label: `POST /api/reviews flow (${stats.count} submissions)`,
      stats
    });
  }

  console.log(`\nBenchmark target: ${baseUrl}\n`);
  for (const entry of output) {
    const { stats } = entry;
    console.log(
      `${entry.label.padEnd(42)} count=${String(stats.count).padStart(4)} avg=${formatMs(stats.avg).padStart(9)} p50=${formatMs(
        stats.p50
      ).padStart(9)} p95=${formatMs(stats.p95).padStart(9)} min=${formatMs(stats.min).padStart(9)} max=${formatMs(
        stats.max
      ).padStart(9)}`
    );
  }
  console.log("");
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
