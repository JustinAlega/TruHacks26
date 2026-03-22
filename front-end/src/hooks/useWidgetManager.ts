/**
 * useWidgetManager — manages the draggable widget instances on the HUD canvas.
 *
 * New widgets are auto-placed using a 3×2 grid-zone algorithm so they tile
 * evenly across the viewport without overlapping the VoiceOrb at the bottom.
 */
import { useState, useRef, useCallback } from 'react';
import type { WidgetInstance, WidgetType, Position, Size } from '../types';
import { WIDGET_DEFAULT_SIZES } from '../types';

let globalIdCounter = 0;
function generateId(): string {
  return `widget-${Date.now()}-${++globalIdCounter}`;
}

// Grid-zone auto-placement: 3 columns × 2 rows, cycling through zones
const ZONE_COLS = 3;
const ZONE_ROWS = 2;
const ZONE_COUNT = ZONE_COLS * ZONE_ROWS;
const ZONE_PADDING = 20;
const ZONE_JITTER = 20;
const VOICE_ORB_MARGIN = 150; // px from bottom to avoid VoiceOrb

/** Pick a viewport position for the next widget by centering it in its assigned zone + jitter. */
function getZonePosition(zoneIndex: number, widgetWidth: number, widgetHeight: number): Position {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const usableH = vh - VOICE_ORB_MARGIN;

  const col = zoneIndex % ZONE_COLS;
  const row = Math.floor(zoneIndex / ZONE_COLS);

  const zoneW = vw / ZONE_COLS;
  const zoneH = usableH / ZONE_ROWS;

  // Center the widget within its zone, then add jitter
  const jitterX = (Math.random() * 2 - 1) * ZONE_JITTER;
  const jitterY = (Math.random() * 2 - 1) * ZONE_JITTER;
  let x = col * zoneW + (zoneW - widgetWidth) / 2 + jitterX;
  let y = row * zoneH + (zoneH - widgetHeight) / 2 + jitterY;

  // Clamp within viewport bounds
  x = Math.max(ZONE_PADDING, Math.min(x, vw - widgetWidth - ZONE_PADDING));
  y = Math.max(ZONE_PADDING, Math.min(y, usableH - widgetHeight - ZONE_PADDING));

  return { x, y };
}

export function useWidgetManager(initialWidgets: WidgetInstance[] = []) {
  const [widgets, setWidgets] = useState<WidgetInstance[]>(initialWidgets);
  const nextZIndex = useRef(initialWidgets.length + 1);
  const nextZoneIndex = useRef(0);

  const addWidget = useCallback(
    (type: WidgetType, data: unknown, position?: Position, size?: Size): string => {
      const id = generateId();
      const resolvedSize = size ?? WIDGET_DEFAULT_SIZES[type];
      const resolvedPosition = position ?? getZonePosition(
        nextZoneIndex.current++ % ZONE_COUNT,
        resolvedSize.width,
        resolvedSize.height,
      );

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
