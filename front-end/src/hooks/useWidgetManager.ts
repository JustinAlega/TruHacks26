import { useState, useRef, useCallback } from 'react';
import type { WidgetInstance, WidgetType, Position, Size } from '../types';
import { WIDGET_DEFAULT_SIZES } from '../types';

let globalIdCounter = 0;
function generateId(): string {
  return `widget-${Date.now()}-${++globalIdCounter}`;
}

export function useWidgetManager(initialWidgets: WidgetInstance[] = []) {
  const [widgets, setWidgets] = useState<WidgetInstance[]>(initialWidgets);
  const nextZIndex = useRef(initialWidgets.length + 1);

  const addWidget = useCallback(
    (type: WidgetType, data: unknown, position?: Position, size?: Size): string => {
      const id = generateId();
      const resolvedSize = size ?? WIDGET_DEFAULT_SIZES[type];
      const resolvedPosition = position ?? {
        x: 60 + Math.random() * 200,
        y: 60 + Math.random() * 200,
      };

      setWidgets((prev) => [
        ...prev,
        {
          id,
          type,
          data,
          position: resolvedPosition,
          size: resolvedSize,
          zIndex: nextZIndex.current++,
          minimized: false,
        },
      ]);

      return id;
    },
    [],
  );

  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const updatePosition = useCallback((id: string, position: Position) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, position } : w)),
    );
  }, []);

  const bringToFront = useCallback((id: string) => {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, zIndex: nextZIndex.current++ } : w,
      ),
    );
  }, []);

  const toggleMinimize = useCallback((id: string) => {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, minimized: !w.minimized } : w,
      ),
    );
  }, []);

  const updateWidgetData = useCallback((id: string, data: unknown) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, data } : w)),
    );
  }, []);

  return {
    widgets,
    addWidget,
    removeWidget,
    updatePosition,
    bringToFront,
    toggleMinimize,
    updateWidgetData,
  };
}
