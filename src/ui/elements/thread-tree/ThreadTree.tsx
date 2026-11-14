import React from "react";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import type { ThreadTreeItemProps, ThreadTreeNode, ThreadTreeProps } from "./types";

/**
 * YouTube-style thread item with smooth collapsible transitions:
 * - Single continuous SVG vector path starts directly at the parent avatar (y = parentBottom)
 *   and draws the entire spine, all child branch curves, and the bottom collapse button.
 * - Entire SVG structure highlights synchronously on hover.
 * - Interactive spine hit-target toggles thread on click.
 */
export function ThreadTreeItem<T = unknown>({
  node,
  expandedMap,
  onToggle,
  renderBody,
  depth = 0,
}: ThreadTreeItemProps<T>) {
  const isExpanded = Boolean(expandedMap[node.id]);
  const children = node.children ?? [];
  const hasChildren = children.length > 0;
  const bodyContent = renderBody ? renderBody(node, depth) : node.body;

  const [isSpineHovered, setIsSpineHovered] = React.useState(false);

  const handleToggle = () => {
    onToggle(node.id, node);
  };

  const isTopLevel = depth === 0;
  const avatarSizeClass = isTopLevel ? "w-8 h-8" : "w-6 h-6";
  const avatarTextClass = isTopLevel ? "text-[12px]" : "text-[10px]";
  const countLabel = children.length === 1 ? "1 property" : `${children.length} properties`;

  // References for dynamic vector coordinates
  const avatarRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const childRowRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const bottomButtonRef = React.useRef<HTMLDivElement>(null);
  const condensedButtonRef = React.useRef<HTMLButtonElement>(null);

  const [fullPath, setFullPath] = React.useState<string>("");

  const updateSvgPath = React.useCallback(() => {
    if (!hasChildren || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const spineX = 16; // Center line of parent avatar (32px / 2 = 16px)

    // Start 4px below parent avatar circle
    let startY = 36;
    if (avatarRef.current) {
      const avatarRect = avatarRef.current.getBoundingClientRect();
      startY = avatarRect.bottom - containerRect.top + 4;
    }

    if (!isExpanded) {
      // Condensed state: dynamic single L-curve from parent avatar down and curving into the "N properties v" button
      let btnCenterY = startY + 24;
      if (condensedButtonRef.current) {
        const btnRect = condensedButtonRef.current.getBoundingClientRect();
        btnCenterY = btnRect.top - containerRect.top + btnRect.height / 2;
      }
      const branchEndX = 39;
      const radius = 14;

      let path = `M ${spineX} ${startY}`;
      path += ` L ${spineX} ${btnCenterY - radius}`;
      path += ` C ${spineX} ${btnCenterY - 4}, ${spineX + 4} ${btnCenterY}, ${spineX + radius} ${btnCenterY}`;
      path += ` L ${branchEndX} ${btnCenterY}`;

      setFullPath(path);
      return;
    }

    // Expanded state: full continuous spine connecting all children and the collapse button
    let path = `M ${spineX} ${startY}`;

    children.forEach((_, idx) => {
      const rowEl = childRowRefs.current[idx];
      if (rowEl) {
        const rowRect = rowEl.getBoundingClientRect();
        const avatarCenterY = rowRect.top - containerRect.top + 14;
        const branchEndX = 39;
        const radius = 14;

        path += ` L ${spineX} ${avatarCenterY - radius}`;
        path += ` C ${spineX} ${avatarCenterY - 4}, ${spineX + 4} ${avatarCenterY}, ${spineX + radius} ${avatarCenterY}`;
        path += ` L ${branchEndX} ${avatarCenterY}`;
        path += ` M ${spineX} ${avatarCenterY - radius}`;
      }
    });

    if (bottomButtonRef.current) {
      const btnRect = bottomButtonRef.current.getBoundingClientRect();
      const btnCenterY = btnRect.top - containerRect.top + btnRect.height / 2;
      const btnEndX = 36;
      const radius = 14;

      path += ` L ${spineX} ${btnCenterY - radius}`;
      path += ` C ${spineX} ${btnCenterY - 4}, ${spineX + 4} ${btnCenterY}, ${spineX + radius} ${btnCenterY}`;
      path += ` L ${btnEndX} ${btnCenterY}`;
    }

    setFullPath(path);
  }, [hasChildren, children, isExpanded]);

  React.useLayoutEffect(() => {
    updateSvgPath();

    if (!containerRef.current || typeof ResizeObserver === "undefined") return;

    let rafId: number | null = null;
    const observer = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        updateSvgPath();
      });
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isExpanded, updateSvgPath, children.length, bodyContent]);

  return (
    <div ref={containerRef} className="relative flex flex-col">
      {/* Single continuous vector path for the entire tree (both expanded full tree and condensed L-curve) */}
      {hasChildren && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-20" fill="none">
          {/* Invisible hit-target stroke for seamless hover and clicking over the entire tree */}
          {fullPath && (
            <path
              d={fullPath}
              stroke="transparent"
              strokeWidth="28"
              className="cursor-pointer pointer-events-auto"
              onClick={handleToggle}
              onMouseEnter={() => setIsSpineHovered(true)}
              onMouseLeave={() => setIsSpineHovered(false)}
            />
          )}

          {/* Visible vector stroke: uniform 1px vectorEffect stroke with zero seams */}
          {fullPath && (
            <path
              d={fullPath}
              stroke={isSpineHovered ? "rgba(255, 255, 255, 0.45)" : "rgba(255, 255, 255, 0.16)"}
              strokeWidth="1"
              className="transition-colors duration-150"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      )}

      {/* Main Row */}
      <div className="flex items-start gap-3 relative group">
        {/* Avatar column */}
        <div className="relative shrink-0 mt-0.5">
          <div
            ref={avatarRef}
            className={`${avatarSizeClass} rounded-full bg-[#202225] flex items-center justify-center shrink-0 select-none relative z-10 text-zinc-300 font-bold ${avatarTextClass}`}
            title={node.badgeTitle}
          >
            <span>{node.badge ?? "•"}</span>
          </div>
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header row: parameter name + metadata badges + source link */}
          <div className="flex items-center justify-between gap-2 flex-wrap min-h-[28px]">
            <div className="inline-flex items-center gap-2 flex-wrap">
              <span className="text-[13.5px] font-semibold text-white tracking-tight">
                {node.label}
              </span>
              {node.headerMeta}
            </div>

            {node.headerRight}
          </div>

          {/* Description & Type info (Inline, flat text) */}
          {bodyContent && (
            <div className="mt-1 text-zinc-300 text-[13px] leading-relaxed select-text">
              {bodyContent}
            </div>
          )}

          {/* Condensed State: Button to expand */}
          {hasChildren && !isExpanded && (
            <div className="relative mt-2.5">
              <div>
                <button
                  ref={condensedButtonRef}
                  type="button"
                  onClick={handleToggle}
                  onMouseEnter={() => setIsSpineHovered(true)}
                  onMouseLeave={() => setIsSpineHovered(false)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold text-white hover:bg-white/10 active:bg-white/15 transition-colors select-none cursor-pointer"
                >
                  <span>{countLabel}</span>
                  <KeyboardArrowDown className="!text-[18px] text-white" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded State: Smooth Collapsible Grid Container */}
      {hasChildren && isExpanded && (
        <div
          className="grid grid-rows-[1fr] opacity-100 transition-all duration-250 ease-out"
          onTransitionEnd={() => {
            if (isExpanded) updateSvgPath();
          }}
        >
          <div className="overflow-hidden">
            <div className="relative flex flex-col pt-3 pl-11">

              {children.map((childNode, idx) => (
                <div
                  key={childNode.id}
                  ref={(el) => {
                    childRowRefs.current[idx] = el;
                  }}
                  className="relative pb-4"
                >
                  <ThreadTreeItem
                    node={childNode}
                    expandedMap={expandedMap}
                    onToggle={onToggle}
                    renderBody={renderBody}
                    depth={depth + 1}
                  />
                </div>
              ))}

              {/* Bottom "Hide properties ∧" Button */}
              <div ref={bottomButtonRef} className="relative pt-0.5 pb-1">
                <button
                  type="button"
                  onClick={handleToggle}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold text-white hover:bg-white/10 active:bg-white/15 transition-colors select-none cursor-pointer"
                >
                  <span>Hide {children.length === 1 ? "property" : "properties"}</span>
                  <KeyboardArrowUp className="!text-[18px] text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function _collectAllNodeIds<T>(nodes: ThreadTreeNode<T>[]): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  function walk(items: ThreadTreeNode<T>[]) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      map[item.id] = true;
      if (item.children && item.children.length > 0) {
        walk(item.children);
      }
    }
  }
  walk(nodes);
  return map;
}

export function ThreadTree<T = unknown>({
  nodes,
  expandedMap: controlledExpandedMap,
  defaultExpandedMap = {},
  defaultExpandedAll = false,
  onToggle,
  renderBody,
  className = "",
}: ThreadTreeProps<T>) {
  const [internalExpandedMap, setInternalExpandedMap] =
    React.useState<Record<string, boolean>>(() =>
      defaultExpandedAll ? _collectAllNodeIds(nodes) : defaultExpandedMap
    );

  React.useEffect(() => {
    if (defaultExpandedAll) {
      setInternalExpandedMap(_collectAllNodeIds(nodes));
    }
  }, [nodes, defaultExpandedAll]);

  const isControlled = controlledExpandedMap !== undefined;
  const activeExpandedMap = isControlled ? controlledExpandedMap : internalExpandedMap;

  const handleToggle = React.useCallback(
    (id: string, node: ThreadTreeNode<T>) => {
      if (!isControlled) {
        setInternalExpandedMap((prev) => ({
          ...prev,
          [id]: !prev[id],
        }));
      }
      if (onToggle) {
        onToggle(id, node);
      }
    },
    [isControlled, onToggle]
  );

  return (
    <div className={`flex flex-col gap-6 ${className}`.trim()}>
      {nodes.map((node) => (
        <ThreadTreeItem
          key={node.id}
          node={node}
          expandedMap={activeExpandedMap}
          onToggle={handleToggle}
          renderBody={renderBody}
        />
      ))}
    </div>
  );
}
