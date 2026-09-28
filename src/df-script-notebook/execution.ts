import React from "react";
import { $df } from "df-script";
import { extractDeclaredVars, findLastExpressionLine } from "./utils";

let cachedBabel: any = null;

/**
 * Dynamically loads Babel standalone transpiler from CDN if not already loaded.
 */
export async function loadBabel(): Promise<any> {
  if (cachedBabel) return cachedBabel;
  try {
    // @ts-ignore
    const module = await import("https://esm.sh/@babel/standalone");
    cachedBabel = module.default || module;
    return cachedBabel;
  } catch (e) {
    console.error("Failed to load Babel: ", e);
    throw new Error("Failed to load Babel standalone transpiler from CDN. Please check your internet connection.");
  }
}

/**
 * Builds the AsyncFunction body string for a cell, handling both JSX and standard JS.
 */
export function buildExecutableBody(
  code: string,
  type: "code" | "jsx" | "markdown",
  finalJSCode: string
): { bodyCode: string; declaredVars: string[] } {
  const declaredVars = extractDeclaredVars(code);
  const varExports = declaredVars
    .map((v) => `${v}: typeof ${v} !== 'undefined' ? ${v} : undefined`)
    .join(",\n");

  const { lastLine, lastLineIndex } = findLastExpressionLine(finalJSCode);
  const lines = finalJSCode.split("\n");
  const isExpression =
    lastLine &&
    !/^(const|let|var|function|class|return|if|for|while|try|import|throw)\b/.test(lastLine);

  if (type === "jsx") {
    let componentBody = "";
    if (isExpression) {
      const cleanLastLine = lastLine.endsWith(";") ? lastLine.slice(0, -1) : lastLine;
      const prefix = lines.slice(0, lastLineIndex).join("\n");
      componentBody = `
        ${prefix}
        return (${cleanLastLine});
      `;
    } else {
      componentBody = finalJSCode;
    }

    const bodyCode = `
      const CellComponent = () => {
        try {
          ${componentBody}
        } catch (innerErr) {
          return React.createElement("div", { className: "text-rose-500 font-mono text-xs p-2 bg-rose-950/10 border border-rose-900/30 rounded" }, "Render Error: " + innerErr.message);
        }
      };
      return {
        _returnValue: React.createElement(CellComponent, null),
        ${varExports}
      };
    `;
    return { bodyCode, declaredVars };
  }

  // Standard code cell
  let bodyCode = "";
  if (isExpression) {
    const cleanLastLine = lastLine.endsWith(";") ? lastLine.slice(0, -1) : lastLine;
    const prefix = lines.slice(0, lastLineIndex).join("\n");
    bodyCode = `
      ${prefix}
      const _cell_result = (${cleanLastLine});
      return {
        _returnValue: _cell_result,
        ${varExports}
      };
    `;
  } else {
    bodyCode = `
      ${finalJSCode}
      return {
        _returnValue: undefined,
        ${varExports}
      };
    `;
  }

  return { bodyCode, declaredVars };
}

/**
 * Executes user JavaScript or JSX within an isolated AsyncFunction scope.
 */
export async function executeCodeScope(
  bodyCode: string,
  declaredVars: string[],
  sharedState: Record<string, any>
): Promise<{ returnValue: any; updatedVars: Record<string, any> }> {
  const filteredKeys = Object.keys(sharedState).filter((k) => !declaredVars.includes(k));
  const filteredVals = filteredKeys.map((k) => sharedState[k]);

  const htmlHelper = (str: string) => ({ toHTML: () => str });
  const hookKeys = ["useState", "useEffect", "useRef", "useMemo", "useCallback", "useContext", "html"];
  const hookVals = [
    React.useState,
    React.useEffect,
    React.useRef,
    React.useMemo,
    React.useCallback,
    React.useContext,
    htmlHelper,
  ];

  ($df as any).html = htmlHelper;

  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const fn = new AsyncFunction("$df", "React", ...hookKeys, ...filteredKeys, bodyCode);
  const execRes = await fn($df, React, ...hookVals, ...filteredVals);

  let returnValue: any = undefined;
  const updatedVars: Record<string, any> = {};

  if (execRes) {
    returnValue = execRes._returnValue;
    for (const key of Object.keys(execRes)) {
      if (key !== "_returnValue") {
        updatedVars[key] = execRes[key];
      }
    }
  }

  return { returnValue, updatedVars };
}
