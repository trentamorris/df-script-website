import type React from "react";

export interface ThreadTreeNode<T = unknown> {
  id: string;
  label: React.ReactNode;
  badge?: React.ReactNode;
  badgeTitle?: string;
  headerMeta?: React.ReactNode;
  headerRight?: React.ReactNode;
  body?: React.ReactNode;
  data?: T;
  children?: ThreadTreeNode<T>[];
}

export interface ThreadTreeItemProps<T = unknown> {
  node: ThreadTreeNode<T>;
  expandedMap: Record<string, boolean>;
  onToggle: (id: string, node: ThreadTreeNode<T>) => void;
  renderBody?: (node: ThreadTreeNode<T>, depth: number) => React.ReactNode;
  depth?: number;
}

export interface ThreadTreeProps<T = unknown> {
  nodes: ThreadTreeNode<T>[];
  expandedMap?: Record<string, boolean>;
  defaultExpandedMap?: Record<string, boolean>;
  defaultExpandedAll?: boolean;
  onToggle?: (id: string, node: ThreadTreeNode<T>) => void;
  renderBody?: (node: ThreadTreeNode<T>, depth: number) => React.ReactNode;
  className?: string;
}

