import React from "react";
import { $df } from "df-script";
import {
  PlaylistPlay,
  Add,
  DeleteSweep,
  RestartAlt,
  Save,
  FolderOpen,
  Edit
} from "@mui/icons-material"
import { CellState } from "./types";
import Cell from "./components/cell/Cell";
import "./styles.css";

const WELCOME_NOTEBOOK: CellState[] = [
  {
    id: "cell-intro",
    type: "markdown",
    code: `# DFScript Notebook Workspace
Welcome to your interactive notebook workspace!
* Run cells using the **YouTube-style play buttons** in the left margin.
* Alignments and spacing visual guides are synced natively.
* Double-click any Markdown cell to edit, and run it to render.
* Hover between cells to insert new **Code** or **Markdown** components!`,
    output: null,
    error: null,
    timeTaken: null,
    execIndex: null,
    logs: [],
    metadata: {},
    isCodeCollapsed: true,
    isOutputCollapsed: false
  },
  {
    id: "cell-1",
    type: "code",
    code: `// 1. Let's create our initial dataset using $df.data()
console.log("Initializing dataset 'sales'...");
const sales = $df.data({
  userId: ["usr-1", "usr-2", "usr-1", "usr-3", "usr-2"],
  price: [120, 450, 80, 200, 310],
  amount: [2, 1, 5, 2, 3],
  category: ["Books", "Electronics", "Books", "Toys", "Electronics"]
});

console.log("Success! 'sales' created with height:", sales.height);
sales`,
    output: null,
    error: null,
    timeTaken: null,
    execIndex: null,
    logs: [],
    metadata: {},
    isCodeCollapsed: false,
    isOutputCollapsed: false
  },
  {
    id: "cell-2",
    type: "code",
    code: `// 2. We can perform column expression math to calculate order value
const salesWithTotal = sales.with_columns(
  ($df.col("price").mul($df.col("amount"))).alias("total")
);

salesWithTotal`,
    output: null,
    error: null,
    timeTaken: null,
    execIndex: null,
    logs: [],
    metadata: {},
    isCodeCollapsed: false,
    isOutputCollapsed: false
  },
  {
    id: "cell-3",
    type: "code",
    code: `// 3. Next, aggregate total sales and average price by category
const summary = salesWithTotal
  .groupby("category")
  .agg([
    $df.col("total").sum().alias("categoryTotal"),
    $df.col("price").mean().alias("avgPrice")
  ]);

summary`,
    output: null,
    error: null,
    timeTaken: null,
    execIndex: null,
    logs: [],
    metadata: {},
    isCodeCollapsed: false,
    isOutputCollapsed: false
  }
];

