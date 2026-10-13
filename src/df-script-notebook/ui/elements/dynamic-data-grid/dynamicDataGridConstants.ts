export const DATA_GRID_SELECTORS = {
  virtualScroller: ".MuiDataGrid-virtualScroller",
  columnHeaderTitle: ".MuiDataGrid-columnHeaderTitle",
  cell: ".MuiDataGrid-cell",
  groupingCriteriaOffset: ".MuiDataGrid-groupingCriteriaOffset",
} as const;

export const DATA_GRID_CSS_VARS = {
  hasScrollX: "--DataGrid-hasScrollX",
  hasScrollY: "--DataGrid-hasScrollY",
  scrollbarSize: "--DataGrid-scrollbarSize",
  columnsTotalWidth: "--DataGrid-columnsTotalWidth",
  rowWidth: "--DataGrid-rowWidth",
  leftPinnedWidth: "--DataGrid-leftPinnedWidth",
  rightPinnedWidth: "--DataGrid-rightPinnedWidth",
  headerHeight: "--DataGrid-headerHeight",
  headersTotalHeight: "--DataGrid-headersTotalHeight",
  topContainerHeight: "--DataGrid-topContainerHeight",
  bottomContainerHeight: "--DataGrid-bottomContainerHeight",
} as const;

export const GRID_ROW_GROUPING_MULTIPLE_GROUPING_FIELD_PREFFIX = "__row_group_by_columns_group_";
export const GRID_ROW_GROUPING_MULTIPLE_GROUPING_FIELD_PREFIX = GRID_ROW_GROUPING_MULTIPLE_GROUPING_FIELD_PREFFIX;
export const ROW_GRAND_TOTAL_FIELD_NAME = "__row_grand_total__";

