import { CellState, NotebookFile, NotebookPage } from "./types";

/**
 * Parses and validates raw imported notebook JSON string.
 */
export function parseNotebookJson(rawJson: string, fallbackFileName: string): NotebookFile {
  const parsed = JSON.parse(rawJson);
  if (!parsed || !Array.isArray(parsed.cells)) {
    throw new Error("Invalid notebook format. Ensure it contains a valid cells list.");
  }

  const name = parsed.name || fallbackFileName;
  const cells: CellState[] = parsed.cells;
  let pages: NotebookPage[] | undefined = undefined;
  let activePageId = parsed.activePageId;

  if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
    pages = parsed.pages;
    activePageId = activePageId || parsed.pages[0].id;
  } else {
    const pageId = "page-1";
    pages = [{ id: pageId, title: "Canvas 1", cellIds: cells.map((c) => c.id) }];
    activePageId = pageId;
  }

  return { name, cells, pages, activePageId };
}

/**
 * Triggers a browser download of the notebook JSON file.
 */
export function downloadNotebookFile(data: NotebookFile): void {
  const filename = data.name.endsWith(".dfnb") ? data.name : `${data.name}.dfnb`;
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Moves an element within an array from sourceIndex to targetIndex immutably.
 */
export function reorderArray<T>(list: readonly T[], sourceIndex: number, targetIndex: number): T[] {
  if (sourceIndex === targetIndex || sourceIndex < 0 || sourceIndex >= list.length) {
    return [...list];
  }
  const result = [...list];
  const [removed] = result.splice(sourceIndex, 1);
  result.splice(targetIndex, 0, removed);
  return result;
}
