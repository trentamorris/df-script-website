/*
import React from "react";
import { $df } from "df-script";
import {
  GRID_ROW_GROUPING_SINGLE_GROUPING_FIELD,
  GridColDef,
  GridFilterItem,
  GridLogicOperator,
  GridRowGroupingModel,
  GridSortDirection,
  GridColumnVisibilityModel,
} from "@mui/x-data-grid";
import { buildFilterItemId } from "../../../configs/gridConfig";
import { ROW_INDEX_FIELD_NAME } from "../../../configs/gridConfig";
import { ColumnConfig, ColumnFilterItem } from "../../../deskLevelReportingTypes";
import { DraggableList, DraggableListItem } from "../../../draggable-list/DraggableList";
import {
  DraggableListFooterAddRowButton,
  DraggableListFooterRemoveAllRowsButton,
} from "../../../draggable-list/slots/draggable-list-footer/DraggableListFooter";
import { useDynamicDataGridContext } from "../../DynamicDataGrid";
import {
  buildFilterItemId,
  composeOrderedColumnFields,
  resolveGridFilterField,
  resolveGridFilterSourceField,
} from "../../dynamicDataGridUtils";
import { Check, ChevronRight } from "@mui/icons-material";
import { TableConfigurationViewProps, OverviewViewProps } from "./dynamicDataGridTableConfigTypes";
import { DataTypeIndicator, ToggleColVisibilitySwitch, SortMethodSelection } from "../../../sections/shared/Modules";
import { FilterListItemContent } from "../../../sections/shared/TableConfigurationViews";
import { useIsMobile } from "root/app/hooks/useIsMobile";

export const OverviewView: React.FC<OverviewViewProps> = React.memo(({ viewMetaDataObj, navigateToPanel }) => {
  return (
    <ul className="overflow-x-hidden overflow-y-auto p-[8px] scrlb-c-d ">
      {Object.entries(viewMetaDataObj).map(([k, v]) => (
        <li
          key={k}
          className="relative flex flex-col items-center cursor-pointer"
          onClick={() => {
            navigateToPanel(k, "right");
          }}
        >
          <div className="flex items-center justify-between rounded-[4px] h-[48px] w-[100%] gap-[2rem] px-[12px] hvr-fdbk">
            <div className="flex items-center justify-center gap-[0.5rem]">
              <button>{v.symbol}</button>
              <span className="whitespace-nowrap">{v.name}</span>
            </div>
            <div>
              <ChevronRight />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
});

OverviewView.displayName = "OverviewView";

export const RowGroupingColumnModeView: React.FC<TableConfigurationViewProps> = React.memo(({ navigateToPanel }) => {
  const { gridRowGroupingColumnMode, setGridRowGroupingColumnMode } = useDynamicDataGridContext();

  const options = React.useMemo(
    () => [
      {
        value: "single" as const,
        label: "Single Column",
      },
      {
        value: "multiple" as const,
        label: "Multiple Columns",
      },
    ],
    [],
  );

  return (
    <>
      <PanelMenuItemHeader
        title={"Row Grouping Column Mode"}
        onBackClick={() => navigateToPanel("overviewView", "left")}
      />
      <ul className="overflow-x-hidden overflow-y-auto p-[8px] scrlb-c-d ">
        {options.map((option) => {
          const isSelected = gridRowGroupingColumnMode === option.value;
          return (
            <li
              key={option.value}
              className="relative flex flex-col items-center cursor-pointer"
              onClick={() => setGridRowGroupingColumnMode(option.value)}
            >
              <div className="flex items-center justify-between rounded-[4px] h-[48px] w-[100%] gap-[2rem] px-[12px] hvr-fdbk">
                <div className="flex items-center justify-center gap-[0.5rem]">
                  <Check
                    fontSize="small"
                    sx={{ opacity: isSelected ? 1 : 0 }}
                  />
                  <span className="whitespace-nowrap">{option.label}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
});

RowGroupingColumnModeView.displayName = "RowGroupingColumnModeView";

export const GroupingView: React.FC<TableConfigurationViewProps> = React.memo(({ navigateToPanel }) => {
  const isMobile = useIsMobile();
  const { apiRef, gridRowGroupingModel, setGridRowGroupingModel } = useDynamicDataGridContext();
  const allColumns = apiRef.current?.getAllColumns() ?? [];

  const sortedColumns = React.useMemo(() => {
    return $df
      .data(allColumns)
      .filter($df.col("groupable").eq(true))
      .withColumns({
        rank: $df.col("field").rank({ dense: true }),
      })
      .sort({ by: ["rank", "headerName", "field"] })
      .drop("rank")
      .toDicts();
  }, [allColumns, gridRowGroupingModel]);

  const [displayListColumns, setDisplayListColumns] = React.useState<GridColDef[]>(sortedColumns);

  const onListItemDrop = React.useCallback(
    (draggedIndex: number, hoveredIndex: number) => {
      const reorderedList = [...displayListColumns];
      const [draggedItem] = reorderedList.splice(draggedIndex, 1);
      reorderedList.splice(hoveredIndex, 0, draggedItem);

      setDisplayListColumns(reorderedList);

      const newGroupingOrder = reorderedList
        .map((c) => c.field)
        .filter((field) => gridRowGroupingModel.includes(field));

      setGridRowGroupingModel(newGroupingOrder);
    },
    [displayListColumns, gridRowGroupingModel, setGridRowGroupingModel],
  );

  const onChangeFn = React.useCallback(
    (col: GridColDef) => {
      const isGrouped = gridRowGroupingModel.includes(col.field);

      let newModel: GridRowGroupingModel;
      if (isGrouped) {
        newModel = gridRowGroupingModel.filter((f) => f !== col.field);
      } else {
        newModel = displayListColumns
          .map((c) => c.field)
          .filter((f) => f === col.field || gridRowGroupingModel.includes(f));
      }

      setGridRowGroupingModel(newModel);
    },
    [gridRowGroupingModel, setGridRowGroupingModel],
  );

  return (
    <>
      <PanelMenuItemHeader
        title={"Grouping Settings"}
        onBackClick={() => navigateToPanel("overviewView", "left")}
      />
      <DraggableList
        onReorder={onListItemDrop}
        getScrollParent={(list) => list.closest(".panel-overflow-container")}
      >
        {displayListColumns.map((c, idx) => (
          <DraggableListItem
            key={c.field}
            index={idx}
            showHandle={true}
          >
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-[12px] px-[12px] flex-1 min-w-0 h-[48px] rounded-[4px]">
              <span className={`whitespace-nowrap ${isMobile ? "overflow-hidden text-ellipsis" : ""}`}>
                {c.headerName}
              </span>
              <DataTypeIndicator dataType={c.type} />
              <ToggleColVisibilitySwitch
                checked={gridRowGroupingModel.includes(c.field)}
                onChange={() => onChangeFn(c)}
              />
            </div>
          </DraggableListItem>
        ))}
      </DraggableList>
    </>
  );
});

GroupingView.displayName = "GroupingView";

export const ColumnView: React.FC<TableConfigurationViewProps> = React.memo(
  ({ navigateToPanel, internalColumns = [ROW_INDEX_FIELD_NAME, GRID_ROW_GROUPING_SINGLE_GROUPING_FIELD] }) => {
    const isMobile = useIsMobile();
    const {
      apiRef,
      gridColumnVisibilityModel,
      gridColumnsOrderedFields,
      gridPinnedColumnFields,
      setGridColumnsOrderedFields,
      setGridColumnVisibilityModel,
    } = useDynamicDataGridContext();
    const allColumns = apiRef.current?.getAllColumns() ?? [];

    const sortedColumns = React.useMemo(() => {
      return $df
        .data(allColumns)
        .filter($df.col("field").notIn(internalColumns))
        .withColumns({
          rank: $df.col("field").rank({ dense: true }),
        })
        .sort({ by: ["rank", "headerName", "field"] })
        .drop("rank")
        .toDicts();
    }, [allColumns, internalColumns]);

    const [filteredColumns, setFilteredColumns] = React.useState<GridColDef[]>(sortedColumns);

    const onListItemDrop = React.useCallback(
      (draggedIndex: number, hoveredIndex: number) => {
        const reorderedList = [...filteredColumns];
        const [draggedItem] = reorderedList.splice(draggedIndex, 1);
        reorderedList.splice(hoveredIndex, 0, draggedItem);

        setFilteredColumns(reorderedList);

        const newBaseOrder = reorderedList.map((c) => c.field);

        const nextOrderedFields = composeOrderedColumnFields({
          baseColumns: newBaseOrder,
          gridPinnedColumnFields,
          internalColumns,
        });

        setGridColumnsOrderedFields(nextOrderedFields);
      },
      [filteredColumns, gridPinnedColumnFields, internalColumns, setGridColumnsOrderedFields],
    );

    const onChangeFn = React.useCallback(
      (col: GridColDef) => {
        const isVisible = gridColumnVisibilityModel?.[col.field] ?? true;
        const newModel: GridColumnVisibilityModel = {
          ...gridColumnVisibilityModel,
          [col.field]: !isVisible,
        };

        setGridColumnVisibilityModel(newModel);
      },
      [gridColumnVisibilityModel, setGridColumnVisibilityModel],
    );

    return (
      <>
        <PanelMenuItemHeader
          title={"Column Settings"}
          onBackClick={() => navigateToPanel("overviewView", "left")}
        />
        <DraggableList
          onReorder={onListItemDrop}
          getScrollParent={(list) => list.closest(".panel-overflow-container")}
        >
          {filteredColumns.map((c: GridColDef, idx: number) => (
            <DraggableListItem
              key={c.field}
              index={idx}
              showHandle={true}
            >
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-[12px] px-[12px] flex-1 min-w-0 h-[48px] rounded-[4px]">
                <span className={`whitespace-nowrap ${isMobile ? "overflow-hidden text-ellipsis" : ""}`}>
                  {c.headerName}
                </span>
                <DataTypeIndicator dataType={c.type} />
                <ToggleColVisibilitySwitch
                  checked={gridColumnVisibilityModel?.[c.field] ?? true}
                  onChange={() => onChangeFn(c)}
                />
              </div>
            </DraggableListItem>
          ))}
        </DraggableList>
      </>
    );
  },
);

ColumnView.displayName = "ColumnView";

export const FilterView: React.FC<TableConfigurationViewProps> = React.memo(({ navigateToPanel }) => {
  const {
    appliedColConfig,
    gridColumnVisibilityModel,
    gridFilterModel,
    gridRowGroupingColumnMode,
    gridRowGroupingModel,
    isPivotActive,
    gridPivotModel,
    setGridFilterModel,
  } = useDynamicDataGridContext();

  const filterColumns = React.useMemo(() => {
    return (Object.values(appliedColConfig) as ColumnConfig[]).filter((columnConfig) => {
      if (isPivotActive) {
        const visibleGridPivotRows = (
          gridPivotModel?.rows?.reduce<string[]>((arr, { field, hidden }) => {
            if (!hidden) arr.push(field);
            return arr;
          }, []) ?? []
        );

        return columnConfig.filterable && visibleGridPivotRows.includes(columnConfig.id);
      }
      const isVisible = gridColumnVisibilityModel[columnConfig.id] ?? columnConfig.visible ?? false;
      return columnConfig.filterable && (isVisible || gridRowGroupingModel.includes(columnConfig.id));
    });
  }, [appliedColConfig, gridColumnVisibilityModel, gridRowGroupingModel, isPivotActive, gridPivotModel]);

  const filterRows = React.useMemo(() => {
    return gridFilterModel.items
      .map((filterItem) => {
        const field = resolveGridFilterSourceField({
          filterItem,
          colConfig: appliedColConfig,
          gridRowGroupingModel,
        });

        const columnConfig = field ? appliedColConfig[field] : undefined;
        return columnConfig ? { columnConfig, filterItem } : undefined;
      })
      .filter((row): row is { columnConfig: ColumnConfig; filterItem: GridFilterItem } => Boolean(row));
  }, [appliedColConfig, gridFilterModel.items, gridRowGroupingModel]);

  const createFilterItem = React.useCallback(
    (columnConfig: ColumnConfig, order: number): GridFilterItem => ({
      id: buildFilterItemId({ field: columnConfig.id, order }),
      field: resolveGridFilterField({
        sourceField: columnConfig.id,
        gridRowGroupingModel,
        gridRowGroupingColumnMode,
      }),
      operator: columnConfig.dataType === "number" ? "=" : "contains",
      value: "",
    }),
    [gridRowGroupingColumnMode, gridRowGroupingModel],
  );

  const addFilter = React.useCallback(() => {
    const columnConfig = filterColumns[0];
    if (!columnConfig) return;

    setGridFilterModel((previous) => {
      return {
        ...previous,
        items: [...previous.items, createFilterItem(columnConfig, previous.items.length)],
      };
    });
  }, [createFilterItem, filterColumns, setGridFilterModel]);

  return (
    <>
      <PanelMenuItemHeader
        title="Filter Settings"
        onBackClick={() => navigateToPanel("overviewView", "left")}
      />
      <DraggableList
        className="w-max min-w-full"
        getScrollParent={(list) => list.closest(".panel-overflow-container")}
        slotProps={{
          footer: {
            className: "!border-t-0 !w-full justify-between gap-[8px]",
            children: (
              <>
                <DraggableListFooterAddRowButton label="Add Filter" onClick={addFilter} />
                <DraggableListFooterRemoveAllRowsButton
                  label="Remove All Filters"
                  render={() => <span>{gridFilterModel.items.length} Remove All Filters</span>}
                  disabled={gridFilterModel.items.length === 0}
                  onClick={() => setGridFilterModel((previous) => ({ ...previous, items: [] }))}
                />
              </>
            ),
          },
        }}
      >
        {filterRows.map(({ columnConfig, filterItem }, index) => {
          const logicOperatorMode = index === 0 ? "hidden" : index === 1 ? "enabled" : "disabled";
          const filterItemForEditor: ColumnFilterItem = {
            ...filterItem,
            order: index,
            filterLogicOperator: gridFilterModel.logicOperator ?? GridLogicOperator.And,
          };

          return (
            <DraggableListItem
              key={filterItem.id}
              index={index}
              showHandle={false}
            >
              <FilterListItemContent
                columnConfig={columnConfig}
                filterItem={filterItemForEditor}
                filterColumns={filterColumns}
                logicOperatorMode={logicOperatorMode}
                onFilterColumnChange={({ filterItemId, newColumnId }) => {
                  const nextColumn = newColumnId ? appliedColConfig[newColumnId] : undefined;
                  if (!filterItemId || !nextColumn) return;

                  setGridFilterModel((previous) => {
                    const order = previous.items.findIndex((item) => item.id === filterItemId);

                    return {
                      ...previous,
                      items: previous.items.map((current =>
                        current.id === filterItemId
                          ? createFilterItem(nextColumn, order)
                          : current
                      )),
                    };
                  });
                }}
                onFilterOperatorChange={({ filterItemId, newOperator }) => {
                  if (!filterItemId || !newOperator) return;
                  setGridFilterModel((previous) => ({
                    ...previous,
                    items: previous.items.map((item =>
                      item.id === filterItemId ? { ...item, operator: newOperator } : item
                    )),
                  }));
                }}
                onFilterValueChange={({ filterItemId, newValue }) => {
                  if (!filterItemId) return;
                  setGridFilterModel((previous) => ({
                    ...previous,
                    items: previous.items.map((item =>
                      item.id === filterItemId ? { ...item, value: newValue } : item
                    )),
                  }));
                }}
                onFilterLogicOperatorChange={({ newLogicOperator }) => {
                  setGridFilterModel((previous) => ({ ...previous, logicOperator: newLogicOperator }));
                }}
                onFilterRemove={({ filterItemId }) => {
                  if (!filterItemId) return;
                  setGridFilterModel((previous) => ({
                    ...previous,
                    items: previous.items.filter((item => item.id !== filterItemId)),
                  }));
                }}
              />
            </DraggableListItem>
          );
        })}
      </DraggableList>
    </>
  );
});

FilterView.displayName = "FilterView";

export const SortingView: React.FC<TableConfigurationViewProps> = React.memo(({ navigateToPanel }) => {
  const isMobile = useIsMobile();
  const { apiRef, gridSortModel, setGridSortModel, gridColumnVisibilityModel } = useDynamicDataGridContext();
  const allColumns = apiRef.current?.getAllColumns() ?? [];

  const sortableColumns = React.useMemo(() => {
    return allColumns.filter(
      (col) =>
        col.sortable &&
        gridColumnVisibilityModel[col.field] !== false &&
        col.field !== GRID_ROW_GROUPING_SINGLE_GROUPING_FIELD,
    );
  }, [allColumns, gridColumnVisibilityModel]);

  const sortedColumns = React.useMemo(() => {
    return $df
      .data(sortableColumns)
      .withColumns({
        rank: $df.col("field").rank({ dense: true }),
      })
      .sort({ by: ["rank", "headerName", "field"] })
      .drop("rank")
      .toDicts();
  }, [sortableColumns, gridSortModel]);

  const [displayListColumns, setDisplayListColumns] = React.useState<GridColDef[]>(sortedColumns);

  const onListItemDrop = React.useCallback(
    (draggedIndex: number, hoveredIndex: number) => {
      const reorderedList = [...displayListColumns];
      const [draggedItem] = reorderedList.splice(draggedIndex, 1);
      reorderedList.splice(hoveredIndex, 0, draggedItem);

      setDisplayListColumns(reorderedList);

      const updatedKeys = reorderedList.map((c => c.field));

      const nextModel = gridSortModel
        .filter((item => item.sort != null))
        .sort((a, b) => updatedKeys.indexOf(a.field) - updatedKeys.indexOf(b.field));

      setGridSortModel(nextModel);
    },
    [displayListColumns, gridSortModel, setGridSortModel],
  );

  const handleSortDirectionChange = React.useCallback(
    (newDirection: GridSortDirection, field: string) => {
      const currentModel = gridSortModel ?? [];
      const nextModel = currentModel.filter((item => item.field !== field && item.sort != null));

      if (newDirection != null) {
        nextModel.push({ field, sort: newDirection });
      }

      setGridSortModel(nextModel);
    },
    [gridSortModel, setGridSortModel],
  );

  return (
    <>
      <PanelMenuItemHeader
        title={"Sorting Settings"}
        onBackClick={() => {
          navigateToPanel("overviewView", "left");
        }}
      />
      <DraggableList
        onReorder={onListItemDrop}
        getScrollParent={(list) => list.closest(".panel-overflow-container")}
      >
        {displayListColumns.map((c, idx) => (
          <DraggableListItem
            key={c.field}
            index={idx}
            showHandle={true}
          >
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-[12px] px-[12px] flex-1 min-w-0 h-[48px] rounded-[4px]">
              <span className={`whitespace-nowrap ${isMobile ? "overflow-hidden text-ellipsis" : ""}`}>
                {c.headerName}
              </span>
              <DataTypeIndicator dataType={c.type} />
              <SortMethodSelection
                sortingDirection={gridSortModel.find((item => item.field === c.field))?.sort ?? null}
                onChange={(newDirection) => handleSortDirectionChange(newDirection, c.field)}
              />
            </div>
          </DraggableListItem>
        ))}
      </DraggableList>
    </>
  );
});

SortingView.displayName = "SortingView";
*/