export default function DFScriptNotebook() {
  const [notebookName, setNotebookName] = React.useState("untitled_notebook.dfnb");
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [cells, setCells] = React.useState<CellState[]>(WELCOME_NOTEBOOK);
  const [activeCellId, setActiveCellId] = React.useState<string | null>(null);
  const [copiedCellId, setCopiedCellId] = React.useState<string | null>(null);
  const [copiedCellCodeId, setCopiedCellCodeId] = React.useState<string | null>(null);

  const nextExecIndexRef = React.useRef(1);
  const sharedStateRef = React.useRef<Record<string, any>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const babelRef = React.useRef<any>(null);
  const [isBabelLoading, setIsBabelLoading] = React.useState(false);

  // Shared button styles
  const BTN_BASE = "flex items-center gap-1.5 font-mono tracking-wider uppercase border border-[(--nb-border-default)] bg-[(--nb-bg-surface)] hover:bg-[(--nb-bg-hover)] text-[(--nb-text-secondary)] hover:text-[(--nb-text-primary)] transition-colors rounded cursor-pointer";
  const BTN_SM = `${BTN_BASE} px-2.5 py-1.5 text-[9px] font-semibold`;
  const BTN_MD = `${BTN_BASE} px-3 py-1.5 text-[10px] font-medium`;

  const CELL_TYPES = [
    { type: "code" as const, label: "Code" },
    { type: "jsx" as const, label: "JSX" },
    { type: "markdown" as const, label: "Markdown" },
  ];

  const findLastExpressionLine = (code: string) => {
    const lines = code.split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() && !lines[i].trim().startsWith("//") && !lines[i].trim().startsWith("/*")) {
        return { lastLine: lines[i].trim(), lastLineIndex: i };
      }
    }
    return { lastLine: "", lastLineIndex: -1 };
  };

  const copyFlash = (id: string, type: "cell" | "code" = "cell") => {
    if (type === "code") {
      setCopiedCellCodeId(id);
      setTimeout(() => setCopiedCellCodeId(null), 1500);
    } else {
      setCopiedCellId(id);
      setTimeout(() => setCopiedCellId(null), 1500);
    }
  };

  const loadBabel = async () => {
    if (babelRef.current) return babelRef.current;
    setIsBabelLoading(true);
    try {
      // @ts-ignore
      const module = await import("https://esm.sh/@babel/standalone");
      babelRef.current = module.default || module;
      return babelRef.current;
    } catch (e) {
      console.error("Failed to load Babel: ", e);
      throw new Error("Failed to load Babel standalone transpiler from CDN. Please check your internet connection.");
    } finally {
      setIsBabelLoading(false);
    }
  };

  const extractDeclaredVars = (code: string) => {
    const vars: string[] = [];
    const regex = /(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=|function\s+([a-zA-Z_$][\w$]*)\s*\(/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
      const name = match[1] || match[2];
      if (name && !vars.includes(name)) {
        vars.push(name);
      }
    }
    return vars;
  };

  const runCell = async (cellId: string) => {
    const cellIndex = cells.findIndex(c => c.id === cellId);
    if (cellIndex === -1) return;

    const cell = cells[cellIndex];

    if (cell.type === "markdown") {
      setCells(prev => prev.map(c => c.id === cellId ? { ...c, isCodeCollapsed: true } : c));
      return;
    }

    const code = cell.code.trim();
    if (!code) return;

    setCells(prev => prev.map(c => c.id === cellId ? { ...c, execIndex: null, error: null, timeTaken: "..." } : c));

    await new Promise(resolve => setTimeout(resolve, 50));

    const t0 = performance.now();
    const cellLogs: string[] = [];
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    const collectLog = (...args: any[]) => {
      originalLog(...args);
      const msg = args.map(arg => {
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
      }).join(" ");
      cellLogs.push(msg);
    };

    console.log = collectLog;
    console.warn = collectLog;
    console.error = collectLog;
    console.info = collectLog;

    try {
      let finalJSCode = code;

      if (cell.type === "jsx") {
        let babel;
        try {
          babel = await loadBabel();
        } catch (babelErr: any) {
          throw babelErr;
        }

        const transpiled = babel.transform(code, {
          presets: [["react", { runtime: "classic" }]],
          compact: true,
          filename: "cell.tsx"
        }).code || "";
        finalJSCode = transpiled;
      }

      const declaredVars = extractDeclaredVars(code);
      const filteredKeys = Object.keys(sharedStateRef.current).filter(k => !declaredVars.includes(k));
      const filteredVals = filteredKeys.map(k => sharedStateRef.current[k]);
      const varExports = declaredVars.map(v => `${v}: typeof ${v} !== 'undefined' ? ${v} : undefined`).join(',\n');

      let bodyCode = "";
      if (cell.type === "jsx") {
        const { lastLine, lastLineIndex } = findLastExpressionLine(finalJSCode);
        const lines = finalJSCode.split("\n");

        let componentBody = "";
        if (lastLine && !/^(const|let|var|function|class|return|if|for|while|try|import|throw)\b/.test(lastLine)) {
          const cleanLastLine = lastLine.endsWith(";") ? lastLine.slice(0, -1) : lastLine;
          const prefix = lines.slice(0, lastLineIndex).join("\n");
          componentBody = `
            ${prefix}
            return (${cleanLastLine});
          `;
        } else {
          componentBody = `
            ${finalJSCode}
          `;
        }

        bodyCode = `
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
      } else {
        const { lastLine, lastLineIndex } = findLastExpressionLine(finalJSCode);
        const lines = finalJSCode.split("\n");

        if (lastLine && !/^(const|let|var|function|class|return|if|for|while|try|import|throw)\b/.test(lastLine)) {
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
      }

      const htmlHelper = (str: string) => ({ toHTML: () => str });
      const hookKeys = ["React.useState", "React.useEffect", "React.useRef", "useMemo", "useCallback", "useContext", "html"];
      const hookVals = [React.useState, React.useEffect, React.useRef, React.useMemo, React.useCallback, React.useContext, htmlHelper];

      ($df as any).html = htmlHelper;

      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction("$df", "React", ...hookKeys, ...filteredKeys, bodyCode);
      const execRes = await fn($df, React, ...hookVals, ...filteredVals);
      const elapsed = performance.now() - t0;

      let outputVal = undefined;
      if (execRes) {
        outputVal = execRes._returnValue;
        for (const key of Object.keys(execRes)) {
          if (key !== "_returnValue") {
            sharedStateRef.current[key] = execRes[key];
          }
        }
      }

      const runNum = nextExecIndexRef.current++;
      setCells(prev => prev.map(c => c.id === cellId ? {
        ...c,
        output: outputVal,
        error: null,
        timeTaken: `${elapsed.toFixed(2)}ms`,
        execIndex: runNum,
        logs: cellLogs
      } : c));
    } catch (err: any) {
      const elapsed = performance.now() - t0;
      setCells(prev => prev.map(c => c.id === cellId ? {
        ...c,
        output: null,
        error: err?.message || String(err),
        timeTaken: `${elapsed.toFixed(2)}ms`,
        execIndex: nextExecIndexRef.current++,
        logs: cellLogs
      } : c));
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
        } else {
          setCells(prev => prev.map(c => c.id === cell.id ? { ...c, isCodeCollapsed: true } : c));
          return Promise.resolve();
        }
      });
    });
  };

  const addCellAtIndex = (index: number, type: "code" | "jsx" | "markdown") => {
    const newId = `cell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    let initialCode = "";
    if (type === "markdown") {
      initialCode = "## Double-click to edit Markdown\n* Bullet point 1\n* Bullet point 2";
    } else if (type === "jsx") {
      initialCode = `// JSX Cells let you render interactive React components natively!
const [count, setCount] = React.useState(0);

<div className="flex flex-col gap-3 items-start font-sans">
  <h4 className="text-sm font-semibold text-emerald-400">JSX Live Component Output</h4>
  <p className="text-xs text-text-muted">This is a fully reactive cell rendering directly inside the virtual DOM!</p>
  <button
    onClick={() => setCount(count + 1)}
    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-black font-mono text-xs rounded font-bold cursor-pointer"
  >
    Clicked: {count} times
  </button>
</div>`;
    }

    const newCell: CellState = {
      id: newId,
      type,
      code: initialCode,
      output: null,
      error: null,
      timeTaken: null,
      execIndex: null,
      isCodeCollapsed: false,
      isOutputCollapsed: false
    };
    setCells(prev => {
      const copy = [...prev];
      copy.splice(index, 0, newCell);
      return copy;
    });
    setActiveCellId(newId);
  };

  const addCell = () => {
    addCellAtIndex(cells.length, "code");
  };

  const deleteCell = (id: string) => {
    setCells(prev => prev.filter(c => c.id !== id));
    if (activeCellId === id) {
      setActiveCellId(null);
    }
  };

  const moveCellUp = (index: number) => {
    if (index === 0) return;
    setCells(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const moveCellDown = (index: number) => {
    if (index === cells.length - 1) return;
    setCells(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  const toggleCodeCollapse = (id: string) => {
    setCells(prev => prev.map(c => c.id === id ? { ...c, isCodeCollapsed: !c.isCodeCollapsed } : c));
  };

  const toggleOutputCollapse = (id: string) => {
    setCells(prev => prev.map(c => c.id === id ? { ...c, isOutputCollapsed: !c.isOutputCollapsed } : c));
  };

  const clearOutputs = () => {
    setCells(prev => prev.map(c => ({
      ...c,
      output: null,
      error: null,
      timeTaken: null,
      execIndex: null,
      logs: []
    })));
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
          isOutputCollapsed: false
        }
      ]);
    }
  };

  const saveNotebook = () => {
    const dataStr = JSON.stringify({ name: notebookName, cells }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = notebookName.endsWith(".dfnb") ? notebookName : `${notebookName}.dfnb`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const triggerLoadNotebook = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.cells)) {
          setNotebookName(parsed.name || file.name);
          setCells(parsed.cells);
          sharedStateRef.current = {};
          nextExecIndexRef.current = 1;
        } else {
          alert("Invalid notebook format. Ensure it contains a valid cells list.");
        }
      } catch (err) {
        alert("Failed to parse notebook file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const updateCellCode = (id: string, newCode: string) => {
    setCells(prev => prev.map(c => c.id === id ? { ...c, code: newCode } : c));
  };

  return (
    <div id="df-script-notebook" className="grow h-full overflow-y-auto bg-[(--nb-bg-app)] flex flex-col min-w-0 select-text animate-fade-in">

      <div className="sticky top-0 bg-[(--nb-bg-app-rgb)/95] backdrop-blur-md z-30 border-b border-[(--nb-border-cell)] shadow-lg w-full flex justify-center py-4 px-6 md:px-10 select-none shrink-0">
        <div className="w-full max-w-4xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📓</span>
            {isEditingName ? (
              <input
                type="text"
                value={notebookName}
                onChange={(e) => setNotebookName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => { if (e.key === "Enter") setIsEditingName(false); }}
                autoFocus
                className="bg-[(--nb-bg-surface)] border border-[(--nb-border-default)] rounded px-2 py-0.5 text-[(--nb-text-primary)] font-mono text-sm focus:outline-none focus:border-[(--nb-text-secondary)]"
              />
            ) : (
              <h1
                onClick={() => setIsEditingName(true)}
                className="text-sm font-mono font-semibold text-[(--nb-text-primary)] cursor-pointer hover:text-emerald-400 transition-colors flex items-center gap-1.5"
              >
                {notebookName}
                <span className="text-[(--nb-text-muted)] text-[10px]">
                  <Edit className="w-3 h-3" />
                </span>
              </h1>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {CELL_TYPES.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => addCellAtIndex(cells.length, type)}
                className={BTN_SM}
              >
                <Add className="w-3.5 h-3.5" /> + {label}
              </button>
            ))}
            <button onClick={runAllCells} className={BTN_MD}>
              <PlaylistPlay className="w-3.5 h-3.5" /> Run All
            </button>
            <button onClick={clearOutputs} className={BTN_MD}>
              <DeleteSweep className="w-3.5 h-3.5" /> Clear Outputs
            </button>
            <button onClick={resetNotebook} className={BTN_MD}>
              <RestartAlt className="w-3.5 h-3.5" /> Reset
            </button>
            <button onClick={saveNotebook} className={BTN_MD}>
              <Save className="w-3.5 h-3.5" /> Save
            </button>
            <button onClick={triggerLoadNotebook} className={BTN_MD}>
              <FolderOpen className="w-3.5 h-3.5" /> Load
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".dfnb"
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 px-6 md:px-10 pt-2 pb-24">
        {cells.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3 border border-dashed border-[(--nb-border-default)] rounded bg-[(--nb-bg-surface-rgb)/40] select-none">
            <span className="text-3xl">📓</span>
            <p className="text-xs text-[(--nb-text-muted)]">Your notebook is empty. Click "+ Code" above to add a cell.</p>
          </div>
        ) : (
          cells.map((cell, idx) => (
            <Cell
              key={cell.id}
              cell={cell}
              index={idx}
              isActive={activeCellId === cell.id}
              totalCells={cells.length}
              copiedCellId={copiedCellId}
              copiedCellCodeId={copiedCellCodeId}
              onRun={runCell}
              onDelete={deleteCell}
              onMoveUp={moveCellUp}
              onMoveDown={moveCellDown}
              onToggleCodeCollapse={toggleCodeCollapse}
              onToggleOutputCollapse={toggleOutputCollapse}
              onUpdateCode={updateCellCode}
              onAddCell={addCellAtIndex}
              onCopyCell={(id) => copyFlash(id, "cell")}
              onCopyCellCode={(id) => copyFlash(id, "code")}
            />
          ))
        )}
      </div>

    </div>
  );
}
