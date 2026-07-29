export interface CellState {
  id: string;
  type: "code" | "markdown" | "jsx";
  code: string;
  output: any;
  error: string | null;
  timeTaken: string | null;
  execIndex: number | null;
  logs?: string[];
  metadata?: Record<string, any>;
  isCodeCollapsed?: boolean;
  isOutputCollapsed?: boolean;
}
