import React from "react";
import { KeyboardArrowRight } from "@mui/icons-material";
import type { ThreadTreeItemProps, ThreadTreeNode, ThreadTreeProps } from "./types";

/**
 * YouTube-style thread item with curved branch connector:
 * A vertical spine running down from the bottom center of the parent avatar,
 * with curved lines turning horizontally into each child avatar.
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
  const isExpandable = Boolean(bodyContent || hasChildren);

  const handleToggle = () => {
    if (isExpandable) {
      onToggle(node.id, node);
    }
  };

  return (
    <div className="relative flex flex-col">
      {/* Main Row */}
      <div className="flex items-start gap-3 relative group">
        {/* Vertical spine running directly from bottom of this avatar circle (top-[30px]) 
            across the FULL height of this entire row (including the expanded body) 
            into the child container (-bottom-3) */}
        {hasChildren && isExpanded && (
          <div className="absolute left-[13.5px] top-[30px] -bottom-3 w-[1px] bg-zinc-700/60 pointer-events-none" />
        )}

        {/* Avatar column */}
        <div className="relative shrink-0 mt-0.5">
          <button
            type="button"
            onClick={handleToggle}
            className={`w-7 h-7 rounded-full bg-[#202225] border border-white/10 hover:border-white/20 flex items-center justify-center shrink-0 select-none transition-colors relative z-10 text-zinc-400 hover:text-zinc-200 ${
              isExpandable ? "cursor-pointer" : "cursor-default"
            }`}
            title={node.badgeTitle}
          >
            <span className="text-[11px] font-mono font-bold">{node.badge ?? "•"}</span>
          </button>
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Header line: label + meta + arrow toggle pill, and right slot */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleToggle}
              className={`inline-flex items-center gap-2 px-3 py-1 -ml-1 rounded-full bg-transparent hover:bg-[#272727] text-zinc-100 select-none transition-colors group/pill press-fdbk flex-wrap ${
                isExpandable ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <span className="font-mono text-[13px] font-semibold text-white truncate">
                {node.label}
              </span>
              {node.headerMeta}
              {isExpandable && (
                <span
                  className={`text-zinc-300 group-hover/pill:text-white flex items-center transition-transform duration-200 ease-out ${
                    isExpanded ? "rotate-90" : "rotate-0"
                  }`}
                >
                  <KeyboardArrowRight className="!text-[22px]" />
                </span>
              )}
            </button>

            {node.headerRight}
          </div>

          {/* Expanded Body (smooth height + fade) */}
          {bodyContent && (
            <div
              className={`grid transition-all duration-200 ease-out ${
                isExpanded
                  ? "grid-rows-[1fr] opacity-100 mt-2 mb-2"
                  : "grid-rows-[0fr] opacity-0 mt-0 mb-0 pointer-events-none"
              }`}
            >
              <div className="overflow-hidden">{bodyContent}</div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies / Child Nodes (smooth height + fade) */}
      {hasChildren && (
        <div
          className={`grid transition-all duration-200 ease-out ${
            isExpanded
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0 pointer-events-none"
          }`}
        >
          <div className="overflow-hidden">
            <div className="relative flex flex-col gap-3 pt-3 pl-10">
              {children.map((childNode, idx) => {
                const isSubLast = idx === children.length - 1;
                return (
                  <div key={childNode.id} className="relative">
                    {/* Curved branch turning horizontally into this child's avatar */}
                    <div className="absolute -left-[26.5px] top-0 w-[26.5px] h-[16px] border-b border-l border-zinc-700/60 rounded-bl-xl pointer-events-none" />
                    {/* Vertical spine continuation only if NOT the last child of this parent */}
                    {!isSubLast && (
                      <div className="absolute -left-[26.5px] top-[16px] bottom-0 w-[1px] bg-zinc-700/60 pointer-events-none" />
                    )}
                    <ThreadTreeItem
                      node={childNode}
                      expandedMap={expandedMap}
                      onToggle={onToggle}
                      renderBody={renderBody}
                      depth={depth + 1}
                    />
                  </div>
                );
              })}
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

  // Sync expanded state if defaultExpandedAll is enabled and nodes change
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
    <div className={`flex flex-col gap-4 ${className}`.trim()}>
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

