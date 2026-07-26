export const NOTEBOOK_PATH = "/notebook" as const;
export const ABOUT_PATH = "/about" as const;
export const SUPPORT_PATH = "/support" as const;
export type LayoutPath = typeof NOTEBOOK_PATH | typeof ABOUT_PATH | typeof SUPPORT_PATH;
