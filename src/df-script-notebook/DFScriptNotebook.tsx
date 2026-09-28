import React from "react";
import { CellLayout, CellState, CellType, NotebookPage, PageGridConfig } from "./types";
import { DEFAULT_GRID_CONFIG, WELCOME_NOTEBOOK } from "./constants";
import { downloadNotebookFile, parseNotebookJson, reorderArray } from "./utils";
import { buildExecutableBody, executeCodeScope, loadBabel } from "./execution";
import NotebookHeader from "./ui/sections/header/NotebookHeader";
import CanvasPageBar from "./ui/sections/canvas-bar/CanvasPageBar";
import CanvasBody from "./ui/sections/canvas-body/CanvasBody";
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

  const [activeCellId, setActiveCellId] = React.useState<string | null>(null);
  const [copiedCellId, setCopiedCellId] = React.useState<string | null>(null);
  const [copiedCellCodeId, setCopiedCellCodeId] = React.useState<string | null>(null);

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
      let finalJSCode = code;
      if (cell.type === "jsx") {
        const babel = await loadBabel();
        const transpiled =
          babel.transform(code, {
            presets: [["react", { runtime: "classic" }]],
            compact: true,
            filename: "cell.tsx",
          }).code || "";
        finalJSCode = transpiled;
      }

      const { bodyCode, declaredVars } = buildExecutableBody(code, cell.type, finalJSCode);
      const { returnValue, updatedVars } = await executeCodeScope(
        bodyCode,
        declaredVars,
        sharedStateRef.current
      );

      Object.assign(sharedStateRef.current, updatedVars);

      const elapsed = performance.now() - t0;
      const runNum = nextExecIndexRef.current++;

      setCells((prev) =>
        prev.map((c) =>
          c.id === cellId
            ? {
                ...c,
                output: returnValue,
                error: null,
                timeTaken: `${elapsed.toFixed(2)}ms`,
                execIndex: runNum,
                logs: cellLogs,
              }
            : c
        )
      );
    } catch (err: any) {
      const elapsed = performance.now() - t0;
      setCells((prev) =>
        prev.map((c) =>
          c.id === cellId
            ? {
                ...c,
                output: null,
                error: err?.message || String(err),
                timeTaken: `${elapsed.toFixed(2)}ms`,
                execIndex: nextExecIndexRef.current++,
                logs: cellLogs,
              }
            : c
        )
      );
    } finally {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
    }
  };

  const runAllCells = () => {
    sharedStateRef.current = {};
    nextExecIndexRef.current = 1;

    let chain = Promise.resolve();
    cells.forEach((cell) => {
      chain = chain.then(() => {
        if (cell.type === "code" || cell.type === "jsx") {
          return runCell(cell.id);
        }
        setCells((prev) => prev.map((c) => (c.id === cell.id ? { ...c, isCodeCollapsed: true } : c)));
        return Promise.resolve();
      });
    });
  };

  const addCellAtIndex = (index: number, type: CellType) => {
    const newId = `cell-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    let initialCode = "";
    if (type === "markdown") {
      initialCode = "## Double-click to edit Markdown\n* Bullet point 1\n* Bullet point 2";
    } else if (type === "jsx") {
      initialCode = `// JSX Cells let you render interactive React components natively!\nconst [count, setCount] = React.useState(0);\n\n<div className="flex flex-col gap-3 items-start font-sans">\n  <h4 className="text-sm font-semibold text-emerald-400">JSX Live Component Output</h4>\n  <p className="text-xs text-text-muted">This is a fully reactive cell rendering directly inside the virtual DOM!</p>\n  <button\n    onClick={() => setCount(count + 1)}\n    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-black font-mono text-xs rounded font-bold cursor-pointer"\n  >\n    Clicked: {count} times\n  </button>\n</div>`;
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
    if (activePage) {
      const updated = reorderArray(activePage.cellIds, index, index - 1);
      setPages((prev) => prev.map((p) => (p.id === activePageId ? { ...p, cellIds: updated } : p)));
    } else {
      setCells((prev) => reorderArray(prev, index, index - 1));
    }
  };

  const moveCellDown = (index: number) => {
    if (activePage) {
      if (index >= activePage.cellIds.length - 1) return;
      const updated = reorderArray(activePage.cellIds, index, index + 1);
      setPages((prev) => prev.map((p) => (p.id === activePageId ? { ...p, cellIds: updated } : p)));
    } else {
      if (index >= cells.length - 1) return;
      setCells((prev) => reorderArray(prev, index, index + 1));
    }
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
        execIndex: null,
        logs: [],
      }))
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

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = draggedCellIndexRef.current;
    if (sourceIndex === null || sourceIndex === targetIndex) return;

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

  return (
    <div
      id="df-script-notebook"
      className="grow h-full overflow-y-auto bg-[#060606] flex flex-col min-w-0 select-text animate-fade-in"
    >
      <NotebookHeader
        notebookName={notebookName}
        isEditingName={isEditingName}
        layoutMode={isCanvas ? "canvas" : "document"}
        onSetNotebookName={setNotebookName}
        onSetIsEditingName={setIsEditingName}
        onAddCell={(type) => addCellAtIndex(activeCells.length, type)}
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
      />

      {isCanvas && (
        <CanvasPageBar
          pages={pages}
          activePageId={activePageId}
          editingPageId={editingPageId}
          gridConfig={gridConfig}
          showGridConfigModal={showGridConfigModal}
          onSelectPage={setActivePageId}
          onAddPage={addPage}
          onDeletePage={deletePage}
          onRenamePage={renamePage}
          onSetEditingPageId={setEditingPageId}
          onToggleGridLines={() =>
            updatePageGridConfig({ showGridLines: !gridConfig.showGridLines })
          }
          onToggleGridModal={() => setShowGridConfigModal(!showGridConfigModal)}
          onUpdateGridConfig={updatePageGridConfig}
        />
      )}

      <CanvasBody
        activeCells={activeCells}
        isCanvas={isCanvas}
        gridConfig={gridConfig}
        activeCellId={activeCellId}
        copiedCellId={copiedCellId}
        copiedCellCodeId={copiedCellCodeId}
        onRunCell={runCell}
        onDeleteCell={deleteCell}
        onMoveCellUp={moveCellUp}
        onMoveCellDown={moveCellDown}
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
        onUpdateCellCode={(id, code) =>
          setCells((prev) => prev.map((c) => (c.id === id ? { ...c, code } : c)))
        }
        onAddCellAtIndex={addCellAtIndex}
        onCopyCell={(id) => copyFlash(id, "cell")}
        onCopyCellCode={(id) => copyFlash(id, "code")}
        onUpdateCellLayout={updateCellLayout}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />
    </div>
  );
}
