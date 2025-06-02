import { useState, useCallback } from 'react';

export interface DragItem {
  id: string;
  type: string;
  data: any;
}

export function useDragAndDrop() {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((item: DragItem) => {
    setDraggedItem(item);
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setIsDragging(false);
  }, []);

  const calculatePosition = useCallback((dropX: number, dropZoneRect: DOMRect): number => {
    const relativeX = dropX - dropZoneRect.left;
    const percentage = Math.min(Math.max((relativeX / dropZoneRect.width) * 100, 0), 100);
    return Math.round(percentage);
  }, []);

  return {
    draggedItem,
    isDragging,
    handleDragStart,
    handleDragEnd,
    calculatePosition,
  };
}
