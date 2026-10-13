/* 
import React from 'react';
import type { WriteCSVOptions } from 'df-script';
import { ElementScrollState } from '../../../utils/layoutUtils';
import { ColumnConfigMap, ColConfigProps, DeskLevelReportingBackendParams, StateWrapper } from '../../../deskLevelReportingTypes';
import { OnDayChangeResponse } from '../../../deskLevelReportingApiTypes';
import {
  GRID_AGGREGATION_FUNCTIONS,
  GridAggregationModel,
  GridColumnsInitialState,
  GridColumnVisibilityModel,
  GridFilterItem,
  GridFilterModel,
  GridLogicOperator,
  GridPinnedColumnFields,
  GridPivotModel,
  GridRowGroupingModel,
  GridSortModel,
  GridApi,
  GridRowId,
  GridRowModel,
  DataGridPremiumProps,
  GridExcelJsProcessInput,
} from '@mui/x-data-grid-premium';

export type DataGridPremiumApiRefType = React.MutableRefObject<GridApi | null>;
export type DataGridPremiumApiRef = { apiRef: DataGridPremiumApiRefType };

export type GridBuiltInAggregations = keyof typeof GRID_AGGREGATION_FUNCTIONS;
export type GridBuiltInFilterOperators = GridFilterItem['operator'];

export type GridRowGroupingColumnMode = NonNullable<DataGridPremiumProps['rowGroupingColumnMode']>;

export type GridPinnedColumnFields = NonNullable<GridPinnedColumnFields['left']>[number];
export type GridInternalColumns = {
  left: NonNullable<GridPinnedColumnFields['left']>;
  right: NonNullable<GridPinnedColumnFields['right']>;
  all: GridPinnedColumnField[];
};

export type ManagedGridProps =
  | 'aggregationModel'
  | 'apiRef'
  | 'autosizeOnMount'
  | 'autosizeOptions'
  | 'className'
  | 'columnBufferPx'
  | 'columnHeaderHeight'
  | 'columns'
  | 'columnVisibilityModel'
  | 'filterModel'
  | 'getRowClassName'
  | 'groupingColDef'
  | 'initialState'
  | 'onAggregationModelChange'
  | 'onColumnOrderChange'
  | 'onColumnVisibilityModelChange'
  | 'onColumnWidthChange'
  | 'onFilterModelChange'
  | 'onPinnedColumnsChange'
  | 'onPivotModelChange'
  | 'onRowGroupingModelChange'
  | 'onSortModelChange'
  | 'pinnedColumns'
  | 'pivotActive'
  | 'pivotModel'
  | 'ref'
  | 'rowGroupingColumnMode'
  | 'rowGroupingModel'
  | 'rowHeight'
  | 'rows'
  | 'sortModel';

export type DefaultDynamicDataGridOptions = {
  defaultIncludeIndexColumn?: boolean;
  defaultIncludeGrandTotalColumn?: boolean;
  defaultRowGroupingColumnMode?: GridRowGroupingColumnMode;
  defaultShowScrollControls?: boolean;
};

export type DynamicDataGridProps = Partial<Pick<OnDayChangeResponse, 'records'>> &
  Omit<DataGridPremiumProps, ManagedGridProps> & {
    children?: React.ReactNode;
    sqlQuery?: string;
    appliedColConfig: ColumnConfigMap;
    appliedBackendParams: DeskLevelReportingBackendParams;
    defaultDynamicDataGridOptions?: DefaultDynamicDataGridOptions;
  };

export type DynamicDataGridSidePanelProps = {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
};

export type DataGridCssMetrics = {
  hasScrollX: number;
  hasScrollY: number;
  scrollbarSize: number;
  columnsTotalWidth: number;
  leftPinnedWidth: number;
  rightPinnedWidth: number;
  headerHeight: number;
  headersTotalHeight: number;
  topContainerHeight: number;
  bottomContainerHeight: number;
};

export type ResolveDataGridCssMetricsParams = {
  gridElement: HTMLElement | null;
};

export type DynamicDataGridScrollControlsHookParam = {
  gridRef: React.RefObject<HTMLDivElement | null>;
  gridLayoutShiftTrigger?: unknown;
};

export type DynamicDataGridScrollControlsHookResult = ElementScrollState &
  DataGridCssMetrics & {
    virtualScrollerInsetLeft: number;
    virtualScrollerInsetRight: number;
    virtualScrollerInsetTop: number;
    virtualScrollerInsetBottom: number;
  };

export type UseDataGridCssMetricsParam = {
  gridRef: React.RefObject<HTMLElement | null>;
  trigger?: unknown;
};

// Dynamic Data Grid State

export type IncludeIndexColumnState = StateWrapper<boolean, 'includeIndexColumn', 'setIncludeIndexColumn'>;
export type IncludeGrandTotalColumnState = StateWrapper<
  boolean,
  'includeGrandTotalColumn',
  'setIncludeGrandTotalColumn'
>;

export type SidePanelContentState = StateWrapper<React.ReactNode, 'sidePanelContent', 'setSidePanelContent'>;
export type SidePanelHeaderContentState = StateWrapper<
  React.ReactNode,
  'sidePanelHeaderContent',
  'setSidePanelHeaderContent'
>;

export type IsSidePanelOpenState = StateWrapper<boolean, 'isSidePanelOpen', 'setIsSidePanelOpen'>;
export type IsFallbackFullscreenState = StateWrapper<boolean, 'isFallbackFullscreen', 'setIsFallbackFullscreen'>;
export type IsNativeFullscreenState = StateWrapper<boolean, 'isNativeFullscreen', 'setIsNativeFullscreen'>;
export type GridRowGroupingColumnModeState = StateWrapper<
  GridRowGroupingColumnMode,
  'gridRowGroupingColumnMode',
  'setGridRowGroupingColumnMode'
>;

export type GridColumnsOrderedFieldsState = StateWrapper<
  GridColumnsInitialState['orderedFields'],
  'gridColumnsOrderedFields',
  'setGridColumnsOrderedFields'
>;

export type GridPinnedColumnFieldsState = StateWrapper<
  GridPinnedColumnFields,
  'gridPinnedColumnFields',
  'setGridPinnedColumnFields'
>;

export type GridColumnVisibilityModelState = StateWrapper<
  GridColumnVisibilityModel,
  'gridColumnVisibilityModel',
  'setGridColumnVisibilityModel'
>;

export type GridPivotModelState = StateWrapper<GridPivotModel, 'gridPivotModel', 'setGridPivotModel'>;
export type GridSortModelState = StateWrapper<GridSortModel, 'gridSortModel', 'setGridSortModel'>;
export type GridFilterModelState = StateWrapper<GridFilterModel, 'gridFilterModel', 'setGridFilterModel'>;
export type GridAggregationModelState = StateWrapper<
  GridAggregationModel,
  'gridAggregationModel',
  'setGridAggregationModel'
>;

export type GridRowGroupingModelState = StateWrapper<
  GridRowGroupingModel,
  'gridRowGroupingModel',
  'setGridRowGroupingModel'
>;

export type GridRowExpansionModelState = StateWrapper<
  Set<GridRowId>,
  'gridRowExpansionModel',
  'setGridRowExpansionModel'
>;

export type DynamicDataGridContextValue = {
  isPivotActive: boolean;
  sqlQuery: string | undefined;
  records: Record<string, unknown>[] | undefined;
  rows: GridRowModel[];
  appliedColConfig: ColumnConfigMap;
  appliedBackendParams: DeskLevelReportingBackendParams;
  handleGetFullscreenPortalContainer: () => HTMLElement | null;
} & DataGridPremiumApiRef &
  IncludeIndexColumnState &
  IncludeGrandTotalColumnState &
  SidePanelContentState &
  SidePanelHeaderContentState &
  IsSidePanelOpenState &
  IsFallbackFullscreenState &
  IsNativeFullscreenState &
  GridRowGroupingColumnModeState &
  GridColumnsOrderedFieldsState &
  GridPinnedColumnFieldsState &
  GridColumnVisibilityModelState &
  GridPivotModelState &
  GridSortModelState &
  GridFilterModelState &
  GridAggregationModelState &
  GridRowGroupingModelState &
  GridRowExpansionModelState;

export type BuildGridInternalColumnsParams = {
  isPivotActive?: boolean;
  includeIndexColumn?: boolean;
  includeCheckboxColumn?: boolean;
  gridRowGroupingModel?: GridRowGroupingModel;
  gridRowGroupingColumnMode?: GridRowGroupingColumnMode;
};

export type BuildGridInitialState = Pick<ColConfigProps, 'colConfig'> & {
  gridPinnedColumnFieldsParams?: Pick<
    BuildGridPinnedColumnFieldsModelParams,
    'defaultPinnedLeft' | 'defaultPinnedRight'
  >;
  gridFilterModelParams?: Pick<BuildGridFilterModelParams, 'gridRowGroupingColumnMode'>;
  internalColumns?: GridInternalColumns['all'];
  isMobile?: boolean;
};

export type BuildGridRowModelParams = {
  data: any[] | null;
};

export type BuildGridPivotModelParams = Pick<ColConfigProps, 'colConfig'>;
export type BuildGridSortModelParams = Pick<ColConfigProps, 'colConfig'>;
export type BuildGridFilterModelParams = Pick<ColConfigProps, 'colConfig'> & {
  logicOperator?: GridLogicOperator;
  gridRowGroupingModel?: GridRowGroupingModel;
  gridRowGroupingColumnMode?: GridRowGroupingColumnMode;
  isPivot?: boolean;
};

export type BuildGridColumnVisibilityModelParams = Pick<ColConfigProps, 'colConfig'>;
export type BuildGridColumnOrderedFieldsParams = Pick<ColConfigProps, 'colConfig'> & {
  gridPinnedColumnFields: GridPinnedColumnFields;
  internalColumns?: string[];
};

export type BuildGridRowGroupingModelParams = Pick<ColConfigProps, 'colConfig'>;
export type BuildGridAggregationModelParams = Pick<ColConfigProps, 'colConfig'>;
export type BuildGridPinnedColumnFieldsModelParams = Pick<ColConfigProps, 'colConfig'> & {
  defaultPinnedLeft?: string[];
  defaultPinnedRight?: string[];
};

export type BuildGridColDefModelParams = Pick<ColConfigProps, 'colConfig'> & {
  gridColumnsOrderedFields: GridColumnsInitialState['orderedFields'];
};

export type GeneratePivotedDataParams = {
  records: Record<string, unknown>[];
  gridPivotModel?: GridPivotModel;
  includeGrandTotalColumn?: boolean;
  isPivotActive?: boolean;
};

export type ComposeOrderedColumnFieldsParams = {
  gridPinnedColumnFields: GridPinnedColumnFields;
  baseColumns: string[];
  internalColumns?: string[];
};

export type RowGroupExpansionTarget =
  | { scope: 'all' }
  | { scope: 'offsetFromMax'; offset: number }
  | { scope: 'lowest' }
  | { scope: 'depth'; depth: number }
  | { scope: 'node'; nodeId: GridRowId };

export type ResolveRowGroupExpansionTargetParams = DataGridPremiumApiRef & {
  target?: RowGroupExpansionTarget;
};

export type IsRowGroupExpansionAppliedParams = ResolveRowGroupExpansionTargetParams & {
  gridRowExpansionModel: Set<GridRowId>;
};

export type ApplyRowGroupExpansionParams = ResolveRowGroupExpansionTargetParams & {
  expand: boolean;
};

export type PreProcessExcelExportContentParams = {
  workbook: GridExcelJsProcessInput['workbook'];
  data: Record<string, unknown>[];
};

export interface ExportToCsvParams extends WriteCSVOptions {
  data: Record<string, unknown>[];
  headers?: { field: string; headerName: string }[];
  filename?: string;
}

export type AutosizeAllColumnsParams = DataGridPremiumApiRef;
*/