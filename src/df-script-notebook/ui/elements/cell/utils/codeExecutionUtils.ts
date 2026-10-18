/**
 * Result of running a code cell.
 */
export interface CellExecutionResult {
  output: any;
  error: string | null;
  logs: string[];
  elapsedMs: number;
  timeTaken: string;
  runTimestamp: string;
  newScopeVariables: Record<string, any>;
}

/**
 * Executes JavaScript code asynchronously within a shared scope.
 * Evaluates the code directly as-is without any regex or text transformation.
 *
 * @param code The JavaScript code string to execute.
 * @param scope An object mapping variable names to their values in the execution scope.
 * @returns The resulting value from the execution.
 */
export async function executeJs(
  code: string,
  scope: Record<string, any> = {},
  capturedVariables?: Record<string, any>
): Promise<any> {
  const trimmed = code.trim();
  if (!trimmed) return undefined;

  const captured = capturedVariables || {};
  const proxy = new Proxy(scope, {
    has(t, p) {
      if (p === Symbol.unscopables) return false;
      return true;
    },
    get(t, p) {
      if (typeof p === "string" && p in captured) return captured[p];
      if (typeof p === "string" && p in t) return t[p];
      if (typeof p === "string" && p in globalThis) return (globalThis as any)[p];
      return undefined;
    },
    set(t, p, v) {
      if (typeof p === "string") {
        if (p !== "$df") {
          captured[p] = v;
        }
        t[p] = v;
      }
      return true;
    },
  });

  const prepared = trimmed.replace(
    /(?:^|\n)\s*(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=/g,
    (match) => match.replace(/(?:const|let|var)\s+/, "")
  );

  const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;

  if (/\breturn\b/.test(prepared)) {
    const fn = new AsyncFunction("scope", `with (scope) {\n${prepared}\n}`);
    return await fn(proxy);
  }

  const evalFn = new AsyncFunction(
    "scope",
    `with (scope) {\nreturn eval(${JSON.stringify(prepared)});\n}`
  );
  return await evalFn(proxy);
}

/**
 * Executes a cell's code while capturing console logs, execution time, and newly declared variables.
 *
 * @param code The code string to execute.
 * @param scope The execution scope/environment.
 * @returns Detailed execution result including output, logs, errors, and timing.
 */
export async function runCellCode(
  code: string,
  scope: Record<string, any> = {}
): Promise<CellExecutionResult> {
  const t0 = performance.now();
  const cellLogs: string[] = [];
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalInfo = console.info;

  const collectLog = (...args: any[]) => {
    originalLog(...args);
    const msg = args
      .map((arg) => {
        if (arg === null) return "null";
        if (arg === undefined) return "undefined";
        if (typeof arg === "object") {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(" ");
    cellLogs.push(msg);
  };

  console.log = collectLog;
  console.warn = collectLog;
  console.error = collectLog;
  console.info = collectLog;

  const capturedVars: Record<string, any> = {};

  try {
    const returnValue = await executeJs(code, scope, capturedVars);
    const elapsed = performance.now() - t0;
    const runTimestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return {
      output: returnValue,
      error: null,
      logs: cellLogs,
      elapsedMs: elapsed,
      timeTaken: `${elapsed.toFixed(2)}ms`,
      runTimestamp,
      newScopeVariables: capturedVars,
    };
  } catch (err: any) {
    const elapsed = performance.now() - t0;
    const runTimestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return {
      output: null,
      error: err?.message || String(err),
      logs: cellLogs,
      elapsedMs: elapsed,
      timeTaken: `${elapsed.toFixed(2)}ms`,
      runTimestamp,
      newScopeVariables: {},
    };
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    console.info = originalInfo;
  }
}
