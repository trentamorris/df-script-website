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
  scope: Record<string, any> = {}
): Promise<any> {
  const trimmed = code.trim();
  if (!trimmed) return undefined;

  const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;

  if (/\breturn\b/.test(trimmed)) {
    const fn = new AsyncFunction("scope", `with (scope) {\n${trimmed}\n}`);
    return await fn(scope);
  }

  const evalFn = new AsyncFunction(
    "scope",
    `with (scope) {\nreturn eval(${JSON.stringify(trimmed)});\n}`
  );
  return await evalFn(scope);
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

  try {
    const returnValue = await executeJs(code, scope);
    const elapsed = performance.now() - t0;
    const runTimestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // Extract newly assigned scope variables (excluding $df)
    const { $df: _unused, ...newScopeVariables } = scope;

    return {
      output: returnValue,
      error: null,
      logs: cellLogs,
      elapsedMs: elapsed,
      timeTaken: `${elapsed.toFixed(2)}ms`,
      runTimestamp,
      newScopeVariables,
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
