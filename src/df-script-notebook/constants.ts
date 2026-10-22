import { CellState } from "./types";

export const DEFAULT_GRID_CONFIG = {
  columns: 12,
  rows: 35,
  rowHeight: 48,
  showGridLines: true,
};

export const CELL_TYPES = [
  { type: "code" as const, label: "Code" },
  { type: "markdown" as const, label: "Markdown" },
];

export const WELCOME_NOTEBOOK: CellState[] = [
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
