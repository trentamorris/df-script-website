/*
import React from "react";
import clsx from "clsx";

import {
  ColumnsPanelTrigger,
  ColumnsPanelTriggerProps,
  ExportExcel,
  ExportExcelProps,
  ExportPrint,
  ExportPrintProps,
  FilterPanelTrigger,
  FilterPanelTriggerProps,
  GridExcelJsProcessInput,
  PivotPanelTrigger,
  PivotPanelTriggerProps,
  Toolbar,
} from "@mui/x-data-grid";
import { ROW_GRAND_TOTAL_FIELD_NAME } from "../../dynamicDataGridConstants";
import { formatNumericValues, toValidNumber } from "../../../utils/dataUtils";
import { ViewMetaDataMap } from "../table-config/dynamicDataGridTableConfigTypes";
import { useDynamicDataGridContext } from "../../DynamicDataGrid";
import PanelNavigation from "../../../panel-navigation/PanelNavigation";
import { NavigationPanelItem } from "../../../panel-navigation/types";
import {
  applyRowGroupExpansion,
  isRowGroupExpansionApplied,
  exportToCsv,
  preProcessExcelExportContent,
  autosizeAllColumns,
} from "../../dynamicDataGridUtils";
import {
  ColumnView,
  FilterView,
  GroupingView,
  OverviewView,
  SortingView,
  RowGroupingColumnModeView,
} from "../table-config/DynamicDataGridTableConfig";
import { GridToolbarCommentsButtonProps, GridToolbarExpandCollapseAllButtonProps } from "./dynamicDataGridToolbarTypes";
import { GridToolbarButtonContainerProps } from "../../../sections/shared/data-grid-panels/dataGridPanelTypes";
import { useIsMobile } from "root/app/hooks/useIsMobile";

import { Button, ButtonProps, SxProps, Theme, Modal, Tooltip, Slide, SwipeableDrawer, CircularProgress, Menu, MenuItem } from "@mui/material";
import {
  UnfoldLess,
  UnfoldMore,
  FileDownloadOutlined,
  PrintOutlined,
  FilterListOutlined,
  ViewColumnOutlined,
  PivotTableChartOutlined,
  CodeOutlined,
  Close,
  ContentCopy,
  ViewSidebarOutlined,
  Segment,
  ViewColumnSharp,
  Settings,
  SortSharp,
  TableRows,
  FitScreen,
  Fullscreen,
  FullscreenExit,
  Send,
  CommentRounded,
  MoreVert,
} from "@mui/icons-material";

// Shared toolbar button

const gridToolbarButtonSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50px",
  border: "1px solid",
  borderColor: "divider",
  fontSize: "0.7rem",
  fontWeight: 500,
  lineHeight: 1,
  textTransform: "none",
  whiteSpace: "nowrap",
  px: "8px",
  py: "6px",
  m: 0,
  minHeight: "unset",
  minWidth: "unset",
  gap: "0.25rem",
  color: "text.primary",
};

export const GridToolbarButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, sx, ...rest }, ref) => (
    <Button
      ref={ref}
      className={clsx("grid-toolbar-btn", className)}
      sx={{ ...gridToolbarButtonSx, ...sx } as SxProps<Theme>}
      {...rest}
    >
      {children}
    </Button>
  ),
);

GridToolbarButton.displayName = "GridToolbarButton";

const SwipeableDrawerDragHandle: React.FC = () => (
  <div className="flex items-center justify-center pt-[8px] pb-[4px]">
    <div className="w-[36px] h-[4px] rounded-full bg-[var(--mui-palette-text-disabled)]" />
  </div>
);

export const GridToolbarButtonContainer = React.forwardRef<HTMLDivElement, GridToolbarButtonContainerProps>(
  ({ className, children, scrollableCanvasProps, rightSlot, ...rest }, ref) => {
    return (
      <Toolbar
        ref={ref}
        className={className}
        {...rest}
      >
        <div className="relative flex-1 min-w-0 h-full">
          <div className="absolute inset-0">
            <ScrollableCanvas
              className={clsx(
                "grid-toolbar-btn-container",
                "flex !flex-nowrap items-center justify-end m-0 p-0 mt-[0.25rem] mb-[0.5rem]",
                className,
              )}
              {...scrollableCanvasProps}
            >
              {children}
            </ScrollableCanvas>
          </div>
        </div>
        {rightSlot}
      </Toolbar>
    );
  },
);
GridToolbarButtonContainer.displayName = "GridToolbarButtonContainer";

export const GridToolbarExportExcelButton = React.forwardRef<HTMLButtonElement, Omit<ExportExcelProps, "render">>(
  ({ options, ...rest }, ref) => {
    const { rows, gridPivotModel } = useDynamicDataGridContext();
    const pivotColumns = gridPivotModel?.columns?.map((r) => r.field) ?? [];

    const filteredData = React.useMemo(() => {
      return (rows ?? [])
        .filter((row) => pivotColumns.every((field) => row[field] !== ROW_GRAND_TOTAL_FIELD_NAME))
        .map((row) => Object.fromEntries(Object.entries(row).filter(([key]) => key !== "id")));
    }, [rows, pivotColumns]);

    const handleExcelJsPostProcess = React.useCallback(
      async ({ workbook }: GridExcelJsProcessInput) => {
        preProcessExcelExportContent({ workbook, data: filteredData });
      },
      [filteredData],
    );

    return (
      <ExportExcel
        render={
          <GridToolbarButton ref={ref}>
            <FileDownloadOutlined fontSize="small" />
            <span>Export Excel</span>
          </GridToolbarButton>
        }
        options={{
          fileName: "desk-level-reporting-export",
          ...options,
          exceljsPostProcess: handleExcelJsPostProcess,
        }}
        {...rest}
      />
    );
  },
);
GridToolbarExportExcelButton.displayName = "GridToolbarExportExcelButton";

export const GridToolbarExportCsvButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ onClick, ...rest }, ref) => {
    const { rows, gridPivotModel } = useDynamicDataGridContext();
    const pivotColumns = gridPivotModel?.columns?.map((r) => r.field) ?? [];

    const filteredData = React.useMemo(() => {
      return (rows ?? [])
        .filter((row) => pivotColumns.every((field) => row[field] !== ROW_GRAND_TOTAL_FIELD_NAME))
        .map((row) => Object.fromEntries(Object.entries(row).filter(([key]) => key !== "id")));
    }, [rows, pivotColumns]);

    const handleExportCsv = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        exportToCsv({ data: filteredData });
        onClick?.(e);
      },
      [filteredData, onClick],
    );

    return (
      <GridToolbarButton
        ref={ref}
        onClick={handleExportCsv}
        {...rest}
      >
        <FileDownloadOutlined fontSize="small" />
        <span>Export CSV</span>
      </GridToolbarButton>
    );
  },
);

GridToolbarExportCsvButton.displayName = "GridToolbarExportCsvButton";

export const GridToolbarExportPrintButton = React.forwardRef<HTMLButtonElement, Omit<ExportPrintProps, "render">>(
  (props, ref) => {
    return (
      <ExportPrint
        render={(
          <GridToolbarButton ref={ref}>
            <PrintOutlined fontSize="small" />
            <span>Print</span>
          </GridToolbarButton>
        )}
        {...props}
      />
    );
  },
);

GridToolbarExportPrintButton.displayName = "GridToolbarExportPrintButton";

export const GridToolbarFilterPanelButton = React.forwardRef<
  HTMLButtonElement,
  Omit<FilterPanelTriggerProps, "render">
>((props, ref) => {
  const { gridFilterModel } = useDynamicDataGridContext();
  const activeFilterCount = gridFilterModel?.items?.length ?? 0;
  const isActive = activeFilterCount > 0;
  const activeRing = "inset 0 0 0 2px var(--draggable-color)";

  return (
    <FilterPanelTrigger
      render={(
        <GridToolbarButton
          ref={ref}
          sx={{
            isActive
            ? {
          ...gridToolbarButtonSx,
          boxShadow: activeRing,
                  "&:focus, &:active, &:hover": { boxShadow: activeRing },
}
              : undefined
          }}
        >
          <FilterListOutlined fontSize="small" />
          <span>Filters{isActive ? ` (${activeFilterCount})` : ""}</span>
        </GridToolbarButton >
      )}
{...props }
    />
  );
});

GridToolbarFilterPanelButton.displayName = "GridToolbarFilterPanelButton";

export const GridToolbarColumnsPanelButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ColumnsPanelTriggerProps, "render">
>((props, ref) => {
  return (
    <ColumnsPanelTrigger
      render={(
        <GridToolbarButton ref={ref}>
          <ViewColumnOutlined fontSize="small" />
          <span>Columns</span>
        </GridToolbarButton>
      )}
      {...props}
    />
  );
});

GridToolbarColumnsPanelButton.displayName = "ColumnsPanelButton";

export const GridToolbarPivotPanelButton = React.forwardRef<
  HTMLButtonElement,
  Omit<PivotPanelTriggerProps, "render">
>((props, ref) => {
  return (
    <PivotPanelTrigger
      render={(
        <GridToolbarButton ref={ref}>
          <PivotTableChartOutlined fontSize="small" />
          <span>Pivot</span>
        </GridToolbarButton>
      )}
      {...props}
    />
  );
});

GridToolbarPivotPanelButton.displayName = "GridToolbarPivotPanelButton";

export const GridToolbarAutosizeColumnsButton = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { apiRef } = useDynamicDataGridContext();

  const handleAutosize = React.useCallback(() => {
    window.requestAnimationFrame(() => {
      autosizeAllColumns({ apiRef });
    });
  }, [apiRef]);

  return (
    <GridToolbarButton
      ref={ref}
      onClick={handleAutosize}
      {...props}
    >
      <FitScreen fontSize="small" />
      <span>Auto-size Columns</span>
    </GridToolbarButton>
  );
});

GridToolbarAutosizeColumnsButton.displayName = "GridToolbarAutosizeColumnsButton";

// Fullscreen helpers

type VendorPrefixedElement = HTMLElement & Record<string, (() => Promise<void> | void) | undefined>;
type VendorPrefixedDocument = Document & Record<string, Element | (() => Promise<void> | void) | null | undefined>;

const FULLSCREEN_CHANGE_EVENTS = ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"];
const FULLSCREEN_ELEMENT_PROPS = ["fullscreenElement", "webkitFullscreenElement", "mozFullScreenElement", "msFullscreenElement"];
const REQUEST_FULLSCREEN_METHODS = ["requestFullscreen", "webkitRequestFullscreen", "webkitRequestFullScreen", "mozRequestFullScreen", "msRequestFullscreen"];
const EXIT_FULLSCREEN_METHODS = ["exitFullscreen", "webkitExitFullscreen", "webkitCancelFullScreen", "mozCancelFullScreen", "msExitFullscreen"];

const getFullscreenElement = (): Element | null => {
  if (typeof document === "undefined") return null;
  const doc = document as VendorPrefixedDocument;
  return (FULLSCREEN_ELEMENT_PROPS.map(prop => doc[prop]).find(Boolean) as Element | undefined) ?? null;
};

const callFirstSupportedMethod = (target: VendorPrefixedElement | VendorPrefixedDocument, methodNames: string[]): Promise<void> => {
  const method = methodNames.map(name => target[name]).find(fn => typeof fn === "function") as
    | (() => Promise<void> | void)
    | undefined;

  if (!method) return Promise.reject(new Error("Fullscreen API is not supported"));
  return Promise.resolve(method.call(target));
};

const requestElementFullscreen = (el: HTMLElement): Promise<void> =>
  callFirstSupportedMethod(el as VendorPrefixedElement, REQUEST_FULLSCREEN_METHODS);

const exitElementFullscreen = (): Promise<void> =>
  getFullscreenElement() ? callFirstSupportedMethod(document as VendorPrefixedDocument, EXIT_FULLSCREEN_METHODS) : Promise.resolve();

export const GridToolbarFullscreenButton = React.forwardRef<HTMLButtonElement, ButtonProps>(({ onClick, ...rest }, ref) => {
  const { apiRef, isFallbackFullscreen, setIsFallbackFullscreen, isNativeFullscreen, setIsNativeFullscreen } =
    useDynamicDataGridContext();
  const isMobile = useIsMobile();

  const isFullscreen = isNativeFullscreen || isFallbackFullscreen;

  React.useEffect(() => {
    const handleFullscreenChange = async () => {
      const inFullscreen = Boolean(getFullscreenElement());
      setIsNativeFullscreen(inFullscreen);

      const orientationApi = screen?.orientation as
        | (ScreenOrientation & { lock?: (orientation: string) => Promise<void>; unlock?: () => void })
        | undefined;

      try {
        if (inFullscreen && isMobile) await orientationApi?.lock?.("landscape-primary");
        else if (!inFullscreen) orientationApi?.unlock?.();
      } catch {
        // Orientation lock/unlock is best-effort and unsupported on some browsers
      }
    };

    FULLSCREEN_CHANGE_EVENTS.forEach(evt => document.addEventListener(evt, handleFullscreenChange));
    return () => FULLSCREEN_CHANGE_EVENTS.forEach(evt => document.removeEventListener(evt, handleFullscreenChange));
  }, [isMobile]);

  const handleToggleFullscreen = React.useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    const rootEl = apiRef.current?.rootElementRef?.current;
    if (!rootEl) return;

    if (isFallbackFullscreen) {
      setIsFallbackFullscreen(false);
      onClick?.(event);
      return;
    }

    try {
      if (getFullscreenElement()) await exitElementFullscreen();
      else await requestElementFullscreen(rootEl);
    } catch {
      // Fullscreen API unsupported/denied (e.g. iOS Safari) - use the portaled fixed-position fallback
      setIsFallbackFullscreen(true);
    }

    onClick?.(event);
  }, [apiRef, isFallbackFullscreen, setIsFallbackFullscreen, onClick]);

  const label = isFullscreen ? "Exit Fullscreen" : "Fullscreen";

  return (
    <Tooltip
      title={label}
      enterDelay={300}
    >
      <GridToolbarButton
        ref={ref}
        onClick={handleToggleFullscreen}
        aria-label={label}
        aria-pressed={isFullscreen}
        sx={{ px: (gridToolbarButtonSx as Record<string, string>)?.py ?? "6px" }}
        {...rest}
      >
        {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
      </GridToolbarButton>
    </Tooltip>
  );
});

GridToolbarFullscreenButton.displayName = "GridToolbarFullscreenButton";

// Custom Buttons

export const GridToolbarExpandCollapseAllButton = React.forwardRef<
  HTMLButtonElement,
  GridToolbarExpandCollapseAllButtonProps
>(
  (
    {
      target = { scope: "all" },
      expandLabel = "Expand all rows",
      collapseLabel = "Collapse all rows",
      className,
      onToggle,
      onClick,
      ...rest
    },
    ref,
  ) => {
    const { apiRef, gridRowExpansionModel, gridPivotModel, isPivotActive } = useDynamicDataGridContext();
    const allExpanded = React.useMemo(
      () => isRowGroupExpansionApplied({ apiRef, gridRowExpansionModel, target }),
      [apiRef, gridRowExpansionModel, target],
    );

    const isDisabled = React.useMemo(() => {
      const activePivotRowCount = gridPivotModel?.rows?.filter((r => !r.hidden))?.length ?? 0;
      return isPivotActive && activePivotRowCount <= 1;
    }, [isPivotActive, gridPivotModel?.rows]);

    const handleToggle = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        const nextExpanded = !allExpanded;
        applyRowGroupExpansion({ apiRef, expand: nextExpanded, target });
        onToggle?.(nextExpanded);
        onClick?.(e);
      },
      [apiRef, allExpanded, target, onToggle, onClick],
    );

    const label = allExpanded ? collapseLabel : expandLabel;

    return (
      <GridToolbarButton
        ref={ref}
        className={className}
        disabled={isDisabled}
        onClick={handleToggle}
        {...rest}
      >
        {allExpanded ? <UnfoldLess fontSize="small" /> : <UnfoldMore fontSize="small" />}
        <span>{label}</span>
      </GridToolbarButton>
    );
  },
);

GridToolbarExpandCollapseAllButton.displayName = "GridToolbarExpandCollapseAllButton";

export const GridToolbarSidePanelToggleButton = React.forwardRef<
  HTMLButtonElement,
  GridToolbarExpandCollapseAllButtonProps
>(({ onClick, ...rest }, ref) => {
  const { sidePanelContent, isSidePanelOpen, setIsSidePanelOpen } = useDynamicDataGridContext();
  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsSidePanelOpen((prev) => !prev);
      onClick?.(e);
    },
    [sidePanelContent, setIsSidePanelOpen, onClick],
  );

  return (
    <GridToolbarButton
      ref={ref}
      onClick={handleClick}
      {...rest}
    >
      <ViewSidebarOutlined fontSize="small" />
      <span>{isSidePanelOpen ? "Hide Side Panel" : "Show Side Panel"}</span>
    </GridToolbarButton>
  );
});

GridToolbarSidePanelToggleButton.displayName = "GridToolbarSidePanelToggleButton";

export const GridToolbarExportEmailButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ onClick, ...rest }, ref) => {
    const [isOpeningEmail, setIsOpeningEmail] = React.useState(false);

    React.useEffect(() => {
      if (!isOpeningEmail) return;

      const handleWindowBlur = () => {
        setIsOpeningEmail(false);
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          setIsOpeningEmail(false);
        }
      };

      window.addEventListener("blur", handleWindowBlur);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        window.removeEventListener("blur", handleWindowBlur);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }, [isOpeningEmail]);

    const handleOnClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isOpeningEmail) {
          setIsOpeningEmail(false);
          return;
        }

        setIsOpeningEmail(true);
        onClick?.(e);

        const currentUrl = window.location.href;
        const emailBody = encodeURIComponent(`Open this page:\n\n${currentUrl}`);

        window.requestAnimationFrame(() => {
          window.location.href = `mailto:?body=${emailBody}`;
        });
      },
      [isOpeningEmail, onClick],
    );

    return (
      <GridToolbarButton
        ref={ref}
        onClick={handleOnClick}
        aria-label={isOpeningEmail ? "Cancel opening email" : "Open email client"}
        title={isOpeningEmail ? "Click again to cancel" : "Open email client"}
        {...rest}
      >
        {isOpeningEmail ? <CircularProgress size={14} color="inherit" /> : <Send fontSize="small" />}
        <span>{isOpeningEmail ? "Opening Email..." : "Export Email"}</span>
      </GridToolbarButton>
    );
  },
);

GridToolbarExportEmailButton.displayName = "GridToolbarExportEmailButton";

export const GridToolbarTableConfigMenuButton = React.forwardRef<HTMLButtonElement, ButtonProps>(({ sx, ...rest }, ref) => {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement | null>(null);

  const items: NavigationPanelItem[] = React.useMemo(
    () => [
      {
        id: "rowGroupingColumnMode",
        label: "Row Grouping Mode",
        icon: <TableRows fontSize="small" />,
        subPanel: <RowGroupingColumnModeView />,
      },
      {
        id: "groupingView",
        label: "Grouping Configuration",
        icon: <Segment fontSize="small" />,
        subPanel: <GroupingView />,
      },
      {
        id: "columnView",
        label: "Column Configuration",
        icon: <ViewColumnSharp fontSize="small" />,
        subPanel: <ColumnView />,
      },
      {
        id: "filterView",
        label: "Filter Configuration",
        icon: <FilterListOutlined fontSize="small" />,
        subPanel: <FilterView />,
      },
      {
        id: "sortingView",
        label: "Sorting Configuration",
        icon: <SortSharp fontSize="small" />,
        subPanel: <SortingView />,
      },
    ],
    [],
  );

  return (
    <>
      <GridToolbarButton
        ref={(node) => {
          anchorRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          }
        }}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="table configuration"
        title="Table configuration"
        sx={{ p: "6px", display: "flex", alignItems: "center", justifyContent: "center", ...sx }}
        {...rest}
      >
        <Settings fontSize="small" />
      </GridToolbarButton>
      <PanelNavigation
        isOpen={open}
        onClose={() => setOpen(false)}
        anchorEl={anchorRef.current}
        title="Table Configuration"
        items={items}
        placement="bottom-end"
      />
    </>
  );
});

GridToolbarTableConfigMenuButton.displayName = "GridTableConfigMenuButton";
*/