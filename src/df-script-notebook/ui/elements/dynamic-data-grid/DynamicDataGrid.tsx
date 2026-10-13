/* 
import React from 'react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
import styles from './DynamicDataGrid.module.css';

import {
  DataGrid,
  GridColDef,
  //GridPivotModel,
  GridRowModel,
  useGridApiRef,
  GridInitialState,
  //GridRowGroupingModel,
  GridSortModel,
  GridFilterModel,
  //GridAggregationModel,
  GridColumnVisibilityModel,
  GridPinnedColumnFields,
  GridColumnsInitialState,
  GridRowId,
  GridGroupNode,
  GridRowClassNameParams,
  //GRID_ROW_GROUPING_SINGLE_GROUPING_FIELD,
} from '@mui/x-data-grid';

import {
  buildGridPivotModel,
  buildGridColDef,
  buildGridInitialState,
  buildGridRowGroupingModel,
  buildGridInternalColumns,
  isValidPivot,
  syncGridRowWidth,
  buildRowIndexColDef,
  buildGridRowModel,
  generatePivotedData,
  rollupGroupedData,
  resolveGrandTotalFields,
  getGroupedRowNodes,
  applyRowGroupExpansion,
  getRowGroupingField,
  buildFilterItemId,
} from './dynamicDataGridUtils';

import { useDynamicDataGridScrollControls } from './dynamicDataGridHooks';
import {
  DATA_GRID_SELECTORS,
  GRID_ROW_GROUPING_MULTIPLE_GROUPING_FIELD_PREFIX,
  ROW_GRAND_TOTAL_FIELD_NAME,
} from './dynamicDataGridConstants';

import {
  DynamicDataGridProps,
  DynamicDataGridContextValue,
  GridRowGroupingColumnMode,
  GridInternalColumns,
  DynamicDataGridSidePanelProps,
} from './dynamicDataGridTypes';

import { DraggableDivider } from '../draggable-divider/DraggableDivider';
import { DraggableDividerEventPayload } from '../draggable-divider/types';
import { useIsMobile } from 'root/app/hooks/useIsMobile';
import { Button, IconButton } from '@mui/material';
import { Close, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

export const DYNAMIC_DATA_GRID_SIDE_PANEL_DEFAULT_WIDTH = 200;
export const DYNAMIC_DATA_GRID_SIDE_PANEL_MAX_WIDTH = 400;
export const DYNAMIC_DATA_GRID_SIDE_PANEL_MIN_WIDTH = 200;

export const DynamicDataGridSidePanel: React.FC<DynamicDataGridSidePanelProps> = ({ children, headerContent }) => {
  const { isSidePanelOpen, setIsSidePanelOpen } = useDynamicDataGridContext();

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState<number>(DYNAMIC_DATA_GRID_SIDE_PANEL_DEFAULT_WIDTH);

  const handleOnSidePanelClose = React.useCallback(() => {
    setIsSidePanelOpen(false);
  }, []);

  const handleOnPointerMove = React.useCallback((payload: DraggableDividerEventPayload) => {
    setWidth(payload?.px);
  }, []);

  return (
    <div
      ref={containerRef}
      data-side-panel-open={!isSidePanelOpen}
      data-min-height={DYNAMIC_DATA_GRID_SIDE_PANEL_MIN_WIDTH}
      data-max-height={DYNAMIC_DATA_GRID_SIDE_PANEL_MAX_WIDTH}
      className={clsx(styles.dynamicDataGridSidePanel, 'dynamic-data-grid-side-panel', 'relative flex flex-col')}
      style={{
        '--dynamic-data-grid-side-panel-width': `${width}px`,
        '--dynamic-data-grid-side-panel-min-width': `${DYNAMIC_DATA_GRID_SIDE_PANEL_MIN_WIDTH}px`,
        '--dynamic-data-grid-side-panel-max-width': `${DYNAMIC_DATA_GRID_SIDE_PANEL_MAX_WIDTH}px`,
      } as React.CSSProperties}
    >
      <DraggableDivider
        containerRef={containerRef}
        className="border-0"
        orientation="horizontal"
        anchor="left"
        dragDirection="left"
        clampMin={[DYNAMIC_DATA_GRID_SIDE_PANEL_MIN_WIDTH]}
        clampMax={[DYNAMIC_DATA_GRID_SIDE_PANEL_MAX_WIDTH]}
        clampUnit="px"
        onPointerMove={handleOnPointerMove}
        onPointerUp={handleOnPointerUp}
      />
      <div className="flex items-center justify-between w-full min-h-[53px] border-b border-[var(--mui-palette-divider)]">
        {headerContent}
        <Button
          className="flex items-center justify-center !rounded-[10px] !min-h-[unset] !min-w-[unset] !p-[8px] !m-[6px] !text-[var(--mui-palette-text-primary)]"
          onClick={handleOnSidePanelClose}
        >
          <Close fontSize="small" />
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrlb-c-d">{children}</div>
    </div>
  );
};

export const DynamicDataGridContext = React.createContext<DynamicDataGridContextValue | null>(null);

export const useDynamicDataGridContext = (): DynamicDataGridContextValue => {
  const context = React.useContext(DynamicDataGridContext);
  if (!context) {
    throw new Error('useDynamicPivotContext must be used within a DynamicPivotProvider');
  }
  return context;
};

export const DynamicDataGridProvider = DynamicDataGridContext.Provider;

// DynamicDataGrid

export const DynamicDataGrid: React.FC<DynamicDataGridProps> = ({
  records,
  children,
  appliedColConfig,
  sqlQuery,
  appliedBackendParams,
  defaultDynamicDataGridOptions = {},
  ...rest
}) => {
  const {
    defaultIncludeIndexColumn = true,
    defaultIncludeGrandTotalColumn = true,
    defaultRowGroupingColumnMode = 'single',
    defaultShowScrollControls = true,
  } = defaultDynamicDataGridOptions;

  // Hooks

  const isMobile = useIsMobile();
  const apiRef = useGridApiRef();
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const gridShellRef = React.useRef<HTMLDivElement | null>(null);

  // Grid Initial State

  const initialInternalColumns = React.useMemo<GridInternalColumns>(() => {
    const defaultRowGroupingModel = buildGridRowGroupingModel({ colConfig: appliedColConfig });
    const defaultPivotModel = buildGridPivotModel({ colConfig: appliedColConfig });
    const isDefaultPivotActive = isValidPivot(defaultPivotModel);

    return buildGridInternalColumns({
      includeIndexColumn: defaultIncludeIndexColumn,
      includeCheckboxColumn: !rest.checkboxSelection,
      gridRowGroupingModel: isDefaultPivotActive ? [] : defaultRowGroupingModel,
      gridRowGroupingColumnMode: defaultRowGroupingColumnMode,
      isPivotActive: isDefaultPivotActive,
    });
  }, [appliedColConfig, defaultIncludeIndexColumn, rest.checkboxSelection, defaultRowGroupingColumnMode]);

  const gridInitialState = React.useMemo<GridInitialState>(() => {
    return buildGridInitialState({
      colConfig: appliedColConfig,
      gridPinnedColumnFieldsParams: {
        defaultPinnedLeft: initialInternalColumns.left,
        defaultPinnedRight: initialInternalColumns.right,
      },
      gridFilterModelParams: {
        gridRowGroupingColumnMode: defaultRowGroupingColumnMode,
      },
      internalColumns: initialInternalColumns.all,
      isMobile,
    });
  }, [appliedColConfig, initialInternalColumns, isMobile]);

  // Controlled States

  const [isSidePanelOpen, setIsSidePanelOpen] = React.useState<boolean>(false);
  const [sidePanelContent, setSidePanelContent] = React.useState<React.ReactNode>(null);
  const [sidePanelHeaderContent, setSidePanelHeaderContent] = React.useState<React.ReactNode>(null);
  const [isFallbackFullscreen, setIsFallbackFullscreen] = React.useState<boolean>(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = React.useState<boolean>(false);

  const [includeGrandTotalColumn, setIncludeGrandTotalColumn] =
    React.useState<boolean>(defaultIncludeGrandTotalColumn);
  const [includeIndexColumn, setIncludeIndexColumn] = React.useState<boolean>(defaultIncludeIndexColumn);

  const [gridRowGroupingColumnMode, setGridRowGroupingColumnMode] = React.useState<GridRowGroupingColumnMode>(
    defaultRowGroupingColumnMode,
  );

  //const [gridPinnedColumnFields, setGridPinnedColumnFields] = React.useState<GridPinnedColumnFields>(
  //  gridInitialState?.pinnedColumns ?? { left: [], right: [] },
  //);

  const [gridColumnVisibilityModel, setGridColumnVisibilityModel] = React.useState<GridColumnVisibilityModel>(
    gridInitialState?.columns?.columnVisibilityModel ?? {},
  );

  const [gridColumnsOrderedFields, setGridColumnsOrderedFields] = React.useState<
    GridColumnsInitialState['orderedFields']
  >(() => gridInitialState?.columns?.orderedFields ?? []);

  //const [gridPivotModel, setGridPivotModel] = React.useState<GridPivotModel>(
  //  gridInitialState?.pivoting?.model ?? { rows: [], columns: [], values: [] },
  //);

  const [gridSortModel, setGridSortModel] = React.useState<GridSortModel>(gridInitialState?.sorting?.sortModel ?? []);
  //const [gridRowGroupingModel, setGridRowGroupingModel] = React.useState<GridRowGroupingModel>(
  //  gridInitialState?.rowGrouping?.model ?? [],
  //);

  const [gridFilterModel, setGridFilterModel] = React.useState<GridFilterModel>(
    gridInitialState?.filter?.filterModel ?? { items: [] },
  );

  //const [gridAggregationModel, setGridAggregationModel] = React.useState<GridAggregationModel>(
  //  gridInitialState?.aggregation?.model ?? {},
  //);

  const [gridRowExpansionModel, setGridRowExpansionModel] = React.useState<Set<GridRowId>>(
    () => gridInitialState?.detailPanel?.expandedRowIds ?? new Set<GridRowId>(),
  );

  // Derived Runtime State

  const isPivotActive = React.useMemo<boolean>(() => isValidPivot(gridPivotModel), [gridPivotModel]);

  const resolvedGridFilterModel = React.useMemo(
    () => ({
      ...gridFilterModel,
      items: gridFilterModel.items.map((filterItem) => {
        const { field, id } = filterItem;

        const isGroupingField =
          field === GRID_ROW_GROUPING_SINGLE_GROUPING_FIELD ||
          field.startsWith(GRID_ROW_GROUPING_MULTIPLE_GROUPING_FIELD_PREFIX);

        if (!isGroupingField) return filterItem;

        const matches = String(id ?? '').match(/(^.*)-filter-(\d+)/);

        const sourceField = matches?.[1];
        const order = Number(matches?.[2] ?? 0);

        if (!sourceField) return filterItem;

        const isStillGrouped = gridRowGroupingModel.includes(sourceField);

        return {
          ...filterItem,
          id: `${buildFilterItemId({ field: sourceField, order })}-${gridRowGroupingColumnMode}`,
          field: isStillGrouped ? getRowGroupingField(sourceField, gridRowGroupingColumnMode) : sourceField,
        };
      }),
    }),
    [
      gridFilterModel,
      gridRowGroupingColumnMode,
      gridRowGroupingModel,
    ],
  );

  const gridData = React.useMemo(() => {
    if (isPivotActive) {
      return generatePivotedData({
        records: records ?? [],
        gridPivotModel,
        includeGrandTotalColumn,
        isPivotActive,
      });
    }

    if (gridRowGroupingModel && gridRowGroupingModel.length > 0) {
      return rollupGroupedData({
        records: records ?? [],
        colConfig: appliedColConfig,
        gridRowGroupingModel,
        gridColumnVisibilityModel,
        gridAggregationModel,
        gridFilterModel,
      });
    }

    return records ?? [];
  }, [
    records,
    gridPivotModel,
    isPivotActive,
    includeGrandTotalColumn,
    gridRowGroupingModel,
    gridColumnVisibilityModel,
    gridAggregationModel,
    gridFilterModel,
    appliedColConfig,
  ]);

  const rows = React.useMemo<GridRowModel[]>(() => {
    return buildGridRowModel({ data: gridData ?? [] });
  }, [gridData]);

  const columns = React.useMemo<GridColDef[]>(() => {
    const dataColumns = buildGridColDef({
      colConfig: appliedColConfig,
      gridColumnsOrderedFields: gridColumnsOrderedFields,
    });

    return [...(includeIndexColumn ? [buildRowIndexColDef()] : []), ...dataColumns];
  }, [appliedColConfig, gridColumnsOrderedFields, includeIndexColumn]);

  // Custom Layout Hooks

  const gridLayoutShiftTrigger = React.useMemo(() => {
    return {
      records,
      rows,
      columns,
      initialInternalColumns,
      gridInitialState,
      isPivotActive,
      includeIndexColumn,
      includeGrandTotalColumn,
      gridRowGroupingColumnMode,
      gridPinnedColumnFields,
      gridColumnVisibilityModel,
      gridColumnsOrderedFields,
      gridPivotModel,
      gridSortModel,
      gridRowGroupingModel,
      gridFilterModel,
      resolvedGridFilterModel,
      gridAggregationModel,
      gridRowExpansionModel,
    };
  }, [
    records,
    rows,
    columns,
    initialInternalColumns,
    gridInitialState,
    isPivotActive,
    includeIndexColumn,
    includeGrandTotalColumn,
    gridRowGroupingColumnMode,
    gridPinnedColumnFields,
    gridColumnVisibilityModel,
    gridColumnsOrderedFields,
    gridPivotModel,
    gridSortModel,
    gridRowGroupingModel,
    gridFilterModel,
    resolvedGridFilterModel,
    gridAggregationModel,
    gridRowExpansionModel,
  ]);

  const {
    canScrollUp,
    canScrollDown,
    virtualScrollerInsetTop,
    virtualScrollerInsetBottom,
    topContainerHeight,
    bottomContainerHeight,
    hasScrollX,
    scrollbarsize,
  } = useDynamicDataGridScrollControls({ gridRef, gridLayoutShiftTrigger });

  // Callbacks

  const handleOnAggregationModelChange = React.useCallback((model: GridAggregationModel) => {
    setGridAggregationModel(model);
  }, []);

  const handleGetFullscreenPortalContainer = React.useCallback((): HTMLElement | null => {
    return isNativeFullscreen ? (apiRef.current?.rootElementRef?.current ?? null) : null;
  }, [apiRef, isNativeFullscreen]);

  const handleOnColumnOrderChange = React.useCallback(() => {
    if (!apiRef.current) return;

    window.requestAnimationFrame(() => {
      const newOrder = apiRef.current?.getAllColumns()?.map((c) => c.field) ?? [];
      setGridColumnsOrderedFields(newOrder);
    });
  }, [apiRef]);

  const handleOnColumnVisibilityModelChange = React.useCallback((model: GridColumnVisibilityModel) => {
    setGridColumnVisibilityModel(model);
  }, []);

  const handleOnFilterModelChange = React.useCallback((model: GridFilterModel) => {
    setGridFilterModel(model);
  }, []);

  const handleOnPinnedColumnsChange = React.useCallback((model: GridPinnedColumnFields) => {
    setGridPinnedColumnFields(model);
  }, []);

  const handleOnPivotModelChange = React.useCallback((model: GridPivotModel) => {
    setGridPivotModel(model);
  }, []);

  const handleOnRowGroupingModelChange = React.useCallback((model: GridRowGroupingModel) => {
    setGridRowGroupingModel(model);
  }, []);

  const handleOnSortModelChange = React.useCallback((model: GridSortModel) => {
    setGridSortModel(model);
  }, []);

  const handleOnColumnWidthChange = React.useCallback(() => {
    syncGridRowWidth(gridRef);
  }, [gridRef]);

  const handleScrollToTop = React.useCallback(() => {
    const scroller = gridRef?.current?.querySelector<HTMLElement>(DATA_GRID_SELECTORS.virtualScroller);
    scroller?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [gridRef]);

  const handleScrollToBottom = React.useCallback(() => {
    const scroller = gridRef?.current?.querySelector<HTMLElement>(DATA_GRID_SELECTORS.virtualScroller);
    if (scroller) {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
    }
  }, [gridRef]);

  // Getters

  const getRowClassNameCallback = React.useCallback(
    (params: GridRowClassNameParams): string => {
      if (!apiRef.current) return '';

      const rowNode = apiRef?.current?.getRowNode(params?.id);
      switch (rowNode?.type) {
        case 'leaf':
          return 'leaf-row';
        case 'group':
          return 'group-row';
        case 'footer':
          return 'footer-row';
        case 'pinnedRow':
          return 'pinned-row';
        case 'skeletonRow':
          return 'skeleton-row';
        default:
          return '';
      }
    },
    [apiRef],
  );

  // Effects

  React.useEffect(() => {
    apiRef.current?.setFilterModel(resolvedGridFilterModel);
  }, [resolvedGridFilterModel]);

  React.useEffect(() => {
    const api = apiRef.current;
    if (!api) return;

    const unsubscribe = api.subscribeEvent('rowExpansionChange', (node: GridGroupNode) => {
      setGridRowExpansionModel((prev) => {
        const next = new Set(prev);
        if (node.childrenExpanded === true) {
          next.add(node.id);
        } else {
          next.delete(node.id);
        }
        return next;
      });
    });

    return () => unsubscribe();
  }, [apiRef]);

  const prevPivotRowsRef = React.useRef(gridPivotModel?.rows);
  React.useEffect(() => {
    if (!apiRef.current) return;

    const pivotRowsChanged = prevPivotRowsRef.current !== gridPivotModel?.rows;
    prevPivotRowsRef.current = gridPivotModel?.rows;

    window.requestAnimationFrame(() => {
      if (pivotRowsChanged) {
        applyRowGroupExpansion({ apiRef, expand: false, target: { scope: 'lowest' } });
      }

      const groupedNodes = getGroupedRowNodes({ apiRef });
      const expanded = new Set<GridRowId>();
      for (const node of groupedNodes) {
        if (node.childrenExpanded) expanded.add(node.id);
      }
      setGridRowExpansionModel(expanded);
    });
  }, [apiRef, gridPivotModel?.rows, gridFilterModel, gridRowGroupingModel]);

  React.useEffect(() => {
    const api = apiRef.current;
    if (!api || !isPivotActive || !includeGrandTotalColumn) return;

    window.requestAnimationFrame(() => {
      const grandTotalFields = resolveGrandTotalFields({ apiRef });
      if (grandTotalFields.length === 0) return;

      setGridPinnedColumnFields((prev) => {
        const currentRight = prev?.right ?? [];
        const currentRightWithoutGrandTotals = currentRight.filter(
          (field) => !field.includes(ROW_GRAND_TOTAL_FIELD_NAME),
        );
        const newRight = [...currentRightWithoutGrandTotals, ...grandTotalFields];

        if (currentRight.length === newRight.length && currentRight.every((f, i) => f === newRight[i])) {
          return prev;
        }

        return {
          ...prev,
          right: newRight,
        };
      });

      setGridColumnsOrderedFields((prev) => {
        const withoutGrandTotals = (prev ?? []).filter((field) => !field.includes(ROW_GRAND_TOTAL_FIELD_NAME));
        const newOrder = [...withoutGrandTotals, ...grandTotalFields];

        if (prev?.length === newOrder.length && prev.every((f, i) => f === newOrder[i])) {
          return prev;
        }

        return newOrder;
      });
    });
  }, [apiRef, isPivotActive, includeGrandTotalColumn, gridData]);

  React.useEffect(() => {
    if (!isFallbackFullscreen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFallbackFullscreen(false);
    };

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    // Nudges Safari into collapsing its chrome once 'scrolled'.
    const rafIds: number[] = [];
    window.requestAnimationFrame(() => {
      rafIds.push(window.requestAnimationFrame(() => window.scrollTo(0, 1)));
    });

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      rafIds.forEach((id) => window.cancelAnimationFrame(id));
    };
  }, [isFallbackFullscreen]);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsNativeFullscreen(document.fullscreenElement === apiRef.current?.rootElementRef?.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [apiRef]);

  // Context Value

  const contextValue = React.useMemo<DynamicDataGridContextValue>(
    () => ({
      apiRef,
      isPivotActive,
      sqlQuery,
      records: records ?? [],
      rows: rows ?? [],
      appliedColConfig,
      appliedBackendParams,
      isSidePanelOpen,
      isFallbackFullscreen,
      isNativeFullscreen,
      handleGetFullscreenPortalContainer,
      includeGrandTotalColumn,
      includeIndexColumn,
      sidePanelContent,
      sidePanelHeaderContent,
      gridColumnsOrderedFields,
      gridPinnedColumnFields,
      gridColumnVisibilityModel,
      gridPivotModel,
      gridSortModel,
      gridFilterModel,
      gridAggregationModel,
      gridRowGroupingModel,
      gridRowExpansionModel,
      gridRowGroupingColumnMode,
      setIncludeGrandTotalColumn,
      setIncludeIndexColumn,
      setIsSidePanelOpen,
      setIsFallbackFullscreen,
      setIsNativeFullscreen,
      setSidePanelContent,
      setSidePanelHeaderContent,
      setGridColumnsOrderedFields,
      setGridPinnedColumnFields,
      setGridColumnVisibilityModel,
      setGridPivotModel,
      setGridSortModel,
      setGridFilterModel,
      setGridAggregationModel,
      setGridRowGroupingModel,
      setGridRowExpansionModel,
      setGridRowGroupingColumnMode,
    }),
    [
      apiRef,
      isPivotActive,
      sqlQuery,
      records,
      rows,
      appliedColConfig,
      appliedBackendParams,
      isSidePanelOpen,
      isFallbackFullscreen,
      isNativeFullscreen,
      handleGetFullscreenPortalContainer,
      includeGrandTotalColumn,
      includeIndexColumn,
      sidePanelContent,
      sidePanelHeaderContent,
      gridColumnsOrderedFields,
      gridPinnedColumnFields,
      gridColumnVisibilityModel,
      gridPivotModel,
      gridSortModel,
      gridFilterModel,
      gridAggregationModel,
      gridRowGroupingModel,
      gridRowExpansionModel,
      gridRowGroupingColumnMode,
    ],
  );

  const gridContent = (
    <div
      className={clsx(
        'flex w-full h-full overflow-hidden',
        isFallbackFullscreen && styles.dynamicDataGridFallbackFullscreen,
      )}
    >
      <div
        ref={gridShellRef}
        className="relative flex-1 min-w-0"
      >
        <DataGridPremium
          // NOTE:
          // Switching 'rowGroupingColumnMode' between "single" and "multiple" while
          // grouping filters are active can leave DataGridPremium filtering in an
          // invalid state. Forcing a remount via the 'key' below resolves the issue,
          // but potentially introduces regressions elsewhere.
          //
          // Since changing grouping modes with active filters is a relatively uncommon
          // workflow and users can recover by reapplying their filters, the remount
          // workaround is intentionally disabled for now.
          //
          // key={`data-grid-premium-${gridRowGroupingColumnMode}`}
          apiRef={apiRef}
          autosizeOnMount={!isMobile}
          autosizeOptions={{
            includeHeaders: true,
            includeOutliers: true,
            outliersFactor: 2,
            expand: false,
            disableColumnVirtualization: !isMobile,
          }}
          className={clsx(styles.dynamicDataGrid, 'dynamic-data-grid !border-[0px]')}
          columnBufferPx={isMobile ? 50 : 250}
          rowBufferPx={isMobile ? 100 : 400}
          columnHeaderHeight={isMobile ? 38 : 35}
          columns={columns}
          groupingColDef={{
            hideDescendantCount: true,
          }}
          hideFooter={true}
          ref={gridRef}
          rowHeight={isMobile ? 28 : 35}
          rows={rows}
          showToolbar
          // ... Getters ...
          getRowClassName={getRowClassNameCallback}
          // ... Controlled State ...
          pivotActive={isPivotActive}
          initialState={gridInitialState}
          sortModel={gridSortModel}
          filterModel={resolvedGridFilterModel}
          pinnedColumns={gridPinnedColumnFields}
          pivotModel={isPivotActive ? gridPivotModel : undefined}
          rowGroupingColumnMode={gridRowGroupingColumnMode ?? undefined}
          aggregationModel={isPivotActive ? gridAggregationModel : undefined}
          rowGroupingModel={isPivotActive ? undefined : gridRowGroupingModel}
          columnVisibilityModel={isPivotActive ? undefined : gridColumnVisibilityModel}
          // ... Event Handlers ...
          onColumnWidthChange={handleOnColumnWidthChange}
          onSortModelChange={handleOnSortModelChange}
          onPivotModelChange={handleOnPivotModelChange}
          onFilterModelChange={handleOnFilterModelChange}
          onColumnOrderChange={handleOnColumnOrderChange}
          onPinnedColumnsChange={handleOnPinnedColumnsChange}
          onRowGroupingModelChange={handleOnRowGroupingModelChange}
          onAggregationModelChange={handleOnAggregationModelChange}
          onColumnVisibilityModelChange={handleOnColumnVisibilityModelChange}
          slotProps={{
            ...rest.slotProps,
            basePopper: isMobile
              ? {
                ...rest.slotProps?.basePopper,
                container: handleGetFullscreenPortalContainer,
                popperOptions: { strategy: 'fixed' },
              } as NonNullable<typeof rest.slotProps>['basePopper']
              : rest.slotProps?.basePopper,
          }}
          {...rest}
        />
        {defaultShowScrollControls && !isMobile && (canScrollUp || canScrollDown) ? (
          <>
            {canScrollUp ? (
              <div
                className="absolute inset-x-0 flex justify-center pointer-events-none z-[3]"
                style={{
                  top: virtualScrollerInsetTop + topContainerHeight + 8,
                }}
              >
                <IconButton
                  aria-label="Scroll grid to top"
                  className={clsx(styles.dynamicDataGridScrollControlButton, 'press-fdbk')}
                  disableRipple
                  disableFocusRipple
                  disableTouchRipple
                  onClick={handleScrollToTop}
                  size="small"
                >
                  <KeyboardArrowUp fontSize="small" />
                </IconButton>
              </div>
            ) : null}
            {canScrollDown ? (
              <div
                className="absolute inset-x-0 flex justify-center pointer-events-none z-[3]"
                style={{
                  bottom:
                    virtualScrollerInsetBottom +
                    bottomContainerHeight +
                    8 +
                    (hasScrollX === 1 ? scrollbarsize : 0),
                }}
              >
                <IconButton
                  aria-label="Scroll grid to bottom"
                  className={clsx(styles.dynamicDataGridScrollControlButton, 'press-fdbk')}
                  disableRipple
                  disableFocusRipple
                  disableTouchRipple
                  onClick={handleScrollToBottom}
                  size="small"
                >
                  <KeyboardArrowDown fontSize="small" />
                </IconButton>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
      <DynamicDataGridSidePanel headerContent={sidePanelHeaderContent}>{sidePanelContent}</DynamicDataGridSidePanel>
    </div>
  );

  return (
    records &&
    Array.isArray(records) &&
    records.length !== 0 && (
      <DynamicDataGridProvider value={contextValue}>
        {isFallbackFullscreen ? createPortal(gridContent, document.body) : gridContent}
        {children}
      </DynamicDataGridProvider>
    )
  );
};
*/
