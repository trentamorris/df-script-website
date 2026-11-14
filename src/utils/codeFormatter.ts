const FORMAT_CACHE = new Map<string, string>();

let prettierPromise: Promise<[any, any, any]> | null = null;

function loadPrettier() {
  if (!prettierPromise) {
    prettierPromise = Promise.all([
      import("prettier/standalone"),
      import("prettier/plugins/typescript"),
      import("prettier/plugins/estree"),
    ]);
  }
  return prettierPromise;
}

/**
 * Robustly formats TypeScript signatures and code snippets using Prettier's AST parser
 * with standard Prettier defaults (printWidth: 80, tabWidth: 2, etc.).
 * Dynamically code-split so it doesn't inflate initial bundle size.
 */
  export async function formatTypeScript(code: string): Promise<string> {
    if (!code || !code.trim()) return code;

    const cached = FORMAT_CACHE.get(code);
    if (cached) return cached;

    const [prettierModule, parserTypeScript, parserEstree] = await loadPrettier();
    const prettier = prettierModule.default ?? prettierModule;

    // Find the parameter parenthesis of the actual function call (handling chained calls like $df.col(...).and(...))
    const lastParenIdx = code.lastIndexOf("(");

    // If it's not a function signature (e.g. raw snippet or example code), format directly with Prettier defaults
    if (lastParenIdx === -1) {
      try {
        const formatted = await prettier.format(code, {
          parser: "typescript",
          plugins: [parserTypeScript.default ?? parserTypeScript, parserEstree.default ?? parserEstree],
        });
        const res = formatted.trim();
        FORMAT_CACHE.set(code, res);
        return res;
      } catch {
        return code;
      }
    }

    // Isolate the caller prefix (e.g. `$df.col(<column_name>).and` or `$df.lit`)
    const fnCall = code.slice(0, lastParenIdx).trim();
    const rest = code.slice(lastParenIdx);
    const dummy = `declare function __FN__${rest}`;

    try {
      const formatted = await prettier.format(dummy, {
        parser: "typescript",
        plugins: [parserTypeScript.default ?? parserTypeScript, parserEstree.default ?? parserEstree],
      });

      const prefix = "declare function __FN__";
      let res = formatted.trim();
      if (res.startsWith(prefix)) {
        res = fnCall + res.slice(prefix.length);
      }
      FORMAT_CACHE.set(code, res);
      return res;
    } catch {
      return code;
    }
  }
