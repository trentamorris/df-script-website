import React from 'react';
import { DataGrid, GridColDef, GridRowModel, useGridApiRef } from '@mui/x-data-grid';
import { $df } from 'df-script';
import type { DFDataGridProps, DFDataGridPinnedColumns } from './types';
import styles from './DFDataGrid.module.css';
import {
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_HEADER_HEIGHT,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_ROW_INDEX_COLUMN_WIDTH,
  ROW_INDEX_FIELD,
} from './constants';
import { useDFDataGridScroll } from './hooks/useDFDataGridScroll';

export const DFDataGrid: React.FC<DFDataGridProps> = React.memo(({
  data = [],
  className = '',
  rowHeight = DEFAULT_ROW_HEIGHT,
  columnHeaderHeight = DEFAULT_HEADER_HEIGHT,
  withRowIndex = true,
  hideFooter = true,
  scrollThreshold = 0,
  onScroll,
  pinnedColumns: pinnedColumnsProp,
  onPinnedColumnsChange,
  sx,
  slots,
  ...props
}) => {
  const apiRef = useGridApiRef();
  const [internalPinned, setInternalPinned] = React.useState<DFDataGridPinnedColumns>(() => pinnedColumnsProp ?? {});

  React.useEffect(() => {
    if (pinnedColumnsProp !== undefined) {
      setInternalPinned(pinnedColumnsProp);
    }
  }, [pinnedColumnsProp]);

  const df = React.useMemo(() => {
    if (!data.length) return null;
    const base = $df.data(data);
    return withRowIndex ? base.withRowIndex(ROW_INDEX_FIELD) : base;
  }, [data, withRowIndex]);

  const columns: GridColDef[] = React.useMemo(() => {
    if (!df) return [];
    return df.columns.map((name) =>
      name === ROW_INDEX_FIELD
        ? {
          field: name,
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
        }
        : {
          field: name,
          headerName: name,
          width: DEFAULT_COLUMN_WIDTH,
          sortable: true,
          filterable: true,
        }
    );
  }, [df]);

  const rows: GridRowModel[] = React.useMemo(() => (df ? df.toDicts() : []), [df]);

  const rootRef = useDFDataGridScroll({
    rowsCount: rows.length,
    scrollThreshold,
    onScroll,
  });

  // Keep DataGrid's internal pinnedColumns state in sync
  React.useEffect(() => {
    if (!apiRef.current || !apiRef.current.setState) return;

    const left = [
      ...(withRowIndex ? [ROW_INDEX_FIELD] : []),
      ...(internalPinned.left ?? []).filter((f) => f !== ROW_INDEX_FIELD),
    ];
    const right = [...(internalPinned.right ?? [])];

    apiRef.current.setState((prev: any) => ({
      ...prev,
      pinnedColumns: { left, right },
    }));
    (apiRef.current as any).forceUpdate?.();
    onPinnedColumnsChange?.({ left: internalPinned.left ?? [], right });
  }, [apiRef, withRowIndex, internalPinned, onPinnedColumnsChange]);

  const handlePinChange = React.useCallback((newPinned: DFDataGridPinnedColumns) => {
    setInternalPinned(newPinned);
  }, []);

  // Recalculate dimensions and scrollbars when container is resized (e.g., condensed then reopened)
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new ResizeObserver(() => {
      if (apiRef.current && (apiRef.current as any).resize) {
        (apiRef.current as any).resize();
      }
    });

    observer.observe(root);
    return () => observer.disconnect();
  }, [apiRef, rootRef]);

  const gridSlots = React.useMemo(() => ({
    ...slots,
  }), [slots]);

  const gridSlotProps = React.useMemo(() => ({
    ...props.slotProps,
  }), [props.slotProps]);

  return (
    <div
      ref={rootRef}
      className={`df-data-grid ${styles.dfDataGrid} w-full h-full min-h-0 min-w-0 flex-1 flex flex-col ${className}`}
    >
      <DataGrid
        apiRef={apiRef}
        rows={rows}
        columns={columns}
        getRowId={(row) => row[ROW_INDEX_FIELD] ?? row.id}
        rowHeight={rowHeight}
        columnHeaderHeight={columnHeaderHeight}
        density="compact"
        disableRowSelectionOnClick
        hideFooter={hideFooter}
        slots={gridSlots}
        slotProps={gridSlotProps}
        {...props}
      />
    </div>
  );
});

DFDataGrid.displayName = 'DFDataGrid';
