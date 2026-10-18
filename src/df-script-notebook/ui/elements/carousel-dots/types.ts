export interface CarouselDotsProps {
  total: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  maxVisible?: number;
  className?: string;
}
