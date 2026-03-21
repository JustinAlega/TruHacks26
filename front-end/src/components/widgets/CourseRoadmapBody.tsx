import { useMemo } from 'react';
import {
  ReactFlow,
  type Node,
  type Edge,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { CourseRoadmapData, CourseNodeStatus } from '../../types';
import './CourseRoadmapBody.css';

const STATUS_COLORS: Record<CourseNodeStatus, { bg: string; border: string; text: string }> = {
  completed:   { bg: 'rgba(0, 106, 106, 0.15)', border: '#4dd9da',  text: '#93f2f2' },
  in_progress: { bg: 'rgba(0, 25, 68, 0.2)',    border: '#adc6ff',  text: '#d6e3ff' },
  available:   { bg: 'rgba(255, 255, 255, 0.06)', border: '#73777c', text: '#a0a8b8' },
  locked:      { bg: 'rgba(255, 255, 255, 0.02)', border: '#3a4358', text: '#6b7588' },
};

const STATUS_LABELS: Record<CourseNodeStatus, string> = {
  completed: 'Done',
  in_progress: 'Current',
  available: 'Available',
  locked: 'Locked',
};

function layoutNodes(roadmap: CourseRoadmapData): { nodes: Node[]; edges: Edge[] } {
  const { nodes: courseNodes, edges: courseEdges } = roadmap;

  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  for (const n of courseNodes) {
    inDegree.set(n.id, 0);
    adjList.set(n.id, []);
  }
  for (const e of courseEdges) {
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
    adjList.get(e.source)?.push(e.target);
  }

  const layers: string[][] = [];
  let queue = courseNodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0).map((n) => n.id);
  const visited = new Set<string>();

  while (queue.length > 0) {
    layers.push(queue);
    const next: string[] = [];
    for (const id of queue) {
      visited.add(id);
      for (const child of adjList.get(id) ?? []) {
        inDegree.set(child, (inDegree.get(child) ?? 0) - 1);
        if ((inDegree.get(child) ?? 0) === 0 && !visited.has(child)) {
          next.push(child);
        }
      }
    }
    queue = next;
  }

  const nodeMap = new Map(courseNodes.map((n) => [n.id, n]));
  const X_GAP = 180;
  const Y_GAP = 90;

  const flowNodes: Node[] = [];
  for (let col = 0; col < layers.length; col++) {
    const layer = layers[col];
    const totalHeight = (layer.length - 1) * Y_GAP;
    const startY = -totalHeight / 2;

    for (let row = 0; row < layer.length; row++) {
      const cn = nodeMap.get(layer[row]);
      if (!cn) continue;
      const colors = STATUS_COLORS[cn.status];

      flowNodes.push({
        id: cn.id,
        position: { x: col * X_GAP, y: startY + row * Y_GAP },
        data: { label: cn.code, name: cn.name, status: cn.status },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          background: colors.bg,
          border: `1.5px solid ${colors.border}`,
          borderRadius: '10px',
          color: colors.text,
          padding: '8px 12px',
          fontSize: '12px',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          width: 140,
          textAlign: 'center' as const,
        },
      });
    }
  }

  const flowEdges: Edge[] = courseEdges.map((e, i) => ({
    id: `e-${i}`,
    source: e.source,
    target: e.target,
    type: 'smoothstep',
    animated: nodeMap.get(e.source)?.status === 'in_progress',
    style: { stroke: '#3a4358', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#3a4358', width: 16, height: 16 },
  }));

  return { nodes: flowNodes, edges: flowEdges };
}

export function CourseRoadmapBody({ data }: { data: Record<string, unknown> }) {
  const roadmap = data.roadmap as CourseRoadmapData | undefined;

  const { nodes, edges } = useMemo(() => {
    if (!roadmap) return { nodes: [], edges: [] };
    return layoutNodes(roadmap);
  }, [roadmap]);

  if (!roadmap) return null;

  return (
    <div className="roadmap">
      <div className="roadmap__legend">
        {(Object.entries(STATUS_LABELS) as [CourseNodeStatus, string][]).map(([status, label]) => (
          <span key={status} className={`roadmap__tag roadmap__tag--${status}`}>
            {label}
          </span>
        ))}
      </div>
      <div className="roadmap__graph">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          nodesDraggable={false}
          nodesConnectable={false}
          panOnDrag
          zoomOnScroll={false}
          proOptions={{ hideAttribution: true }}
        />
      </div>
    </div>
  );
}
