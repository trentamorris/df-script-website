/**
 * Matches class name declarations in source files.
 */
export const CLASS_REGEX = /class\s+([a-zA-Z0-9_$]+)/;

/**
 * Matches JSDoc method signatures, including optional generator asterisk (*).
 */
export const METHOD_REGEX = /\/\*\*([\s\S]*?)\*\/[\s\r\n]*?(?:public\s+|private\s+|static\s+)?\*?([a-zA-Z0-9_$]+)\s*(?:<[^>]+>)?\s*\(([\s\S]*?)\)/g;

/**
 * Matches export function signatures for global helpers.
 */
export const FUNCTION_REGEX = /\/\*\*([\s\S]*?)\*\/[\s\r\n]*?export\s+function\s+([a-zA-Z0-9_$]+)\s*(?:<[^>]+>)?\s*\(([\s\S]*?)\)/g;

/**
 * Matches @since tags with semver versions.
 */
export const SINCE_REGEX = /@since\s+(v1\.[567]\.0)/;

/**
 * Matches @param tags, capturing parameter names (including dot-notation properties) and descriptions.
 */
export const PARAM_REGEX = /@param\s+([a-zA-Z0-9_$.?]+)\s+(.*)/;

/**
 * Matches @returns tags.
 */
export const RETURNS_REGEX = /@returns\s+(.*)/;

/**
 * Matches export class declarations (exceptions).
 */
export const EXCEPTION_REGEX = /\/\*\*([\s\S]*?)\*\/[\s\r\n]*?export\s+class\s+([a-zA-Z0-9_$]+)/g;

/**
 * Matches default value declarations (e.g. "default: value" or "Default value") inside descriptions.
 */
export const DEFAULT_VALUE_REGEX = /(?:default|Default)\s*=?\s*(`[^`]+`|"[^"]+"|\S+)/;
