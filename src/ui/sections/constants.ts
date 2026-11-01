export const NOTEBOOK_PATH = "/notebook" as const;
export const ABOUT_PATH = "/about" as const;
export const SUPPORT_PATH = "/support" as const;
export const LLM_PATH = "/llm" as const;
export const LLM_TXT_PATH = "/llm/llms.txt" as const;
export const LLM_FULL_PATH = "/llm/llms-full.txt" as const;

export type LayoutPath =
  | typeof NOTEBOOK_PATH
  | typeof ABOUT_PATH
  | typeof SUPPORT_PATH
  | typeof LLM_PATH
  | typeof LLM_TXT_PATH
  | typeof LLM_FULL_PATH;
