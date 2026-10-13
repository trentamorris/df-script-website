import React from 'react';
import { DataGrid, GridColDef, DataGridProps } from '@mui/x-data-grid';

export type DFDataGridColumnDef = GridColDef;

export interface DFDataGridProps extends Omit<Partial<DataGridProps>, 'rows' | 'columns'> {
  data?: Record<string, any>[];
  columns?: GridColDef[];
  rowHeight?: number;
  headerHeight?: number;
  className?: string;
  withRowIndex?: boolean;
}
