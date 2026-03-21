import type { CourseRoadmapData, RoadmapNode } from '../../types';

const STATUS_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  completed:   { fill: 'rgba(0, 106, 106, 0.35)', stroke: '#93f2f2', text: '#93f2f2' },
  in_progress: { fill: 'rgba(0, 106, 106, 0.15)', stroke: '#006a6a', text: '#6dd5d5' },
  planned:     { fill: 'rgba(148, 163, 184, 0.06)', stroke: 'rgba(148, 163, 184, 0.25)', text: '#64748b' },
  available:   { fill: 'rgba(0, 44, 110, 0.25)', stroke: '#3b82f6', text: '#93c5fd' },
};

const NODE_W = 120;
const NODE_H = 48;
const COL_GAP = 50;
const ROW_GAP = 20;
const PAD_X = 20;
const PAD_Y = 40;

function computeLayers(nodes: RoadmapNode[]): Map<string, number> {
  const depth = new Map<string, number>();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  function getDepth(id: string): number {
    if (depth.has(id)) return depth.get(id)!;
    const node = nodeMap.get(id);
    if (!node || node.prereqs.length === 0) {
      depth.set(id, 0);
      return 0;
    }
    const d = 1 + Math.max(...node.prereqs.map(getDepth));
    depth.set(id, d);
    return d;
  }

  nodes.forEach((n) => getDepth(n.id));
  return depth;
}

export function CourseRoadmapWidget({ data }: { data: CourseRoadmapData }) {
  const layers = computeLayers(data.nodes);
  const maxLayer = Math.max(0, ...layers.values());

  const columns: RoadmapNode[][] = Array.from({ length: maxLayer + 1 }, () => []);
  data.nodes.forEach((n) => {
    columns[layers.get(n.id) ?? 0].push(n);
  });

  const maxRows = Math.max(1, ...columns.map((c) => c.length));
  const svgW = PAD_X * 2 + (maxLayer + 1) * NODE_W + maxLayer * COL_GAP;
  const svgH = PAD_Y * 2 + maxRows * NODE_H + (maxRows - 1) * ROW_GAP;

  const positions = new Map<string, { cx: number; cy: number }>();
  columns.forEach((col, ci) => {
    const colHeight = col.length * NODE_H + (col.length - 1) * ROW_GAP;
    const offsetY = (svgH - colHeight) / 2;
    col.forEach((node, ri) => {
      positions.set(node.id, {
        cx: PAD_X + ci * (NODE_W + COL_GAP) + NODE_W / 2,
        cy: offsetY + ri * (NODE_H + ROW_GAP) + NODE_H / 2,
      });
    });
  });

  return (
    <div className="widget-roadmap">
      <div className="roadmap-title">{data.major}</div>
      <div className="roadmap-svg-container">
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
          {data.nodes.flatMap((node) =>
            node.prereqs.map((preId) => {
              const from = positions.get(preId);
              const to = positions.get(node.id);
              if (!from || !to) return null;
              const midX = (from.cx + to.cx) / 2;
              return (
                <path
                  key={`${preId}-${node.id}`}
                  d={`M${from.cx + NODE_W / 2} ${from.cy} C${midX} ${from.cy} ${midX} ${to.cy} ${to.cx - NODE_W / 2} ${to.cy}`}
                  fill="none"
                  stroke="rgba(147, 242, 242, 0.2)"
                  strokeWidth="1.5"
                />
              );
            }),
          )}

          {data.nodes.map((node) => {
            const pos = positions.get(node.id);
            if (!pos) return null;
            const colors = STATUS_COLORS[node.status];
            const x = pos.cx - NODE_W / 2;
            const y = pos.cy - NODE_H / 2;

            return (
              <g key={node.id}>
                <rect
                  x={x} y={y}
                  width={NODE_W} height={NODE_H}
                  rx={8}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={node.status === 'in_progress' ? 1.5 : 1}
                  opacity={node.status === 'planned' ? 0.6 : 1}
                />
                <text
                  x={pos.cx} y={pos.cy - 6}
                  textAnchor="middle"
                  fill={colors.text}
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="'Inter', sans-serif"
                >
                  {node.id}
                </text>
                <text
                  x={pos.cx} y={pos.cy + 10}
                  textAnchor="middle"
                  fill={colors.text}
                  fontSize="9"
                  fontFamily="'Inter', sans-serif"
                  opacity={0.75}
                >
                  {node.name}
                </text>
                {node.grade && (
                  <text
                    x={x + NODE_W - 8} y={y + 12}
                    textAnchor="end"
                    fill="#93f2f2"
                    fontSize="9"
                    fontWeight="600"
                    fontFamily="'Inter', sans-serif"
                  >
                    {node.grade}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="roadmap-legend">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="legend-item">
            <span className="legend-dot" style={{ background: colors.stroke }} />
            <span>{status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
