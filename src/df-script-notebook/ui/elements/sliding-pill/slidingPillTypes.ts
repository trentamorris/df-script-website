import React from "react";

export type SlidingPillOption<T> = {
  value: T;
  label: React.ReactNode;
};

export type SlidingPillProps<T> = {
  options: SlidingPillOption<T>[];
  activeValue: T;
  onChange: (next: T) => void;
  height?: number;
  radius?: number | string;
};
