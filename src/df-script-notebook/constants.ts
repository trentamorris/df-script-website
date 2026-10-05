import { CellState } from "./types";

export const DEFAULT_GRID_CONFIG = {
  columns: 12,
  rows: 24,
  rowHeight: 48,
  showGridLines: true,
};

export const CELL_TYPES = [
  { type: "code" as const, label: "Code" },
  { type: "markdown" as const, label: "Markdown" },
];

export const WELCOME_NOTEBOOK: CellState[] = [
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
    isOutputCollapsed: false,
  },
  {
    id: "cell-1",
    type: "code",
    code: `// 1. Let's create our initial dataset using $df.data()
console.log("Initializing dataset 'sales'...");
sales = $df.data({
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
    isOutputCollapsed: false,
  },
  {
    id: "cell-2",
    type: "code",
    code: `// 2. We can perform column expression math to calculate order value
salesWithTotal = sales.withColumns(
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
    isOutputCollapsed: false,
  },
  {
    id: "cell-3",
    type: "code",
    code: `// 3. Next, aggregate total sales and average price by category
summary = salesWithTotal
  .groupBy("category")
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
    isOutputCollapsed: false,
  },
];
