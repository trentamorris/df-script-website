import React from 'react';
import { DataGrid, GridColDef, DataGridProps } from '@mui/x-data-grid';
import type { ScrollOffset } from '../../../utils/layoutUtils';

export type DFDataGridColumnDef = GridColDef;

export interface DFDataGridPinnedColumns {
  left?: string[];
  right?: string[];
}

export interface DFDataGridProps extends Omit<Partial<DataGridProps>, 'rows' | 'columns'> {
  data?: Record<string, any>[];
  columns?: GridColDef[];
  rowHeight?: number;
  headerHeight?: number;
  className?: string;
  withRowIndex?: boolean;
  scrollThreshold?: number;
  onScroll?: (offset: ScrollOffset) => void;
  pinnedColumns?: DFDataGridPinnedColumns;
  onPinnedColumnsChange?: (pinned: DFDataGridPinnedColumns) => void;
}


