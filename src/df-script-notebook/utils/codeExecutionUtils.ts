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