/* 
import { buildFilterItemId, ROW_INDEX_FIELD_NAME, ROW_GRAND_TOTAL_FIELD_NAME } from "../../../configs/gridConfig";
import { formatNumericValues, isNonEmptyArray, isNonEmptyObj } from "../../../utils/dataUtils";
import { resolveFont, resolveBoxModel, createTextMeasurer } from "../../../utils/layoutUtils";
import { GridPivotRowsModel, GridPivotColumnsModel, GridPivotValuesModel, ColumnConfigMap } from "../../../deskLevelReportingTypes";
import { $df } from "df-script";

import { VALID_MUI_FILTER_OPERATORS } from "../../sections/shared/modules";
import {
  BuildGridRowModelParams,
  BuildGridColumnVisibilityModelParams,
  BuildGridRowGroupingModelParams,
  BuildGridAggregationModelParams,
  BuildGridColDefModelParams,
  BuildGridPinnedColumnFieldsModelParams,
  BuildGridColumnOrderedFieldsParams,
  BuildGridSortModelParams,
  BuildGridFilterModelParams,
  BuildGridPivotModelParams,
  ComposeOrderedColumnFieldsParams,
  BuildGridInternalColumnsParams,
  BuildGridInitialState,
  ResolveRowGroupExpansionTargetParams,
  IsRowGroupExpansionAppliedParams,
  ApplyRowGroupExpansionParams,
  PreProcessExcelExportContentParams,
  GeneratePivotedDataParams,
  ExportToCsvParams,
  ResolveDataGridCssMetricsParams,
} from "./dynamicDataGridTypes";
import { GRID_ROW_GROUPING_MULTIPLE_GROUPING_FIELD_PREFIX } from "../../../configs/gridConfig";
import {
  GRID_ROW_GROUPING_SINGLE_GROUPING_FIELD,
  GRID_CHECKBOX_SELECTION_COL_DEF,
  GRID_AGGREGATION_FUNCTIONS,
  GridAggregationModel,
  GridColDef,
  GridColumnsInitialState,
  GridColumnVisibilityModel,
  GridFilterItem,
  GridFilterModel,
  GridGroupNode,
  GridInitialState,
  GridLogicOperator,
  GridPinnedColumnFields,
  GridPivotModel,
  GridSidebarValue,
  GridSortModel,
  GridRowGroupingModel,
  GridRowModel,
} from "@mui/x-data-grid";
import { DataGridPremiumApiRef, GridInternalColumns, AutosizeAllColumnsParams } from "./dynamicDataGridTypes";


export const getRowGroupingField = (field: string, mode: "single" | "multiple" = "single"): string =>
  mode === "single"
    ? GRID_ROW_GROUPING_SINGLE_GROUPING_FIELD
    : `${GRID_ROW_GROUPING_MULTIPLE_GROUPING_FIELD_PREFIX}${field}`;

export function resolveGridFilterField({
  sourceField,
  gridRowGroupingModel,
  gridRowGroupingColumnMode,
}: {
  sourceField: string;
  gridRowGroupingModel: GridRowGroupingModel;
  gridRowGroupingColumnMode: "single" | "multiple";
}): string {
  return gridRowGroupingModel.includes(sourceField)
    ? getRowGroupingField(sourceField, gridRowGroupingColumnMode)
    : sourceField;
}

export function resolveGridFilterSourceField({
  filterItem,
  colConfig,
  gridRowGroupingModel,
}: {
  filterItem: GridFilterItem;
  colConfig: ColumnConfigMap;
  gridRowGroupingModel: GridRowGroupingModel;
}): string | undefined {
  const sourceFieldFromId = String(filterItem.id ?? "").match(/^(.*)-filter-\d+(?:\?.*)?$/)?.[1];
  if (sourceFieldFromId && sourceFieldFromId in colConfig) return sourceFieldFromId;
  if (filterItem.field in colConfig) return filterItem.field;

  const sourceFieldFromMultipleGrouping = gridRowGroupingModel.find(
    (field) => getRowGroupingField(field, "multiple") === filterItem.field,
  );
  if (sourceFieldFromMultipleGrouping) return sourceFieldFromMultipleGrouping;

  return filterItem.field === GRID_ROW_GROUPING_SINGLE_GROUPING_FIELD ? gridRowGroupingModel[0] : undefined;
}

export function toExcelColumnName(n: number): string {
  let str = "";
  while (n >= 0) {
    str = String.fromCharCode((n % 26) + 65) + str;
    n = Math.floor(n / 26) - 1;
  }
  return str;
}

export function autosizeAllColumns({ apiRef }: AutosizeAllColumnsParams): void {
  const api = apiRef?.current;
  if (!api) return;

  const rootEl = api.rootElementRef?.current;
  if (!rootEl) return;

  const headerTitleEl = rootEl.querySelector<HTMLElement>(DATA_GRID_SELECTORS.columnHeaderTitle);
  const cellEl = rootEl.querySelector<HTMLElement>(DATA_GRID_SELECTORS.cell);

  const headerFont = resolveFont(headerTitleEl, "600 0.75rem Roboto, sans-serif");
  const cellFont = resolveFont(cellEl, "400 0.75rem Roboto, sans-serif");

  const cellBox = resolveBoxModel(cellEl);
  const cellPadding = cellBox.left.padding + cellBox.right.padding || 20;
  const headerBox = resolveBoxModel(headerTitleEl?.parentElement);
  const headerPadding = headerBox.left.padding + headerBox.right.padding || 20;
  const HEADER_ICON_BUFFER = 18;

  const groupingOffsetEl = rootEl.querySelector<HTMLElement>(DATA_GRID_SELECTORS.groupingCriteriaOffset);
  const indentPerLevel = groupingOffsetEl ? parseFloat(getComputedStyle(groupingOffsetEl).marginLeft) || 32 : 32;
  const EXPAND_ICON_WIDTH = 24;

  const measure = createTextMeasurer();
  if (!measure) return;

  const isGroupingColumn = (field: string): boolean =>
    field === GRID_ROW_GROUPING_SINGLE_GROUPING_FIELD ||
    field.startsWith(GRID_ROW_GROUPING_MULTIPLE_GROUPING_FIELD_PREFIX);

  const visibleColumns = api.getVisibleColumns().filter((col) => col.field !== ROW_INDEX_FIELD_NAME);

  const sortedRowIds = api.getSortedRowIds();
  const visibleRowNodes = sortedRowIds.map((id) => ({
    id,
    node: api.getRowNode(id),
    row: api.getRow(id),
  }));

  for (const col of visibleColumns) {
    const headerText = col.headerName ?? col.field;
    const headerWidth =
      measure(headerText, headerFont.font, headerFont.letterSpacing) + headerPadding + HEADER_ICON_BUFFER;

    let maxCellWidth = 0;

    if (isGroupingColumn(col.field)) {
      for (const { node } of visibleRowNodes) {
        if (node?.type !== "group") continue;

        const groupNode = node as GridGroupNode;
        const displayValue = String(groupNode.groupingKey ?? "");
        const textWidth = measure(displayValue, cellFont.font, cellFont.letterSpacing);
        const rowIndent = groupNode.depth * indentPerLevel + EXPAND_ICON_WIDTH;
        const totalWidth = textWidth + rowIndent + cellPadding;

        if (totalWidth > maxCellWidth) maxCellWidth = totalWidth;
      }
    } else {
      for (const { row } of visibleRowNodes) {
        if (!row) continue;

        const rawValue = row[col.field];
        let displayValue: string;

        if (col.valueFormatter != null) {
          try {
            displayValue = String((col.valueFormatter as (value: unknown) => unknown)(rawValue) ?? "");
          } catch {
            displayValue = String(rawValue ?? "");
          }
        } else {
          displayValue = String(rawValue ?? "");
        }

        const width = measure(displayValue, cellFont.font, cellFont.letterSpacing) + cellPadding;
        if (width > maxCellWidth) maxCellWidth = width;
      }
    }

    const finalWidth = Math.ceil(Math.max(headerWidth, maxCellWidth));
    const clampedWidth = Math.max(col.minWidth ?? 50, Math.min(finalWidth, col.maxWidth ?? Infinity));

    api.setColumnWidth(col.field, clampedWidth);
  }
}

export function generatePivotedData({
  records,
  gridPivotModel,
  isPivotActive,
  includeGrandTotalColumn,
}: GeneratePivotedDataParams): Record<string, unknown>[] {
  if (!records || records.length === 0) return [];
  if (!isPivotActive) return records;

  const pivotRows = gridPivotModel?.rows?.map((r) => r.field) ?? [];
  const pivotValues = gridPivotModel?.values?.map((r) => r.field) ?? [];
  const pivotColumns = gridPivotModel?.columns?.map((r) => r.field) ?? [];

  if (pivotRows.length === 0 && pivotColumns.length === 0) return records;

  const df = $df.data(records);

  // 1. Compute grouped pivot records
  const groupKeys = [...pivotRows, ...pivotColumns];
  const selectCols = [...groupKeys, ...pivotValues];

  const groupedDf = groupKeys.length > 0
    ? df.select(...selectCols).groupBy(groupKeys).agg($df.all().sum())
    : df;

  const grouped = groupedDf.toDicts();

  if (grouped.length === 0 || pivotRows.length === 0 || pivotColumns.length === 0 || !includeGrandTotalColumn) {
    return grouped;
  }

  const grandTotalColumnLiterals = Object.fromEntries(
    pivotColumns.map((colName) => [colName, $df.lit(ROW_GRAND_TOTAL_FIELD_NAME)]),
  );

  const grandTotals = $df
    .data(grouped)
    .select(...pivotRows, ...pivotValues)
    .groupBy(pivotRows)
    .agg($df.all().sum())
    .withColumns(grandTotalColumnLiterals)
    .toDicts();

  return [...grouped, ...grandTotals];
}

export function rollupGroupedData({
  records,
  colConfig,
  gridRowGroupingModel,
  gridColumnVisibilityModel,
  gridAggregationModel,
  gridFilterModel: _gridFilterModel,
}: {
  records: Record<string, any>[];
  colConfig: ColumnConfigMap;
  gridRowGroupingModel: GridRowGroupingModel;
  gridColumnVisibilityModel?: GridColumnVisibilityModel;
  gridAggregationModel: GridAggregationModel;
  gridFilterModel?: GridFilterModel;
}): Record<string, any>[] {
  if (!records || records.length === 0) return [];

  const visibleFields = Object.keys(colConfig).filter((field) => {
    if (gridRowGroupingModel.includes(field)) return true;
    const isVisible = gridColumnVisibilityModel?.[field] ?? colConfig[field]?.visible ?? false;
    return isVisible;
  });

  const aggFields = Object.keys(gridAggregationModel).filter(
    (field) => visibleFields.includes(field) && !gridRowGroupingModel.includes(field),
  );

  const groupbyKeys = visibleFields.filter((field) => !aggFields.includes(field));
  const actualKeys = groupbyKeys.length > 0 ? groupbyKeys : visibleFields;

  const df = $df.data(records);

  const exprs = aggFields.map((field) => {
    const aggFunc = (gridAggregationModel[field] ?? "sum") as keyof typeof GRID_AGGREGATION_FUNCTIONS;
    const expr = $df.col(field);

    if (aggFunc in expr) {
      return (expr as any)[aggFunc]();
    } else {
      return expr.sum();
    }
  });

  const rollupDf = df.groupBy(actualKeys);
  const resultDf = exprs.length > 0 ? rollupDf.agg(...exprs) : df;

  return resultDf.toDicts();
}

export function buildGridInternalColumns({
  includeIndexColumn = false,
  includeCheckboxColumn = false,
  gridRowGroupingModel = [],
  gridRowGroupingColumnMode = "single",
  isPivotActive = false,
}: BuildGridInternalColumnsParams): GridInternalColumns {
  const hasGrouping = !isPivotActive && isNonEmptyArray(gridRowGroupingModel);

  const groupingColumns = hasGrouping
    ? gridRowGroupingColumnMode === "single"
      ? [GRID_ROW_GROUPING_SINGLE_GROUPING_FIELD]
      : [...gridRowGroupingModel]
    : [];

  const left = [
    ...(includeCheckboxColumn ? [GRID_CHECKBOX_SELECTION_COL_DEF.field] : []),
    ...(includeIndexColumn ? [ROW_INDEX_FIELD_NAME] : []),
    ...groupingColumns,
  ];

  return {
    left: Array.from(new Set(left)),
    right: [],
    all: Array.from(new Set([...left])),
  };
}

export function composeOrderedColumnFields({
  baseColumns,
  gridPinnedColumnFields,
  internalColumns = [ROW_INDEX_FIELD_NAME, GRID_ROW_GROUPING_SINGLE_GROUPING_FIELD],
}: ComposeOrderedColumnFieldsParams) {
  const leftPinned = gridPinnedColumnFields?.left ?? [];
  const rightPinned = gridPinnedColumnFields?.right ?? [];

  const excluded = new Set([...leftPinned, ...rightPinned, ...internalColumns]);
  const middle = baseColumns.filter((f) => !excluded.has(f));

  return [...leftPinned, ...middle, ...rightPinned];
}

export function preProcessExcelExportContent({ workbook, data }: PreProcessExcelExportContentParams) {
  if (!data || data.length === 0) return;

  workbook.eachSheet((sheet) => {
    workbook.removeWorksheet(sheet.id);
  });

  const worksheet = workbook.addWorksheet("Export");
  const headers = Object.keys(data[0]);

  worksheet.columns = headers.map((key) => ({
    header: key,
    key,
    width: 30,
  }));

  data.forEach((row) => {
    const rowData: Record<string, unknown> = {};
    headers.forEach((key) => {
      rowData[key] = row[key];
    });
    worksheet.addRow(rowData);
  });
}

export function resolveDataGridCssMetrics({
  gridElement,
}: ResolveDataGridCssMetricsParams) {
  if (!gridElement) {
    return {
      hasScrollX: 0,
      hasScrollY: 0,
      scrollbarSize: 0,
      columnsTotalWidth: 0,
      leftPinnedWidth: 0,
      rightPinnedWidth: 0,
      headerHeight: 0,
      headersTotalHeight: 0,
      topContainerHeight: 0,
      bottomContainerHeight: 0,
    };
  }

  const s = getComputedStyle(gridElement);
  const px = (varName: string) => parseFloat(s.getPropertyValue(varName)) || 0;

  return {
    hasScrollX: px(DATA_GRID_CSS_VARS.hasScrollX),
    hasScrollY: px(DATA_GRID_CSS_VARS.hasScrollY),
    scrollbarSize: px(DATA_GRID_CSS_VARS.scrollbarSize),
    columnsTotalWidth: px(DATA_GRID_CSS_VARS.columnsTotalWidth),
    leftPinnedWidth: px(DATA_GRID_CSS_VARS.leftPinnedWidth),
    rightPinnedWidth: px(DATA_GRID_CSS_VARS.rightPinnedWidth),
    headerHeight: px(DATA_GRID_CSS_VARS.headerHeight),
    headersTotalHeight: px(DATA_GRID_CSS_VARS.headersTotalHeight),
    topContainerHeight: px(DATA_GRID_CSS_VARS.topContainerHeight),
    bottomContainerHeight: px(DATA_GRID_CSS_VARS.bottomContainerHeight),
  };
}

export function getGroupedRowNodes({ apiRef }: DataGridPremiumApiRef): GridGroupNode[] {
  const ref = apiRef?.current;
  if (!ref) return [];

  const sortedRowIds = ref.getSortedRowIds() ?? [];

  return sortedRowIds.reduce<GridGroupNode[]>((arr, id) => {
    const node = ref.getRowNode(id);
    if (node?.type === "group") {
      arr.push(node as GridGroupNode);
    }
    return arr;
  }, []);
}

export function isValidPivot(gridPivotModel: GridPivotModel): boolean {
  if (!gridPivotModel || !isNonEmptyObj(gridPivotModel)) return false;

  const rows = gridPivotModel?.rows ?? [];
  const columns = gridPivotModel?.columns ?? [];
  const values = gridPivotModel?.values ?? [];

  return isNonEmptyArray(values) && (isNonEmptyArray(rows) || isNonEmptyArray(columns));
}

export function buildRowIndexColDef(): GridColDef {
  return {
    field: ROW_INDEX_FIELD_NAME,
    headerName: "",
    width: 40,
    align: "center",
    headerAlign: "center",
    pivotable: false,
    headerClassName: "border-r border-[var(--DataGrid-rowBorderColor)]",
    cellClassName: "border-r border-[var(--DataGrid-rowBorderColor)] font-bold",
    groupable: false,
    aggregable: false,
    hideable: false,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    disableReorder: true,
    resizable: false,
    renderCell: (params) => {
      const sortedRowIds = params.api.getSortedRowIds();
      const index = sortedRowIds.indexOf(params.id);

      return index >= 0 ? index : "";
    },
  };
}

export function buildGridInitialState({
  colConfig,
  gridPinnedColumnFieldsParams = {},
  gridFilterModelParams = {},
  internalColumns = [],
  isMobile = false,
}: BuildGridInitialState): GridInitialState {
  const { defaultPinnedLeft, defaultPinnedRight } = gridPinnedColumnFieldsParams;
  const { gridRowGroupingColumnMode } = gridFilterModelParams;

  const gridPinnedColumnFields: GridPinnedColumnFields = buildGridPinnedColumnFieldsModel({
    colConfig,
    defaultPinnedLeft,
    defaultPinnedRight,
  });

  const gridSortModel: GridSortModel = buildGridSortModel({ colConfig });

  const gridRowGroupingModel: GridRowGroupingModel = buildGridRowGroupingModel({ colConfig });

  const gridPivotModel: GridPivotModel = buildGridPivotModel({ colConfig });
  const isPivot: boolean = isValidPivot(gridPivotModel);

  const gridFilterModel: GridFilterModel = buildGridFilterModel({
    colConfig,
    gridRowGroupingModel,
    gridRowGroupingColumnMode,
    isPivot,
  });

  const gridColumnVisibilityModel: GridColumnVisibilityModel = buildGridColumnVisibilityModel({ colConfig });
  const gridColumnOrderedFields: GridColumnsInitialState["orderedFields"] = buildGridColumnOrderedFields({
    colConfig,
    gridPinnedColumnFields,
    internalColumns,
  });

  const gridAggregationModel: GridAggregationModel = buildGridAggregationModel({ colConfig });

  return {
    // GridInitialStateCommunity
    sorting: {
      sortModel: gridSortModel,
    },
    filter: {
      filterModel: gridFilterModel,
    },
    columns: {
      columnVisibilityModel: gridColumnVisibilityModel,
      orderedFields: gridColumnOrderedFields,
    },
    // GridInitialStatePro
    pinnedColumns: gridPinnedColumnFields,
    detailPanel: {
      expandedRowIds: new Set(),
    },
    // GridInitialStatePremium 
    rowGrouping: {
      model: gridRowGroupingModel,
    },
    aggregation: {
      model: gridAggregationModel,
    },
    ...(isPivot && {
      pivoting: {
        model: gridPivotModel,
        enabled: true,
      },
    }),
    ...(isPivot && {
      sidebar: {
        open: !isMobile,
        value: GridSidebarValue.Pivot,
      },
    }),
  };
}

export function buildGridRowModel({ data }: BuildGridRowModelParams): GridRowModel[] {
  return (data ?? []).map((row, index) => ({
    ...row,
    id: index,
  }));
}

export function buildGridColumnVisibilityModel({
  colConfig,
}: BuildGridColumnVisibilityModelParams): GridColumnVisibilityModel {
  return Object.entries(colConfig).reduce((obj, [k, c]) => {
    obj[k] = c?.visible ?? false;
    return obj;
  }, {} as GridColumnVisibilityModel);
}

export function buildGridColumnOrderedFields({
  colConfig,
  gridPinnedColumnFields,
  internalColumns = [],
}: BuildGridColumnOrderedFieldsParams): GridColumnsInitialState["orderedFields"] {
  const baseSorted = Object.entries(colConfig)
    .sort(([, a], [, b]) => {
      const orderA = a.columnOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.columnOrder ?? Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return (a.displayName || "").localeCompare(b.displayName || "");
    })
    .map(([field]) => field);

  return composeOrderedColumnFields({
    baseColumns: baseSorted,
    gridPinnedColumnFields,
    internalColumns,
  });
}

export function buildGridRowGroupingModel({ colConfig }: BuildGridRowGroupingModelParams): GridRowGroupingModel {
  return Object.entries(colConfig)
    .filter(([, c]) => c.groupable && c.includedInGrouping)
    .sort(([, a], [, b]) => (a.groupingOrder ?? Infinity) - (b.groupingOrder ?? Infinity))
    .map(([k]) => k);
}

export function buildGridAggregationModel({ colConfig }: BuildGridAggregationModelParams): GridAggregationModel {
  return Object.entries(colConfig).reduce((acc, [k, c]) => {
    if (c.aggregationFunction) {
      acc[k] = c.aggregationFunction;
    }
    return acc;
  }, {} as GridAggregationModel);
}

export function buildGridSortModel({ colConfig }: BuildGridSortModelParams): GridSortModel {
  return Object.entries(colConfig)
    .filter(([, c]) => c.sortable && c.sortingDirection && c.visible)
    .sort(([, a], [, b]) => (a.sortingOrder ?? Infinity) - (b.sortingOrder ?? Infinity))
    .map(([f, c]) => ({ field: f, sort: c.sortingDirection }));
}

export function buildGridFilterModel({
  colConfig,
  logicOperator,
  gridRowGroupingModel = [],
  gridRowGroupingColumnMode = "single",
  isPivot = false,
}: BuildGridFilterModelParams): GridFilterModel {
  const orderedFilterEntries = Object.entries(colConfig)
    .flatMap(([field, columnConfig]) =>
      (columnConfig?.filterItems ?? []).map((filterItem) => ({
        field,
        visible: columnConfig?.visible,
        includedInGrouping: columnConfig?.includedInGrouping,
        includedInPivotRows: Boolean(columnConfig?.pivotRow && !columnConfig.pivotRow.hidden),
        filterable: columnConfig?.filterable,
        filterItem,
      })),
    )
    .filter(({ visible, includedInGrouping, includedInPivotRows, filterable, filterItem }) =>
      Boolean(
        filterable &&
        (isPivot ? includedInPivotRows : visible || includedInGrouping) &&
        filterItem?.operator &&
        VALID_MUI_FILTER_OPERATORS.has(filterItem.operator),
      ),
    )
    .sort((a, b) => (a.filterItem?.order ?? Infinity) - (b.filterItem?.order ?? Infinity));

  const savedLogicOperators = orderedFilterEntries.map((entry) => entry.filterItem?.filterLogicOperator);
  const hasSavedLogicOperator = savedLogicOperators.some((operator) => operator != null);

  const savedLogicOperator =
    hasSavedLogicOperator && savedLogicOperators.every((operator) => operator === savedLogicOperators[0])
      ? savedLogicOperators[0]
      : undefined;

  const resolvedLogicOperator = logicOperator ?? savedLogicOperator ?? GridLogicOperator.And;

  const items: GridFilterItem[] = orderedFilterEntries.map(({ field, filterItem }, idx) => {
    const resolvedField = resolveGridFilterField({
      sourceField: field,
      gridRowGroupingModel: isPivot ? [] : gridRowGroupingModel,
      gridRowGroupingColumnMode,
    });

    return {
      id: `${buildFilterItemId({ field, order: filterItem.order ?? idx })}-${gridRowGroupingColumnMode}`,
      field: resolvedField,
      operator: filterItem.operator!,
      ...(filterItem.value !== undefined ? { value: filterItem.value } : {}),
    };
  });

  return { items, logicOperator: resolvedLogicOperator };
}

export function buildGridPivotModel({ colConfig }: { colConfig: ColumnConfigMap }): GridPivotModel {
  const pivotItems = {
    rows: [] as { item: GridPivotRowsModel; index: number }[],
    values: [] as { item: GridPivotValuesModel; index: number }[],
    columns: [] as { item: GridPivotColumnsModel; index: number }[],
  };

  for (const config of Object.values(colConfig)) {
    const { pivotRow, pivotRowIndex, pivotColumn, pivotColumnIndex, pivotValue, pivotValueIndex } = config;

    if (pivotRow && !pivotRow.hidden) {
      pivotItems.rows.push({ item: pivotRow, index: pivotRowIndex ?? Infinity });
    }
    if (pivotColumn && !pivotColumn.hidden) {
      pivotItems.columns.push({ item: pivotColumn, index: pivotColumnIndex ?? Infinity });
    }
    if (pivotValue && !pivotValue.hidden) {
      pivotItems.values.push({ item: pivotValue, index: pivotValueIndex ?? Infinity });
    }
  }

  const byIndex = (a: { index: number }, b: { index: number }) => a.index - b.index;

  return {
    rows: pivotItems.rows.sort(byIndex).map((i => i.item)),
    columns: pivotItems.columns.sort(byIndex).map((i => i.item)),
    values: pivotItems.values.sort(byIndex).map((i => i.item)),
  };
}

export function buildGridPinnedColumnFieldsModel({
  colConfig,
  defaultPinnedLeft = [],
  defaultPinnedRight = [],
}: BuildGridPinnedColumnFieldsModelParams): GridPinnedColumnFields {
  const sortedPinnedCols = Object.entries(colConfig)
    .filter(([, c]) => c.pinned)
    .sort(([, a], [, b]) => {
      const posA = a.pinned === "left" ? 0 : 1;
      const posB = b.pinned === "left" ? 0 : 1;

      if (posA !== posB) return posA - posB;

      const orderA = a.pinnedOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.pinnedOrder ?? Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) return orderA - orderB;

      return (a.displayName || "").localeCompare(b.displayName || "");
    });

  const result = sortedPinnedCols.reduce<GridPinnedColumnFields>(
    (o, [k, c]) => {
      if (c?.pinned === "left") o.left!.push(k);
      else if (c?.pinned === "right") o.right!.push(k);
      return o;
    },
    {
      left: [...defaultPinnedLeft],
      right: [...defaultPinnedRight],
    },
  );

  result.left = Array.from(new Set(result.left));
  result.right = Array.from(new Set(result.right));
  return result;
}

export function buildGridColDef({ colConfig, gridColumnsOrderedFields }: BuildGridColDefModelParams): GridColDef[] {
  const dataColumns = Object.entries(colConfig).map(([k, v]) => ({
    field: k,
    headerName: v.displayName || k,
    cellClassName: "border-r border-t border-[var(--DataGrid-rowBorderColor)]",
    sortable: !!v?.sortable,
    resizable: true,
    minWidth: 50,
    maxWidth: 500,
    type: v?.dataType ?? "string",
    filterable: !!v?.filterable,
    aggregable: !!v?.aggregationFunction,
    groupable: !!v?.groupable,
    pinnable: !!v?.pinnable,
    valueFormatter: (value?: number) => formatNumericValues(value),
  }));

  if (gridColumnsOrderedFields?.length) {
    const rank = new Map<string, number>();
    gridColumnsOrderedFields.forEach((f, i) => rank.set(f, i));

    dataColumns.sort((a, b) => {
      const ra = rank.has(a.field) ? rank.get(a.field)! : Number.MAX_SAFE_INTEGER;
      const rb = rank.has(b.field) ? rank.get(b.field)! : Number.MAX_SAFE_INTEGER;
      if (ra !== rb) return ra - rb;

      const aName = a.headerName ?? a.field;
      const bName = b.headerName ?? b.field;
      return aName.localeCompare(bName);
    });
  } else {
    dataColumns.sort((a, b) => (a?.headerName ?? a.field).localeCompare(b.headerName ?? b.field));
  }

  return dataColumns;
}

export function resolveGrandTotalFields({ apiRef }: DataGridPremiumApiRef): string[] {
  const api = apiRef?.current;
  if (!api) return [];

  return api
    .getVisibleColumns()
    .filter((col) => col.field.includes(ROW_GRAND_TOTAL_FIELD_NAME))
    .map((col) => col.field);
}

export function resolveRowGroupExpansionTarget({
  apiRef,
  target = { scope: "all" },
}: ResolveRowGroupExpansionTargetParams): GridGroupNode[] {
  const groupNodes = getGroupedRowNodes({ apiRef });
  if (groupNodes.length === 0) return [];

  switch (target.scope) {
    case "all":
      return groupNodes;
    case "offsetFromMax": {
      const depths = groupNodes.map((node => node.depth));
      if (depths.length === 0) return [];
      const maxDepth = Math.max(...depths);
      const cutoff = Math.max(0, maxDepth - target.offset);
      return groupNodes.filter((node => node.depth <= cutoff));
    }
    case "lowest": {
      const depths = groupNodes.map((node => node.depth));
      if (depths.length === 0) return [];
      const maxDepth = Math.max(...depths);
      return groupNodes.filter((node => node.depth === maxDepth));
    }
    case "depth":
      return groupNodes.filter((node => node.depth === target.depth));
    case "node":
      return groupNodes.filter((node => node.parent === target.nodeId));
  }
}

export function isRowGroupExpansionApplied({
  apiRef,
  gridRowExpansionModel,
  target = { scope: "all" },
}: IsRowGroupExpansionAppliedParams): boolean {
  const targets = resolveRowGroupExpansionTarget({ apiRef, target });
  return targets.length > 0 && targets.every((node => gridRowExpansionModel.has(node.id)));
}

export function applyRowGroupExpansion({
  apiRef,
  expand,
  target = { scope: "all" },
}: ApplyRowGroupExpansionParams): void {
  const ref = apiRef?.current;
  if (!ref) return;

  const targets = resolveRowGroupExpansionTarget({ apiRef, target });

  targets.forEach((node) => {
    ref.setRowChildrenExpansion(node.id, expand);
  });
}

export function exportToCsv({
  data,
  headers,
  filename = "desk-level-reporting-export",
  ...writeCsvOptions
}: ExportToCsvParams): void {
  if (!data || data.length === 0) return;

  const df = headers?.length
    ? $df.data(data).select(...headers.map((h) => $df.col(h.field).alias(h.headerName || h.field)))
    : $df.data(data);

  const csvContent = df.writeCsv(undefined, writeCsvOptions);
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function syncGridRowWidth(gridRef: React.RefObject<HTMLElement>): void {
  requestAnimationFrame(() => {
    if (gridRef.current === null) return;
    const dataGridMetrics = resolveDataGridCssMetrics({ gridElement: gridRef.current });

    if (dataGridMetrics.hasScrollX === 0) {
      const actualWidth = dataGridMetrics.columnsTotalWidth + dataGridMetrics.scrollbarSize;
      gridRef.current.style.setProperty(DATA_GRID_CSS_VARS.rowWidth, `${actualWidth}px`);
    }
  });
}
*/
