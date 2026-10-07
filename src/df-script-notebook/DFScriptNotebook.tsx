import React from "react";
import { CellLayout, CellState, CellType, NotebookPage, PageGridConfig } from "./types";
import { DEFAULT_GRID_CONFIG, WELCOME_NOTEBOOK } from "./constants";
import { $df } from "df-script";
import { downloadNotebookFile, parseNotebookJson, reorderArray } from "./utils";
import { runCellCode } from "./ui/elements";
import { registerNotebookKeyboardShortcuts } from "./keyboardShortcutsUtils";
import NotebookHeader from "./ui/sections/notebook-header/NotebookHeader";
import NotebookBody from "./ui/sections/notebook-body/NotebookBody";
import "./styles.css";


export default function DFScriptNotebook() {
  const [notebookName, setNotebookName] = React.useState("untitled_notebook.dfnb");
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [pages, setPages] = React.useState<NotebookPage[]>([
    {
      id: "page-1",
      title: "Canvas 1",
      cellIds: WELCOME_NOTEBOOK.map((c) => c.id),
      gridConfig: DEFAULT_GRID_CONFIG,
    },
  ]);
  const [activePageId, setActivePageId] = React.useState<string>("page-1");
  const [editingPageId, setEditingPageId] = React.useState<string | null>(null);
  const [showGridConfigModal, setShowGridConfigModal] = React.useState(false);

  const [cells, setCells] = React.useState<CellState[]>(() =>
    WELCOME_NOTEBOOK.map((c, idx) => ({
      ...c,
      layout: {
        x: (idx % 2) * 6,
        y: Math.floor(idx / 2) * 8,
        w: 6,
        h: 8,
      },
    }))
  );

  const [activeCellId, setActiveCellId] = React.useState<string | null>(() => WELCOME_NOTEBOOK[0]?.id ?? null);
  const [copiedCellId, setCopiedCellId] = React.useState<string | null>(null);
  const [copiedCellCodeId, setCopiedCellCodeId] = React.useState<string | null>(null);
  const [isInteracting, setIsInteracting] = React.useState(false);
  const [isCommandsOpen, setIsCommandsOpen] = React.useState(false);
  const [historyLength, setHistoryLength] = React.useState(0);
  const [futureLength, setFutureLength] = React.useState(0);

  interface NotebookHistoryEntry {
    cells: CellState[];
    pages: NotebookPage[];
    targetCellId?: string | null;
  }

  const historyRef = React.useRef<NotebookHistoryEntry[]>([]);
  const futureRef = React.useRef<NotebookHistoryEntry[]>([]);
  const cellClipboardRef = React.useRef<CellState | null>(null);

  const draggedCellIndexRef = React.useRef<number | null>(null);
  const nextExecIndexRef = React.useRef(1);
  const sharedStateRef = React.useRef<Record<string, any>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const activePage = pages.find((p) => p.id === activePageId);
  const isCanvas = (activePage?.layoutMode ?? "canvas") === "canvas";
  const gridConfig = activePage?.gridConfig ?? DEFAULT_GRID_CONFIG;
  const pageCellIds = activePage ? activePage.cellIds : [];
  const activeCells = pageCellIds
    .map((id) => cells.find((c) => c.id === id))
    .filter((c): c is CellState => !!c);

  const activeCellIdRef = React.useRef(activeCellId);
  activeCellIdRef.current = activeCellId;
  const activeCellsRef = React.useRef(activeCells);
  activeCellsRef.current = activeCells;
  const cellsRef = React.useRef(cells);
  cellsRef.current = cells;
  const pagesRef = React.useRef(pages);
  pagesRef.current = pages;


  const copyFlash = (id: string, type: "cell" | "code" = "cell") => {
    if (type === "code") {
      setCopiedCellCodeId(id);
      setTimeout(() => setCopiedCellCodeId(null), 1500);
    } else {
      setCopiedCellId(id);
      setTimeout(() => setCopiedCellId(null), 1500);
    }
  };

  const runCell = async (cellId: string) => {
    const cellIndex = cells.findIndex((c) => c.id === cellId);
    if (cellIndex === -1) return;

    const cell = cells[cellIndex];
    if (cell.type === "markdown") {
      setCells((prev) => prev.map((c) => (c.id === cellId ? { ...c, isCodeCollapsed: true } : c)));
      return;
    }

    const code = cell.code.trim();
    if (!code) return;

    setCells((prev) =>
      prev.map((c) => (c.id === cellId ? { ...c, execIndex: null, error: null, timeTaken: "..." } : c))
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    const scope = { $df, ...sharedStateRef.current };
    const result = await runCellCode(code, scope);

    // Persist newly assigned scope variables into shared state
    sharedStateRef.current = {
      ...sharedStateRef.current,
      ...result.newScopeVariables,
    };

    const runNum = nextExecIndexRef.current++;

    setCells((prev) =>
      prev.map((c) =>
        c.id === cellId
          ? {
              ...c,
              output: result.output,
              error: result.error,
              timeTaken: result.timeTaken,
              lastRunTime: result.runTimestamp,
              execIndex: runNum,
              logs: result.logs,
            }
          : c
      )
    );
  };

  const runAllCells = () => {
    sharedStateRef.current = {};
    nextExecIndexRef.current = 1;

    let chain = Promise.resolve();
    cells.forEach((cell) => {
      chain = chain.then(() => {
        if (cell.type === "code") {
          return runCell(cell.id);
        }
        setCells((prev) => prev.map((c) => (c.id === cell.id ? { ...c, isCodeCollapsed: true } : c)));
        return Promise.resolve();
      });
    });
  };

  const pushHistory = (targetCellId?: string | null) => {
    historyRef.current = [
      ...historyRef.current,
      {
        cells: cellsRef.current,
        pages: pagesRef.current,
        targetCellId: targetCellId ?? activeCellIdRef.current,
      },
    ];
    futureRef.current = [];
    setHistoryLength(historyRef.current.length);
    setFutureLength(0);
  };

  const undoCellAction = () => {
    if (historyRef.current.length === 0) return;
    const entry = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    futureRef.current = [
      {
        cells: cellsRef.current,
        pages: pagesRef.current,
        targetCellId: entry.targetCellId,
      },
      ...futureRef.current,
    ];
    setHistoryLength(historyRef.current.length);
    setFutureLength(futureRef.current.length);
    setCells(entry.cells);
    setPages(entry.pages);

    if (entry.targetCellId) {
      setActiveCellId(entry.targetCellId);
      setTimeout(() => {
        document.querySelector(`[data-cell-id="${entry.targetCellId}"]`)?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 40);
    }
  };

  const redoCellAction = () => {
    if (futureRef.current.length === 0) return;
    const entry = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    historyRef.current = [
      ...historyRef.current,
      {
        cells: cellsRef.current,
        pages: pagesRef.current,
        targetCellId: entry.targetCellId,
      },
    ];
    setHistoryLength(historyRef.current.length);
    setFutureLength(futureRef.current.length);
    setCells(entry.cells);
    setPages(entry.pages);

    if (entry.targetCellId) {
      setActiveCellId(entry.targetCellId);
      setTimeout(() => {
        document.querySelector(`[data-cell-id="${entry.targetCellId}"]`)?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 40);
    }
  };

  const addCellAtIndex = (index: number, type: CellType) => {
    pushHistory();
    const newId = `cell-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    let initialCode = "";
    if (type === "markdown") {
      initialCode = "## Double-click to edit Markdown\n* Bullet point 1\n* Bullet point 2";
    }

    // Find next available non-overlapping slot on the canvas
    const activePageCells = (activePage?.cellIds || [])
      .map((id) => cells.find((c) => c.id === id))
      .filter((c): c is CellState => !!c);

    let nextY = 0;
    if (activePageCells.length > 0) {
      nextY = Math.max(
        ...activePageCells.map((c) => (c.layout ? c.layout.y + c.layout.h : 0))
      );
    }

    const defaultCols = gridConfig.columns >= 12 ? 6 : Math.min(6, gridConfig.columns);
    const newCellLayout: CellLayout = {
      x: 0,
      y: nextY,
      w: defaultCols,
      h: 8,
      z: 1,
    };

    const newCell: CellState = {
      id: newId,
      type,
      code: initialCode,
      output: null,
      error: null,
      timeTaken: null,
      execIndex: null,
      isCodeCollapsed: false,
      isOutputCollapsed: false,
      layout: newCellLayout,
    };

    setCells((prev) => {
      const copy = [...prev];
      copy.splice(index, 0, newCell);
      return copy;
    });

    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== activePageId) return p;
        const ids = [...p.cellIds];
        ids.splice(index, 0, newId);
        return { ...p, cellIds: ids };
      })
    );
    setActiveCellId(newId);
  };

  const deleteCell = (id: string) => {
    pushHistory();
    setCells((prev) => prev.filter((c) => c.id !== id));
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        cellIds: p.cellIds.filter((cellId) => cellId !== id),
      }))
    );
    if (activeCellId === id) setActiveCellId(null);
  };

  const moveCellUp = (index: number) => {
    if (index === 0) return;
    const movingCellId = activeCellsRef.current[index]?.id;
    pushHistory();
    if (activePage) {
      const updated = reorderArray(activePage.cellIds, index, index - 1);
      setPages((prev) => prev.map((p) => (p.id === activePageId ? { ...p, cellIds: updated } : p)));
    } else {
      setCells((prev) => reorderArray(prev, index, index - 1));
    }
    if (movingCellId) {
      setTimeout(() => {
        document.querySelector(`[data-cell-id="${movingCellId}"]`)?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 30);
    }
  };

  const moveCellDown = (index: number) => {
    const movingCellId = activeCellsRef.current[index]?.id;
    if (activePage) {
      if (index >= activePage.cellIds.length - 1) return;
      pushHistory();
      const updated = reorderArray(activePage.cellIds, index, index + 1);
      setPages((prev) => prev.map((p) => (p.id === activePageId ? { ...p, cellIds: updated } : p)));
    } else {
      if (index >= cells.length - 1) return;
      pushHistory();
      setCells((prev) => reorderArray(prev, index, index + 1));
    }
    if (movingCellId) {
      setTimeout(() => {
        document.querySelector(`[data-cell-id="${movingCellId}"]`)?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 30);
    }
  };

  const cutCell = (id: string) => {
    const targetCell = cells.find((c) => c.id === id);
    if (!targetCell) return;
    cellClipboardRef.current = targetCell;
    deleteCell(id);
  };

  const copyCellToClipboard = (id: string) => {
    const targetCell = cells.find((c) => c.id === id);
    if (!targetCell) return;
    cellClipboardRef.current = targetCell;
    copyFlash(id, "cell");
  };

  const pasteCell = (insertIndex: number) => {
    const source = cellClipboardRef.current;
    if (!source) return;
    pushHistory();
    const clonedCell: CellState = {
      ...source,
      id: `cell-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      output: null,
      error: null,
      timeTaken: null,
      execIndex: null,
    };
    setCells((prev) => {
      const copy = [...prev];
      copy.splice(insertIndex, 0, clonedCell);
      return copy;
    });
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== activePageId) return p;
        const ids = [...p.cellIds];
        ids.splice(insertIndex, 0, clonedCell.id);
        return { ...p, cellIds: ids };
      })
    );
    setActiveCellId(clonedCell.id);
  };

  const mergeWithCellBelow = (targetId: string) => {
    const currentActiveCells = activeCellsRef.current;
    const idx = currentActiveCells.findIndex((c) => c.id === targetId);
    if (idx === -1 || idx >= currentActiveCells.length - 1) return;

    const currentCell = currentActiveCells[idx];
    const belowCell = currentActiveCells[idx + 1];

    pushHistory();
    const mergedCode = `${currentCell.code}\n\n${belowCell.code}`;
    setCells((prev) =>
      prev
        .filter((c) => c.id !== belowCell.id)
        .map((c) => (c.id === currentCell.id ? { ...c, code: mergedCode } : c))
    );
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== activePageId) return p;
        return { ...p, cellIds: p.cellIds.filter((cid) => cid !== belowCell.id) };
      })
    );
  };

  const splitCellAtIndex = (index: number, beforeCode: string, afterCode: string) => {
    const currentActiveCells = activeCellsRef.current;
    const currentCell = currentActiveCells[index];
    if (!currentCell) return;

    pushHistory();
    const newId = `cell-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newCellLayout: CellLayout = {
      x: currentCell.layout ? currentCell.layout.x : 0,
      y: currentCell.layout ? currentCell.layout.y + currentCell.layout.h : 0,
      w: currentCell.layout ? currentCell.layout.w : 6,
      h: currentCell.layout ? currentCell.layout.h : 8,
      z: 1,
    };

    const newCell: CellState = {
      id: newId,
      type: currentCell.type,
      code: afterCode,
      output: null,
      error: null,
      timeTaken: null,
      execIndex: null,
      isCodeCollapsed: false,
      isOutputCollapsed: false,
      layout: newCellLayout,
    };

    setCells((prev) => {
      const copy = prev.map((c) => (c.id === currentCell.id ? { ...c, code: beforeCode } : c));
      const targetIndex = copy.findIndex((c) => c.id === currentCell.id);
      copy.splice(targetIndex + 1, 0, newCell);
      return copy;
    });

    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== activePageId) return p;
        const ids = [...p.cellIds];
        const pageTargetIndex = ids.indexOf(currentCell.id);
        if (pageTargetIndex !== -1) {
          ids.splice(pageTargetIndex + 1, 0, newId);
        } else {
          ids.splice(index + 1, 0, newId);
        }
        return { ...p, cellIds: ids };
      })
    );

    setActiveCellId(newId);
    setTimeout(() => {
      const nextContainer = document.querySelector(`[data-cell-id="${newId}"]`) as (HTMLElement & { __monacoEditor?: any }) | null;
      if (nextContainer?.__monacoEditor) {
        nextContainer.__monacoEditor.focus();
      } else {
        (nextContainer?.querySelector?.(".monaco-editor textarea") as HTMLElement | null)?.focus();
      }
    }, 50);
  };

  const changeCellType = (id: string, type: CellType) => {
    pushHistory();
    setCells((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              type,
              ...(type === "code" ? { isCodeCollapsed: false } : {}),
            }
          : c
      )
    );
  };

  const togglePageLayoutMode = () => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== activePageId) return p;
        const currentMode = p.layoutMode ?? "canvas";
        return { ...p, layoutMode: currentMode === "canvas" ? "document" : "canvas" };
      })
    );
  };

  const clearOutputs = () => {
    setCells((prev) =>
      prev.map((c) => ({
        ...c,
        output: null,
        error: null,
        timeTaken: null,
        lastRunTime: null,
        execIndex: null,
        logs: [],
      }))
    );
  };

  const clearCellOutput = (id: string) => {
    setCells((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              output: null,
              error: null,
              timeTaken: null,
              lastRunTime: null,
              execIndex: null,
              logs: [],
            }
          : c
      )
    );
  };

  const resetNotebook = () => {
    if (window.confirm("Are you sure you want to reset the notebook? This will clear all cells and reset code context.")) {
      sharedStateRef.current = {};
      nextExecIndexRef.current = 1;
      setCells([
        {
          id: `cell-${Date.now()}`,
          type: "code",
          code: "",
          output: null,
          error: null,
          timeTaken: null,
          execIndex: null,
          isCodeCollapsed: false,
          isOutputCollapsed: false,
        },
      ]);
    }
  };

  const updateCellLayout = (id: string, newLayout: Partial<CellLayout>) => {
    setCells((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const current = c.layout ?? { x: 0, y: 0, w: 12, h: 6, z: 1 };
        return {
          ...c,
          layout: {
            x: newLayout.x !== undefined ? newLayout.x : current.x,
            y: newLayout.y !== undefined ? newLayout.y : current.y,
            w: newLayout.w !== undefined ? newLayout.w : current.w,
            h: newLayout.h !== undefined ? newLayout.h : current.h,
            z: newLayout.z !== undefined ? newLayout.z : (current.z ?? 1),
          },
        };
      })
    );
  };

  const updatePageGridConfig = (config: Partial<PageGridConfig>) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== activePageId) return p;
        return {
          ...p,
          gridConfig: {
            columns: config.columns ?? p.gridConfig?.columns ?? DEFAULT_GRID_CONFIG.columns,
            rows: config.rows ?? p.gridConfig?.rows ?? DEFAULT_GRID_CONFIG.rows,
            rowHeight: config.rowHeight ?? p.gridConfig?.rowHeight ?? DEFAULT_GRID_CONFIG.rowHeight,
            showGridLines: config.showGridLines ?? p.gridConfig?.showGridLines ?? DEFAULT_GRID_CONFIG.showGridLines,
          },
        };
      })
    );
  };

  const addPage = () => {
    const newPageId = `page-${Date.now()}`;
    const newPageNum = pages.length + 1;
    const initialCellId = `cell-${Date.now()}`;
    const initialCell: CellState = {
      id: initialCellId,
      type: "code",
      code: "",
      output: null,
      error: null,
      timeTaken: null,
      execIndex: null,
      width: "full",
      isCodeCollapsed: false,
      isOutputCollapsed: false,
      layout: { x: 0, y: 0, w: 6, h: 8, z: 1 },
    };
    setCells((prev) => [...prev, initialCell]);
    setPages((prev) => [
      ...prev,
      { id: newPageId, title: `Canvas ${newPageNum}`, cellIds: [initialCellId] },
    ]);
    setActivePageId(newPageId);
  };

  const deletePage = (pageId: string) => {
    if (pages.length <= 1) return;
    const pageToDelete = pages.find((p) => p.id === pageId);
    if (pageToDelete) {
      setCells((prev) => prev.filter((c) => !pageToDelete.cellIds.includes(c.id)));
    }
    const remaining = pages.filter((p) => p.id !== pageId);
    setPages(remaining);
    if (activePageId === pageId) setActivePageId(remaining[0].id);
  };

  const renamePage = (pageId: string, newTitle: string) => {
    setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, title: newTitle || p.title } : p)));
    setEditingPageId(null);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    draggedCellIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnd = () => {
    draggedCellIndexRef.current = null;
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = draggedCellIndexRef.current;
    if (sourceIndex === null || sourceIndex === targetIndex) {
      draggedCellIndexRef.current = null;
      return;
    }

    if (activePage) {
      const updated = reorderArray(activePage.cellIds, sourceIndex, targetIndex);
      setPages((prev) => prev.map((p) => (p.id === activePageId ? { ...p, cellIds: updated } : p)));
    } else {
      setCells((prev) => reorderArray(prev, sourceIndex, targetIndex));
    }
    draggedCellIndexRef.current = null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseNotebookJson(event.target?.result as string, file.name);
        setNotebookName(parsed.name);
        setCells(parsed.cells);
        if (parsed.pages && parsed.pages.length > 0) {
          setPages(parsed.pages);
          setActivePageId(parsed.activePageId || parsed.pages[0].id);
        }
        sharedStateRef.current = {};
        nextExecIndexRef.current = 1;
      } catch (err: any) {
        alert(err?.message || "Failed to parse notebook file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const [customKeybindings, setCustomKeybindings] = React.useState<Record<string, string>>({});
  const customKeybindingsRef = React.useRef<Record<string, string>>({});
  customKeybindingsRef.current = customKeybindings;

  const handleUpdateBinding = (cmdId: string, newBinding: string) => {
    setCustomKeybindings((prev) => ({ ...prev, [cmdId]: newBinding }));
  };

  const advanceCell = (currentIndex: number) => {
    const currentActiveCells = activeCellsRef.current;
    if (currentIndex >= currentActiveCells.length - 1) {
      addCellAtIndex(currentActiveCells.length, "code");
      return;
    }

    const nextCell = currentActiveCells[currentIndex + 1];
    if (!nextCell) return;

    setActiveCellId(nextCell.id);

    // Focus next cell's editor or container and scroll into view
    setTimeout(() => {
      const nextContainer = document.querySelector(`[data-cell-id="${nextCell.id}"]`);
      if (!nextContainer) return;

      nextContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });

      const editorArea = nextContainer.querySelector(".monaco-editor textarea") as HTMLElement | null;
      if (editorArea) {
        editorArea.focus();
      } else {
        (nextContainer as HTMLElement).focus?.();
      }
    }, 50);
  };

  const runAndAdvanceActiveCell = () => {
    const targetId = activeCellIdRef.current;
    if (!targetId) return;

    const currentActiveCells = activeCellsRef.current;
    const idx = currentActiveCells.findIndex((c) => c.id === targetId);
    runCell(targetId);

    if (idx !== -1) {
      advanceCell(idx);
    }
  };

  // Wire global and Command Mode keyboard shortcuts
  React.useEffect(() => {
    return registerNotebookKeyboardShortcuts({
      keybindings: customKeybindings,
      onAddCellAbove: () => {
        const targetId = activeCellIdRef.current;
        const currentActiveCells = activeCellsRef.current;
        const idx = targetId ? currentActiveCells.findIndex((c) => c.id === targetId) : 0;
        addCellAtIndex(Math.max(0, idx), "code");
      },
      onAddCellBelow: () => {
        const targetId = activeCellIdRef.current;
        const currentActiveCells = activeCellsRef.current;
        const idx = targetId ? currentActiveCells.findIndex((c) => c.id === targetId) : currentActiveCells.length - 1;
        addCellAtIndex(idx + 1, "code");
      },
      onDeleteActiveCell: () => {
        const targetId = activeCellIdRef.current;
        if (targetId) deleteCell(targetId);
      },
      onRunActiveCell: () => {
        const targetId = activeCellIdRef.current;
        if (targetId) runCell(targetId);
      },
      onRunAndAdvanceCell: runAndAdvanceActiveCell,
      onRunAllCells: runAllCells,
      onSelectNextCell: () => {
        const currentActiveCells = activeCellsRef.current;
        if (currentActiveCells.length === 0) return;
        const targetId = activeCellIdRef.current;
        const idx = targetId ? currentActiveCells.findIndex((c) => c.id === targetId) : -1;
        const nextIdx = Math.min(currentActiveCells.length - 1, idx + 1);
        const nextCell = currentActiveCells[nextIdx];
        if (nextCell) {
          setActiveCellId(nextCell.id);
          setTimeout(() => {
            document.querySelector(`[data-cell-id="${nextCell.id}"]`)?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }, 30);
        }
      },
      onSelectPreviousCell: () => {
        const currentActiveCells = activeCellsRef.current;
        if (currentActiveCells.length === 0) return;
        const targetId = activeCellIdRef.current;
        const idx = targetId ? currentActiveCells.findIndex((c) => c.id === targetId) : 1;
        const prevIdx = Math.max(0, idx - 1);
        const prevCell = currentActiveCells[prevIdx];
        if (prevCell) {
          setActiveCellId(prevCell.id);
          setTimeout(() => {
            document.querySelector(`[data-cell-id="${prevCell.id}"]`)?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }, 30);
        }
      },
      onChangeCellToCode: () => {
        const targetId = activeCellIdRef.current;
        if (targetId) changeCellType(targetId, "code");
      },
      onChangeCellToMarkdown: () => {
        const targetId = activeCellIdRef.current;
        if (targetId) changeCellType(targetId, "markdown");
      },
      onMoveCellUp: () => {
        const targetId = activeCellIdRef.current;
        const currentActiveCells = activeCellsRef.current;
        const idx = targetId ? currentActiveCells.findIndex((c) => c.id === targetId) : -1;
        if (idx > 0) moveCellUp(idx);
      },
      onMoveCellDown: () => {
        const targetId = activeCellIdRef.current;
        const currentActiveCells = activeCellsRef.current;
        const idx = targetId ? currentActiveCells.findIndex((c) => c.id === targetId) : -1;
        if (idx >= 0 && idx < currentActiveCells.length - 1) moveCellDown(idx);
      },
      onCutActiveCell: () => {
        const targetId = activeCellIdRef.current;
        if (targetId) cutCell(targetId);
      },
      onCopyActiveCell: () => {
        const targetId = activeCellIdRef.current;
        if (targetId) copyCellToClipboard(targetId);
      },
      onPasteCellBelow: () => {
        const targetId = activeCellIdRef.current;
        const currentActiveCells = activeCellsRef.current;
        const idx = targetId ? currentActiveCells.findIndex((c) => c.id === targetId) : currentActiveCells.length - 1;
        pasteCell(idx + 1);
      },
      onPasteCellAbove: () => {
        const targetId = activeCellIdRef.current;
        const currentActiveCells = activeCellsRef.current;
        const idx = targetId ? currentActiveCells.findIndex((c) => c.id === targetId) : 0;
        pasteCell(Math.max(0, idx));
      },
      onUndoCellAction: undoCellAction,
      onRedoCellAction: redoCellAction,
      onMergeWithCellBelow: () => {
        const targetId = activeCellIdRef.current;
        if (targetId) mergeWithCellBelow(targetId);
      },
      onEnterEditMode: () => {
        const targetId = activeCellIdRef.current;
        if (!targetId) return;

        // Ensure the code is not collapsed when entering edit mode
        setCells((prev) =>
          prev.map((c) => (c.id === targetId ? { ...c, isCodeCollapsed: false } : c))
        );

        setTimeout(() => {
          const container = document.querySelector(`[data-cell-id="${targetId}"]`) as (HTMLElement & { __monacoEditor?: any }) | null;
          if (!container) return;
          container.scrollIntoView({ behavior: "smooth", block: "nearest" });

          if (container.__monacoEditor) {
            container.__monacoEditor.focus();
            const position = container.__monacoEditor.getPosition();
            if (position) {
              container.__monacoEditor.setPosition(position);
            }
          } else {
            const editorTextarea = container.querySelector(".monaco-editor textarea") as HTMLElement | null;
            if (editorTextarea) {
              editorTextarea.focus();
            }
          }
        }, 40);
      },
      onToggleActiveCellOutput: () => {
        const targetId = activeCellIdRef.current;
        if (!targetId) return;
        setCells((prev) =>
          prev.map((c) => (c.id === targetId ? { ...c, isOutputCollapsed: !c.isOutputCollapsed } : c))
        );
      },
      onClearOutputs: clearOutputs,
      onToggleLayoutMode: togglePageLayoutMode,
      onSaveNotebook: () =>
        downloadNotebookFile({ name: notebookName, cells, pages, activePageId }),
    });
  }, [customKeybindings, activePageId, notebookName, cells, pages]);

  return (
    <div
      id="df-script-notebook"
      className="grow h-full overflow-hidden bg-[var(--nb-bg-app)] flex flex-col min-w-0 select-text animate-fade-in"
    >
      <NotebookHeader
        notebookName={notebookName}
        isEditingName={isEditingName}
        layoutMode={isCanvas ? "canvas" : "document"}
        onSetNotebookName={setNotebookName}
        onSetIsEditingName={setIsEditingName}
        onAddCell={(type: CellType) => addCellAtIndex(activeCells.length, type)}
        onRunAll={runAllCells}
        onClearOutputs={clearOutputs}
        onResetNotebook={resetNotebook}
        onSaveNotebook={() =>
          downloadNotebookFile({ name: notebookName, cells, pages, activePageId })
        }
        onTriggerLoadNotebook={() => fileInputRef.current?.click()}
        onToggleLayoutMode={togglePageLayoutMode}
        onFileChange={handleFileChange}
        fileInputRef={fileInputRef}
        bindings={customKeybindings}
        onUpdateBinding={handleUpdateBinding}
        onUndo={undoCellAction}
        onRedo={redoCellAction}
        canUndo={historyLength > 0}
        canRedo={futureLength > 0}
        isCommandsOpen={isCommandsOpen}
        onToggleCommands={(anchorEl) => setIsCommandsOpen(Boolean(anchorEl))}
      />


      <NotebookBody
        activeCells={activeCells}
        isCanvas={isCanvas}
        gridConfig={gridConfig}
        activeCellId={activeCellId}
        copiedCellId={copiedCellId}
        copiedCellCodeId={copiedCellCodeId}
        pages={pages}
        activePageId={activePageId}
        editingPageId={editingPageId}
        showGridConfigModal={showGridConfigModal}
        onSelectPage={setActivePageId}
        onAddPage={addPage}
        onDeletePage={deletePage}
        onRenamePage={renamePage}
        onSetEditingPageId={setEditingPageId}
        onToggleGridModal={() => setShowGridConfigModal(!showGridConfigModal)}
        onUpdateGridConfig={updatePageGridConfig}
        onRun={runCell}
        onDelete={deleteCell}
        onMoveUp={moveCellUp}
        onMoveDown={moveCellDown}
        onToggleCodeCollapse={(id) =>
          setCells((prev) =>
            prev.map((c) => (c.id === id ? { ...c, isCodeCollapsed: !c.isCodeCollapsed } : c))
          )
        }
        onToggleOutputCollapse={(id) =>
          setCells((prev) =>
            prev.map((c) => (c.id === id ? { ...c, isOutputCollapsed: !c.isOutputCollapsed } : c))
          )
        }
        onChangeCellType={changeCellType}
        onUpdateCode={(id, code) =>
          setCells((prev) => prev.map((c) => (c.id === id ? { ...c, code } : c)))
        }
        onAddCell={addCellAtIndex}
        onSplitCell={splitCellAtIndex}
        onAdvanceCell={advanceCell}
        onClearOutput={clearCellOutput}
        onUndo={undoCellAction}
        onRedo={redoCellAction}
        canUndo={historyLength > 0}
        canRedo={futureLength > 0}
        onCopyCell={(id) => copyFlash(id, "cell")}
        onCopyCellCode={(id) => copyFlash(id, "code")}
        onSelectCell={setActiveCellId}
        onUpdateLayout={updateCellLayout}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDrop={handleDrop}
        onInteractionChange={setIsInteracting}
        onOpenCommands={() => setIsCommandsOpen(true)}
        keybindings={customKeybindings}
      />
    </div>
  );
}
