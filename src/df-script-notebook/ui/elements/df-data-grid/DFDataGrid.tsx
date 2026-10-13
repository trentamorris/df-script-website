import React from 'react';
import { DataGrid, GridColDef, GridRowModel } from '@mui/x-data-grid';
import type { DFDataGridProps } from './types';
import styles from './DFDataGrid.module.css';
import {
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_HEADER_HEIGHT,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_ROW_INDEX_COLUMN_WIDTH,
} from './constants';

export const DFDataGrid: React.FC<DFDataGridProps> = React.memo(({
  data = [],
  columns: userColumns,
  className = '',
  rowHeight = DEFAULT_ROW_HEIGHT,
  columnHeaderHeight = DEFAULT_HEADER_HEIGHT,
  withRowIndex = true,
  hideFooter = true,
  sx,
  ...props
}) => {
  // 1. Resolve columns (auto-generate from record keys if not passed)
  const columns: GridColDef[] = React.useMemo(() => {
    let baseColumns: GridColDef[] = [];
    if (userColumns && userColumns.length > 0) {
      baseColumns = userColumns;
    } else if (data.length > 0) {
      baseColumns = Object.keys(data[0]).map((key) => ({
        field: key,
        headerName: key,
        width: DEFAULT_COLUMN_WIDTH,
        sortable: true,
        filterable: true,
      }));
    }

    if (!withRowIndex) {
      return baseColumns;
    }

    const indexColumn: GridColDef = {
      field: '__index__',
      headerName: '',
      width: DEFAULT_ROW_INDEX_COLUMN_WIDTH,
      minWidth: DEFAULT_ROW_INDEX_COLUMN_WIDTH,
      maxWidth: DEFAULT_ROW_INDEX_COLUMN_WIDTH,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      disableReorder: true,
      resizable: false,
      align: 'center',
      headerAlign: 'center',
      cellClassName: styles.rowIndexCell,
    };

    return [indexColumn, ...baseColumns];
  }, [userColumns, data, withRowIndex]);

  // 2. Ensure every row has an 'id' and optionally '__index__' for MUI DataGrid
  const rows: GridRowModel[] = React.useMemo(() => {
    return data.map((row, index) => {
      const rowId = row.id != null ? row.id : index;
      if (withRowIndex) {
        return { ...row, id: rowId, __index__: index };
      }
      return row.id != null ? row : { id: rowId, ...row };
    });
  }, [data, withRowIndex]);

  return (
    <div className={`df-data-grid ${styles.dfDataGrid} w-full max-h-[420px] ${className}`}>
      <DataGrid
        rows={rows}
        columns={columns}
        rowHeight={rowHeight}
        columnHeaderHeight={columnHeaderHeight}
        density="compact"
        disableRowSelectionOnClick
        hideFooter={hideFooter}
        sx={{
          border: 'none',
          backgroundColor: 'transparent',
          ...sx,
        }}
        {...props}
      />
    </div>
  );
});

DFDataGrid.displayName = 'DFDataGrid';
