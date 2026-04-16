import { expect, type Page } from "@playwright/test";

const IGNORED_PATHS = [/\/favicon\.ico(?:\?|$)/];
const IGNORED_CONSOLE_ERRORS = [/^Failed to load resource: the server responded with a status of 404 \(Not Found\)$/];

function shouldIgnore(url: string) {
  return IGNORED_PATHS.some((pattern) => pattern.test(url));
}

function isLocalAppUrl(url: string) {
  return url.startsWith("http://127.0.0.1:3000");
}

export function attachBrowserGuards(page: Page) {
  const consoleErrors = new Set<string>();
  const pageErrors = new Set<string>();
  const failedResponses = new Set<string>();
  const failedRequests = new Set<string>();

  const onConsole = (message: Parameters<Page["on"]>[1] extends never ? never : any) => {
    if (message.type() !== "error") {
      return;
    }
    const text = message.text();
    if (IGNORED_CONSOLE_ERRORS.some((pattern) => pattern.test(text))) {
      return;
    }
    consoleErrors.add(text);
  };

  const onPageError = (error: Error) => {
    pageErrors.add(error.stack ?? error.message);
  };

  const onResponse = (response: Awaited<ReturnType<Page["waitForResponse"]>>) => {
    const url = response.url();
    if (!isLocalAppUrl(url) || shouldIgnore(url) || response.status() < 400) {
      return;
    }
    failedResponses.add(`${response.status()} ${response.request().method()} ${url}`);
  };

  const onRequestFailed = (request: Awaited<ReturnType<Page["waitForRequest"]>>) => {
    const url = request.url();
    if (!isLocalAppUrl(url) || shouldIgnore(url)) {
      return;
    }
    const errorText = request.failure()?.errorText ?? "unknown failure";
    if (errorText.includes("ERR_ABORTED")) {
      return;
    }
    failedRequests.add(`${request.method()} ${url} :: ${errorText}`);
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);
  page.on("requestfailed", onRequestFailed);

  return {
    snapshot() {
      return {
        consoleErrors: [...consoleErrors],
        pageErrors: [...pageErrors],
        failedResponses: [...failedResponses],
        failedRequests: [...failedRequests],
      };
    },
    async expectHealthy() {
      const snapshot = this.snapshot();
      expect(snapshot.consoleErrors, "console errors").toEqual([]);
      expect(snapshot.pageErrors, "page errors").toEqual([]);
      expect(snapshot.failedResponses, "4xx/5xx responses").toEqual([]);
      expect(snapshot.failedRequests, "failed requests").toEqual([]);
    },
    detach() {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
      page.off("response", onResponse);
      page.off("requestfailed", onRequestFailed);
    },
  };
}
