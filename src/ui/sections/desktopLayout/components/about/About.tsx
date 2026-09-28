import React from "react";
import { marked } from "marked";
import { $df, DataFrame } from "df-script";
import { Footer } from "../footer/Footer";
import { useGithubReadme } from "../../../../../hooks/useGithubHooks";
import { CodeBlock } from "../../../../elements";
import Cell from "../../../../../df-script-notebook/ui/elements/cell/Cell";
import { CellState } from "../../../../../df-script-notebook/types";
import "../../../../../df-script-notebook/styles.css";

// Realistic synthetic dataset generators for benchmarking real-world workloads
const CATEGORIES = ["Electronics", "Appliances", "Furniture", "Apparel", "Tools", "Automotive", "Sports", "Beauty", "Books", "Office"];
const SYMBOLS = ["AAPL", "NVDA", "MSFT", "AMZN", "GOOGL"];

const INITIAL_USERS = Array.from({ length: 150 }, (_, i) => ({
  id: `USR-${i.toString().padStart(4, "0")}`,
  name: `User_${i}`,
  tier: i % 3 === 0 ? "Enterprise" : i % 2 === 0 ? "Pro" : "Starter",
  discountRate: (i % 5) * 0.05
}));

const INITIAL_SALES = Array.from({ length: 1200 }, (_, i) => {
  const userIdx = (i * 7) % 160; // intentionally introduce some missing user IDs
  const rawId = userIdx < 150 ? ` usr-${userIdx.toString().padStart(4, "0")}  ` : `USR-${userIdx} `;
  return {
    saleId: `TX-${10000 + i}`,
    userId: rawId,
    price: (i % 13 === 0) ? null : 15 + ((i * 17) % 450),
    amount: 1 + (i % 8),
    category: CATEGORIES[i % CATEGORIES.length],
    channel: i % 2 === 0 ? "Online" : "Retail"
  };
});

// High-frequency market time-series for ASOF temporal alignment
// Seed quotes starting from timestamp 900 so every ticker has established market quotes before trades begin
const INITIAL_QUOTES = Array.from({ length: 1000 }, (_, i) => ({
  time: 900 + i * 4,
  symbol: SYMBOLS[i % SYMBOLS.length],
  bid: +(150 + Math.sin(i * 0.1) * 10 + (i % 7) * 0.25).toFixed(2),
  ask: +(150.1 + Math.sin(i * 0.1) * 10 + (i % 7) * 0.25).toFixed(2)
}));

const INITIAL_TRADES = Array.from({ length: 350 }, (_, i) => ({
  time: 1000 + i * 11, // async unsynced timestamps starting at 1000
  symbol: SYMBOLS[i % SYMBOLS.length],
  price: +(150.05 + Math.sin(i * 0.2) * 10).toFixed(2),
  volume: 100 * (1 + (i % 5))
}));

const COMPARISON_GRID_CONFIG = {
  columns: 12,
  rows: 35,
  rowHeight: 48,
  showGridLines: true,
};

