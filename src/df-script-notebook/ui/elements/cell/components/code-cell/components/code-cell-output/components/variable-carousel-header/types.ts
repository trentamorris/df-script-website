import { VariableDisplayItem } from "../../types";

export interface VariableCarouselHeaderProps {
  items: VariableDisplayItem[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  status?: "running" | "error" | "success";
  canCopy?: boolean;
  copied?: boolean;
  onCopy?: () => void;
  loop?: boolean;
}
