import React from "react";
import { DocumentBodyProps } from "./types";
import Cell from "../../../../elements/cell/Cell";

export default function DocumentBody({
  activeCells,
  activeCellId,
  gridConfig,
  ...cellHandlers
}: DocumentBodyProps) {
  return (
    <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
      <div
        className="w-full flex-1 px-4 md:px-8 pt-4 pb-24"
        onDragOver={(e) => cellHandlers.onDragOver?.(e, activeCells.length - 1)}
        onDrop={(e) => cellHandlers.onDrop?.(e, activeCells.length - 1)}
      >
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          {activeCells.map((cell, idx) => (
            <Cell
              key={cell.id}
              cell={cell}
              index={idx}
              isActive={activeCellId === cell.id}
              totalCells={activeCells.length}
              isGridCanvasMode={false}
              gridConfig={gridConfig}
              {...cellHandlers}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