const COMPARISON_CELLS: CellState[] = [
  {
    id: "setup-data",
    type: "code",
    layout: { x: 0, y: 0, w: 12, h: 9, z: 1 },
    code: `// Initial Real-World Datasets (1,200 Sales, 150 Users, 350 Trades, 800 Quotes)
// Includes dirty string keys, whitespace, outliers, nulls, and high-frequency timestamps.
const CATEGORIES = ["Electronics", "Appliances", "Furniture", "Apparel", "Tools", "Automotive", "Sports", "Beauty", "Books", "Office"];
const SYMBOLS = ["AAPL", "NVDA", "MSFT", "AMZN", "GOOGL"];

const users = Array.from({ length: 150 }, (_, i) => ({
  id: \`USR-\${i.toString().padStart(4, "0")}\`,
  name: \`User_\${i}\`,
  tier: i % 3 === 0 ? "Enterprise" : i % 2 === 0 ? "Pro" : "Starter",
  discountRate: (i % 5) * 0.05
}));

const sales = Array.from({ length: 1200 }, (_, i) => {
  const userIdx = (i * 7) % 160;
  const rawId = userIdx < 150 ? \` usr-\${userIdx.toString().padStart(4, "0")}  \` : \`USR-\${userIdx} \`;
  return {
    saleId: \`TX-\${10000 + i}\`,
    userId: rawId,
    price: (i % 13 === 0) ? null : 15 + ((i * 17) % 450),
    amount: 1 + (i % 8),
    category: CATEGORIES[i % CATEGORIES.length],
    channel: i % 2 === 0 ? "Online" : "Retail"
  };
});

const quotes = Array.from({ length: 1000 }, (_, i) => ({
  time: 900 + i * 4,
  symbol: SYMBOLS[i % SYMBOLS.length],
  bid: +(150 + Math.sin(i * 0.1) * 10 + (i % 7) * 0.25).toFixed(2),
  ask: +(150.1 + Math.sin(i * 0.1) * 10 + (i % 7) * 0.25).toFixed(2)
}));

const trades = Array.from({ length: 350 }, (_, i) => ({
  time: 1000 + i * 11,
  symbol: SYMBOLS[i % SYMBOLS.length],
  price: +(150.05 + Math.sin(i * 0.2) * 10).toFixed(2),
  volume: 100 * (1 + (i % 5))
}));

// Pre-initialize DataFrames so construction time is not added to query execution
const usersDf = $df.data(users);
const salesDf = $df.data(sales);
const tradesDf = $df.data(trades);
const quotesDf = $df.data(quotes);

salesDf`,
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
    id: "join-js",
    type: "code",
    layout: { x: 0, y: 9, w: 6, h: 8, z: 1 },
    code: `// 1. Standard JS/TS Join (Nested find with manual cleaning and normalization)
// Real-world: trim dirty IDs, lowercase, guard null prices, and project combined fields
const joined = sales
  .filter(s => s && s.price != null && s.price >= 20 && s.price <= 400)
  .map(s => {
    const cleanUserId = String(s.userId).trim().toLowerCase();
    const user = users.find(u => u && String(u.id).trim().toLowerCase() === cleanUserId);
    if (!user) return null;
    return {
      saleId: s.saleId,
      userId: cleanUserId,
      category: s.category,
      channel: s.channel,
      price: s.price,
      amount: s.amount,
      total: s.price * s.amount * (1 - user.discountRate),
      userName: user.name,
      userTier: user.tier
    };
  })
  .filter(item => item !== null);

joined`,
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
    id: "join-df",
    type: "code",
    layout: { x: 6, y: 9, w: 6, h: 8, z: 1 },
    code: `// 1. df-script Declarative Join (Column-oriented Hash Join with vectorized string ops)
const cleanSalesDf = salesDf
  .filter(
    $df.col("price").isNotNull()
      .and($df.col("price").between(20, 400))
  )
  .withColumns($df.col("userId").str.trim().str.toLowerCase());

const cleanUsersDf = usersDf
  .withColumns($df.col("id").str.trim().str.toLowerCase().alias("userId"));

const joinedDf = cleanSalesDf
  .join(cleanUsersDf, { on: "userId", how: "inner" })
  .withColumns(
    ($df.col("price").mul($df.col("amount")).mul($df.lit(1).sub($df.col("discountRate")))).alias("total")
  );

joinedDf`,
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
    id: "groupby-js",
    type: "code",
    layout: { x: 0, y: 17, w: 6, h: 8, z: 1 },
    code: `// 2. Standard JS/TS Multi-Metric GroupBy & Normalization (Multiple passes & loops)
// Calculate Total Revenue, Average Price, Units Sold, and Avg Basket Size per category
const validSales = sales.filter(s => s && s.price != null);
const uniqueCategories = Array.from(new Set(validSales.map(s => s.category)));

const summary = uniqueCategories.map(cat => {
  const catRows = validSales.filter(s => s.category === cat);
  const totalRevenue = catRows.reduce((acc, s) => acc + (s.price * s.amount), 0);
  const totalUnits = catRows.reduce((acc, s) => acc + s.amount, 0);
  const avgPrice = catRows.reduce((acc, s) => acc + s.price, 0) / catRows.length;
  const avgBasket = totalRevenue / catRows.length;

  return {
    category: cat,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalUnits,
    avgPrice: Math.round(avgPrice * 100) / 100,
    avgBasket: Math.round(avgBasket * 100) / 100
  };
});

summary`,
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
    id: "groupby-df",
    type: "code",
    layout: { x: 6, y: 17, w: 6, h: 8, z: 1 },
    code: `// 2. df-script Declarative GroupBy (Single-pass multi-column vectorized aggregations)
const summaryDf = salesDf
  .filter($df.col("price").isNotNull())
  .withColumns(($df.col("price").mul($df.col("amount"))).alias("revenue"))
  .groupBy("category")
  .agg([
    $df.col("revenue").sum().round(2).alias("totalRevenue"),
    $df.col("amount").sum().alias("totalUnits"),
    $df.col("price").mean().round(2).alias("avgPrice"),
    $df.col("revenue").mean().round(2).alias("avgBasket")
  ]);

summaryDf`,
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
    id: "asof-js",
    type: "code",
    layout: { x: 0, y: 25, w: 6, h: 9, z: 1 },
    code: `// 3. Standard JS/TS ASOF Join (Match trades with closest prior market quote)
// Group quotes by symbol, sort timestamps, and find nearest preceding quote for each trade
const asofJoined = trades.map(trade => {
  const matchingQuotes = quotes
    .filter(q => q.symbol === trade.symbol && q.time <= trade.time)
    .sort((a, b) => b.time - a.time); // descending sort
  
  const latest = matchingQuotes[0] || null;
  return {
    time: trade.time,
    symbol: trade.symbol,
    tradePrice: trade.price,
    volume: trade.volume,
    bid: latest ? latest.bid : null,
    ask: latest ? latest.ask : null,
    spread: latest ? +(latest.ask - latest.bid).toFixed(2) : null
  };
});

asofJoined`,
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
    id: "asof-df",
    type: "code",
    layout: { x: 6, y: 25, w: 6, h: 9, z: 1 },
    code: `// 3. df-script Declarative joinAsof (Vectorized binary search across time partitions)
const asofDf = tradesDf
  .joinAsof(quotesDf, {
    on: "time",
    by: "symbol",
    strategy: "backward"
  })
  .withColumns(
    ($df.col("ask").sub($df.col("bid"))).round(2).alias("spread")
  );

asofDf`,
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

export function About() {
  const [activeTab, setActiveTab] = React.useState<"readme" | "comparisons">("readme");
  const readmeTabRef = React.useRef<HTMLButtonElement>(null);
  const comparisonsTabRef = React.useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = React.useState<{ left: number; width: number }>({ left: 0, width: 0 });

  React.useLayoutEffect(() => {
    const activeEl = activeTab === "readme" ? readmeTabRef.current : comparisonsTabRef.current;
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth
      });
    }
  }, [activeTab]);
  const { markdown, isLoading, error } = useGithubReadme();

  // Notebook cell states & shared execution scope
  const [cells, setCells] = React.useState<CellState[]>(COMPARISON_CELLS);
  const [activeCellId, setActiveCellId] = React.useState<string | null>(null);
  const [copiedCellId, setCopiedCellId] = React.useState<string | null>(null);
  const [copiedCellCodeId, setCopiedCellCodeId] = React.useState<string | null>(null);
  const sharedStateRef = React.useRef<Record<string, any>>({
    users: INITIAL_USERS,
    sales: INITIAL_SALES,
    trades: INITIAL_TRADES,
    quotes: INITIAL_QUOTES,
    usersDf: $df.data(INITIAL_USERS),
    salesDf: $df.data(INITIAL_SALES),
    tradesDf: $df.data(INITIAL_TRADES),
    quotesDf: $df.data(INITIAL_QUOTES)
  });
  const [gridConfig, setGridConfig] = React.useState(COMPARISON_GRID_CONFIG);
  const [isInteracting, setIsInteracting] = React.useState(false);
  const nextExecIndexRef = React.useRef(1);

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

  const findLastExpressionLine = (code: string) => {
    const lines = code.split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      const trimmed = lines[i].trim();
      if (trimmed && !trimmed.startsWith("//") && !trimmed.startsWith("/*")) {
        return { lastLine: trimmed, lastLineIndex: i };
      }
    }
    return { lastLine: "", lastLineIndex: -1 };
  };

  const runCell = async (cellId: string) => {
    const cellIndex = cells.findIndex(c => c.id === cellId);
    if (cellIndex === -1) return;

    const cell = cells[cellIndex];
    const code = cell.code.trim();
    if (!code) return;

    setCells(prev => prev.map(c => c.id === cellId ? { ...c, execIndex: null, error: null, timeTaken: "..." } : c));
    await new Promise(resolve => setTimeout(resolve, 30));

    const t0 = performance.now();
    const cellLogs: string[] = [];
    const originalLog = console.log;
    const collectLog = (...args: any[]) => {
      originalLog(...args);
      cellLogs.push(args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" "));
    };
    console.log = collectLog;

    try {
      const declaredVars = extractDeclaredVars(code);
      const filteredKeys = Object.keys(sharedStateRef.current).filter(k => !declaredVars.includes(k));
      const filteredVals = filteredKeys.map(k => sharedStateRef.current[k]);
      const varExports = declaredVars.map(v => `${v}: typeof ${v} !== 'undefined' ? ${v} : undefined`).join(',\n');

      const { lastLine, lastLineIndex } = findLastExpressionLine(code);
      const lines = code.split("\n");

      let bodyCode = "";
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
          ${code}
          return {
            _returnValue: undefined,
            ${varExports}
          };
        `;
      }

      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction("$df", "DataFrame", "React", ...filteredKeys, bodyCode);
      const execRes = await fn($df, DataFrame, React, ...filteredVals);
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
    }
  };

  const handleUpdateCode = (id: string, newCode: string) => {
    setCells(prev => prev.map(c => c.id === id ? { ...c, code: newCode } : c));
  };

  const handleToggleCodeCollapse = (id: string) => {
    setCells(prev => prev.map(c => c.id === id ? { ...c, isCodeCollapsed: !c.isCodeCollapsed } : c));
  };

  const handleToggleOutputCollapse = (id: string) => {
    setCells(prev => prev.map(c => c.id === id ? { ...c, isOutputCollapsed: !c.isOutputCollapsed } : c));
  };

  const handleCopyCell = (id: string) => {
    setCopiedCellId(id);
    setTimeout(() => setCopiedCellId(null), 1500);
  };

  const handleCopyCellCode = (id: string) => {
    setCopiedCellCodeId(id);
    setTimeout(() => setCopiedCellCodeId(null), 1500);
  };

  const handleUpdateCellLayout = (id: string, layout: Partial<import("../../../../../df-script-notebook/types").CellLayout>) => {
    setCells(prev => prev.map(c => c.id === id ? { ...c, layout: { ...(c.layout ?? { x: 0, y: 0, w: 6, h: 8, z: 1 }), ...layout } } : c));
  };

  return (
    <main className="flex-grow flex flex-col h-full bg-[#060606] min-w-0 select-text overflow-hidden">
      {/* Pinned Header: Tabs Bar & Contributor Credit */}
      <div className="w-full bg-[#060606]/95 backdrop-blur-md z-20 shrink-0 px-6 md:px-12 pt-4">
        <div className={`mx-auto flex items-center justify-between border-b border-border-dark transition-all duration-300 ${activeTab === "comparisons" ? "w-full max-w-7xl" : "max-w-3xl"}`}>
          {/* Tab Bar */}
          <div className="flex items-center gap-8 select-none relative">
            <button
              ref={readmeTabRef}
              onClick={() => setActiveTab("readme")}
              className={`pb-3 text-xs font-semibold tracking-widest uppercase transition-colors cursor-pointer font-outfit ${
                activeTab === "readme" ? "text-white" : "text-text-muted hover:text-white"
              }`}
            >
              README
            </button>
            <button
              ref={comparisonsTabRef}
              onClick={() => setActiveTab("comparisons")}
              className={`pb-3 text-xs font-semibold tracking-widest uppercase transition-colors cursor-pointer font-outfit ${
                activeTab === "comparisons" ? "text-white" : "text-text-muted hover:text-white"
              }`}
            >
              COMPARISONS
            </button>

            {/* Smoothly Translating Underline Indicator */}
            <span
              className="absolute bottom-0 h-[2px] bg-white rounded-full transition-all duration-300 ease-out pointer-events-none"
              style={{
                left: 0,
                width: `${indicatorStyle.width}px`,
                transform: `translateX(${indicatorStyle.left}px)`,
                opacity: indicatorStyle.width > 0 ? 1 : 0
              }}
            />
          </div>

          <p className="pb-3 text-[9px] font-mono text-text-dim uppercase tracking-wider select-none hidden sm:block">
            Written by the df-script core contributors
          </p>
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className={`flex-grow overflow-y-auto py-8 flex justify-center ${activeTab === "comparisons" ? "px-4 md:px-8" : "px-6 md:px-12"}`}>
        <div className={`w-full flex flex-col gap-8 pb-20 transition-all duration-300 ${activeTab === "comparisons" ? "max-w-7xl" : "max-w-3xl"}`}>

        {/* Tab 1: README */}
        {activeTab === "readme" && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider">
                df-script repository readme
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-text-dim">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    isLoading ? "bg-amber-400 animate-pulse" : error ? "bg-red-400" : "bg-emerald-400"
                  }`}
                />
                <span>
                  {isLoading
                    ? "fetching from github..."
                    : error
                    ? "failed to load"
                    : "synced from github"}
                </span>
              </div>
            </div>

            {isLoading && (
              <div className="flex flex-col gap-3 py-6 animate-pulse">
                <div className="h-6 bg-[#111111] rounded w-2/3"></div>
                <div className="h-4 bg-[#111111] rounded w-full"></div>
                <div className="h-4 bg-[#111111] rounded w-5/6"></div>
                <div className="h-4 bg-[#111111] rounded w-3/4"></div>
                <div className="h-24 bg-[#111111] rounded w-full mt-4"></div>
              </div>
            )}

            {error && (
              <div className="border border-red-950/40 bg-red-950/10 rounded p-4 text-[12px] font-mono text-red-400">
                {error}
              </div>
            )}

            {markdown && !isLoading && (
              <div
                className="flex flex-col gap-4 text-text-muted leading-relaxed [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-white [&_h1]:font-outfit [&_h1]:mt-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:font-outfit [&_h2]:mt-6 [&_h2]:border-b [&_h2]:border-border-dark [&_h2]:pb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white [&_h3]:font-outfit [&_h3]:mt-4 [&_p]:mb-2 [&_p_strong]:text-white [&_p_code]:font-mono [&_p_code]:text-[11px] [&_p_code]:text-emerald-400 [&_p_code]:bg-[#111111] [&_p_code]:px-1.5 [&_p_code]:py-0.5 [&_p_code]:rounded [&_pre]:bg-[#0c0c0c] [&_pre]:border [&_pre]:border-border-dark [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_code]:font-mono [&_code]:text-[11px] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_li]:text-text-muted [&_li_strong]:text-white [&_li_code]:font-mono [&_li_code]:text-[11px] [&_li_code]:text-emerald-400 [&_li_code]:bg-[#111111] [&_li_code]:px-1.5 [&_li_code]:py-0.5 [&_li_code]:rounded [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border-dark [&_th]:p-2 [&_th]:text-left [&_th]:text-white [&_th]:text-xs [&_td]:border [&_td]:border-border-dark [&_td]:p-2 [&_td]:text-xs [&_hr]:border-border-dark [&_hr]:my-6 [&_a]:text-emerald-400 [&_a]:underline"
                dangerouslySetInnerHTML={{
                  __html: marked.parse(markdown, { gfm: true, breaks: true }) as string
                }}
              />
            )}
          </section>
        )}

        {/* Tab 2: Comparisons */}
        {activeTab === "comparisons" && (
          <section className="flex flex-col gap-6" id="df-script-notebook">
            <div className="flex flex-col gap-3">
              <div className="text-[11px] font-mono text-[#e5e5e5] uppercase tracking-wider">
                interactive live canvas: standard js vs. df-script
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Run and edit each code block directly on the 2D grid canvas below. Notice how <code>df-script</code> delivers declarative queries, automatic timing badges, and rich native DataFrame table rendering with column schemas.
              </p>
            </div>

            {/* 2D Grid Canvas Comparison Layout */}
            <div className="w-full overflow-x-auto">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${gridConfig.columns}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${gridConfig.rows}, ${gridConfig.rowHeight}px)`,
                  gridAutoRows: `${gridConfig.rowHeight}px`,
                  gap: "12px",
                  position: "relative",
                  minHeight: `${gridConfig.rows * gridConfig.rowHeight}px`,
                  backgroundImage: isInteracting
                    ? `linear-gradient(to right, rgba(62, 166, 255, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(62, 166, 255, 0.12) 1px, transparent 1px)`
                    : gridConfig.showGridLines
                    ? `linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)`
                    : "none",
                  backgroundSize: `${100 / gridConfig.columns}% ${gridConfig.rowHeight}px`,
                  backgroundPosition: "0 0",
                }}
                className={`rounded-xl border p-3 min-w-[760px] transition-all duration-300 ${
                  isInteracting
                    ? "border-blue-500/20 bg-blue-500/[0.015]"
                    : "border-white/[0.04] bg-transparent"
                }`}
              >
                {cells.map((cell, idx) => (
                  <Cell
                    key={cell.id}
                    cell={cell}
                    index={idx}
                    isActive={activeCellId === cell.id}
                    totalCells={cells.length}
                    copiedCellId={copiedCellId}
                    copiedCellCodeId={copiedCellCodeId}
                    onRun={runCell}
                    onDelete={() => {}}
                    onMoveUp={() => {}}
                    onMoveDown={() => {}}
                    onToggleCodeCollapse={handleToggleCodeCollapse}
                    onToggleOutputCollapse={handleToggleOutputCollapse}
                    onUpdateCode={handleUpdateCode}
                    onAddCell={() => {}}
                    onCopyCell={handleCopyCell}
                    onCopyCellCode={handleCopyCellCode}
                    onUpdateLayout={handleUpdateCellLayout}
                    isGridCanvasMode={true}
                    gridConfig={gridConfig}
                    onInteractionChange={setIsInteracting}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <Footer className="pt-8" />
        </div>
      </div>
    </main>
  );
}
