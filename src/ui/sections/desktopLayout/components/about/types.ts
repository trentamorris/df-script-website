export interface BenchmarkResult {
  ms: number;
  isLive: boolean;
}

export interface BenchmarkCardProps {
  title: string;
  btnText: string;
  onRun: () => void;
  isRunning: boolean;
  jsLabel: string;
  jsCode: string;
  jsResult: BenchmarkResult;
  dfLabel: string;
  dfCode: string;
  dfResult: BenchmarkResult;
  operationName: string;
  marginTop?: string;
}

export interface CodePanelProps {
  label: string;
  code: string;
  result: BenchmarkResult;
  isDf?: boolean;
}
