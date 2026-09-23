"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { clsx } from "clsx";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { useId, type ReactNode } from "react";

export type SortableRenderProps = {
  index: number;
  isFirst: boolean;
  isLast: boolean;
  /** Drag handle plus up/down buttons (keyboard- and touch-friendly alternatives to dragging). */
  handle: ReactNode;
};

export function SortableList<T>({
  items,
  getId,
  onReorder,
  renderItem,
  label,
  className,
  disabled,
}: {
  items: T[];
  getId: (item: T) => string;
  onReorder: (items: T[]) => void;
  renderItem: (item: T, props: SortableRenderProps) => ReactNode;
  label: (item: T) => string;
  className?: string;
  disabled?: boolean;
}) {
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    onReorder(arrayMove(items, from, to));
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => getId(i) === active.id);
    const to = items.findIndex((i) => getId(i) === over.id);
    move(from, to);
  };

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        screenReaderInstructions: {
          draggable: "To reorder, press space to pick up an item, use the arrow keys to move it, then press space again to drop it.",
        },
      }}
    >
      <SortableContext items={items.map(getId)} strategy={verticalListSortingStrategy} disabled={disabled}>
        <ul className={clsx("flex flex-col gap-2", className)}>
          {items.map((item, index) => (
            <SortableRow
              key={getId(item)}
              id={getId(item)}
              label={label(item)}
              index={index}
              count={items.length}
              onMove={move}
              disabled={disabled}
            >
              {(handle) => renderItem(item, { index, isFirst: index === 0, isLast: index === items.length - 1, handle })}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  label,
  index,
  count,
  onMove,
  disabled,
  children,
}: {
  id: string;
  label: string;
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  disabled?: boolean;
  children: (handle: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const handle = (
    <div className="flex shrink-0 items-center">
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${label}`}
        className="flex h-10 w-7 cursor-grab touch-none items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 active:cursor-grabbing"
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => onMove(index, index - 1)}
          disabled={index === 0 || disabled}
          aria-label={`Move ${label} up`}
          className="flex h-6 w-8 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30"
        >
          <ChevronUp className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onMove(index, index + 1)}
          disabled={index === count - 1 || disabled}
          aria-label={`Move ${label} down`}
          className="flex h-6 w-8 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30"
        >
          <ChevronDown className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx("relative", isDragging && "z-10 opacity-90 shadow-lg")}
    >
      {children(handle)}
    </li>
  );
}
