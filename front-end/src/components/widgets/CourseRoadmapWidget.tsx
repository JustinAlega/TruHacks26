import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { CourseRoadmapData, RoadmapNode, ElectiveOption } from '../../types';

const STATUS_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  completed:   { fill: 'rgba(0, 106, 106, 0.35)', stroke: '#93f2f2', text: '#93f2f2' },
  in_progress: { fill: 'rgba(0, 106, 106, 0.15)', stroke: '#006a6a', text: '#6dd5d5' },
  planned:     { fill: 'rgba(148, 163, 184, 0.06)', stroke: 'rgba(148, 163, 184, 0.25)', text: '#64748b' },
  available:   { fill: 'rgba(0, 44, 110, 0.25)', stroke: '#3b82f6', text: '#93c5fd' },
  wildcard:    { fill: 'rgba(245, 158, 11, 0.1)', stroke: '#f59e0b', text: '#fbbf24' },
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
  const [selections, setSelections] = useState<Record<string, ElectiveOption>>({});
  const [activeWildcard, setActiveWildcard] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const roadmapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  const handleExportPDF = useCallback(async () => {
    if (!roadmapRef.current || exporting) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(roadmapRef.current, {
        backgroundColor: '#0a0e1a',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const imgW = canvas.width;
      const imgH = canvas.height;

      const pdfW = imgW * 0.75;
      const pdfH = imgH * 0.75;
      const pdf = new jsPDF({
        orientation: pdfW > pdfH ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [pdfW, pdfH],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`${data.major.replace(/\s+/g, '_')}_Roadmap.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [data.major, exporting]);

  const handleNodeClick = useCallback((node: RoadmapNode) => {
    const isResolved = selections[node.id];
    if (node.status === 'wildcard' && !isResolved) {
      setActiveWildcard((prev) => (prev === node.id ? null : node.id));
    }
  }, [selections]);

  const handleSelectElective = useCallback((nodeId: string, option: ElectiveOption) => {
    setSelections((prev) => ({ ...prev, [nodeId]: option }));
    setActiveWildcard(null);
  }, []);

  const handleClearSelection = useCallback((nodeId: string) => {
    setSelections((prev) => {
      const next = { ...prev };
      delete next[nodeId];
      return next;
    });
  }, []);

  const resolvedNodes = data.nodes.map((node): RoadmapNode => {
    const sel = selections[node.id];
    if (node.status === 'wildcard' && sel) {
      return { ...node, id: node.id, name: sel.name, credits: sel.credits, status: 'planned' };
    }
    return node;
  });

  const layers = computeLayers(resolvedNodes);

  const columns: RoadmapNode[][] = Array.from({ length: 8 }, () => []);
  resolvedNodes.forEach((n) => {
    // Use n.semester if available (1-indexed), otherwise fallback to layers
    const semIndex = (n.semester && n.semester >= 1 && n.semester <= 8) 
      ? n.semester - 1 
      : (layers.get(n.id) ?? 0);
    const safeIndex = Math.min(semIndex, 7);
    columns[safeIndex].push(n);
  });

  const maxRows = Math.max(1, ...columns.map((c) => c.length));
  const numCols = 8;
  const svgW = PAD_X * 2 + numCols * NODE_W + (numCols - 1) * COL_GAP;
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

  const activeNode = activeWildcard
    ? data.nodes.find((n) => n.id === activeWildcard)
    : null;

  const headerRow = (
    <div className="roadmap-header-row">
      <div className="roadmap-title">{data.major}</div>
      <div className="roadmap-actions">
        <button
          className="roadmap-action-btn"
          onClick={() => setIsFullscreen((f) => !f)}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          )}
        </button>
        <button
          className="roadmap-action-btn"
          onClick={handleExportPDF}
          disabled={exporting}
          title="Export as PDF"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {exporting ? 'Exporting…' : 'PDF'}
        </button>
      </div>
    </div>
  );

  const graphContent = (
    <div className="roadmap-content" ref={roadmapRef} style={{ position: 'relative' }}>
      <div className={`roadmap-svg-container ${isFullscreen ? 'roadmap-svg-fullscreen' : ''}`}>
        <svg
          width={isFullscreen ? '100%' : svgW}
          height={isFullscreen ? '100%' : svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio={isFullscreen ? 'xMidYMid meet' : undefined}
        >
          {resolvedNodes.flatMap((node) =>
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

          {Array.from({ length: 8 }).map((_, i) => (
            <text
              key={`sem-label-${i}`}
              x={PAD_X + i * (NODE_W + COL_GAP) + NODE_W / 2}
              y={PAD_Y - 20}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="12"
              fontWeight="700"
              fontFamily="'Inter', sans-serif"
              opacity={0.8}
            >
              Semester {i + 1}
            </text>
          ))}

          {resolvedNodes.map((node) => {
            const pos = positions.get(node.id);
            if (!pos) return null;
            const origNode = data.nodes.find((n) => n.id === node.id)!;
            const isWildcard = origNode.status === 'wildcard';
            const isResolved = isWildcard && !!selections[node.id];
            const isActive = activeWildcard === node.id;
            const displayStatus = isResolved ? 'planned' : node.status;
            const colors = STATUS_COLORS[displayStatus] ?? STATUS_COLORS.planned;
            const x = pos.cx - NODE_W / 2;
            const y = pos.cy - NODE_H / 2;

            return (
              <g
                key={node.id}
                onClick={() => handleNodeClick(origNode)}
                style={{ cursor: isWildcard && !isResolved ? 'pointer' : 'default' }}
              >
                <rect
                  x={x} y={y}
                  width={NODE_W} height={NODE_H}
                  rx={8}
                  fill={colors.fill}
                  stroke={isActive ? '#fbbf24' : colors.stroke}
                  strokeWidth={isActive ? 2 : isWildcard && !isResolved ? 1.5 : 1}
                  strokeDasharray={isWildcard && !isResolved ? '4 3' : 'none'}
                  opacity={node.status === 'planned' && !isResolved ? 0.6 : 1}
                />

                {isWildcard && !isResolved ? (
                  <>
                    <text
                      x={pos.cx} y={pos.cy - 5}
                      textAnchor="middle"
                      fill={colors.text}
                      fontSize="16"
                      fontWeight="700"
                      fontFamily="'Inter', sans-serif"
                    >
                      +
                    </text>
                    <text
                      x={pos.cx} y={pos.cy + 11}
                      textAnchor="middle"
                      fill={colors.text}
                      fontSize="8"
                      fontFamily="'Inter', sans-serif"
                      opacity={0.8}
                    >
                      Free Elective
                    </text>
                  </>
                ) : (
                  <>
                    <text
                      x={pos.cx} y={pos.cy - 6}
                      textAnchor="middle"
                      fill={isResolved ? '#93c5fd' : colors.text}
                      fontSize="11"
                      fontWeight="600"
                      fontFamily="'Inter', sans-serif"
                    >
                      {isResolved ? selections[node.id].course : node.id}
                    </text>
                    <text
                      x={pos.cx} y={pos.cy + 10}
                      textAnchor="middle"
                      fill={isResolved ? '#93c5fd' : colors.text}
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
                  </>
                )}

                {isResolved && (
                  <g
                    onClick={(e) => { e.stopPropagation(); handleClearSelection(node.id); }}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle cx={x + NODE_W - 4} cy={y + 4} r={7} fill="rgba(30,30,40,0.85)" />
                    <text
                      x={x + NODE_W - 4} y={y + 4}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#94a3b8"
                      fontSize="9"
                      fontWeight="600"
                      fontFamily="'Inter', sans-serif"
                    >
                      ×
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {activeNode && activeNode.electiveOptions && (
        <div className="elective-overlay">
          <div className="elective-overlay-header">
            <span className="elective-overlay-title">Choose an Elective</span>
            <button
              className="elective-overlay-close"
              onClick={() => setActiveWildcard(null)}
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" />
                <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
          <div className="elective-list">
            {activeNode.electiveOptions.map((opt) => (
              <button
                key={opt.crn}
                className="elective-option"
                onClick={() => handleSelectElective(activeNode.id, opt)}
              >
                <div className="elective-option-top">
                  <span className="elective-option-course">{opt.course}</span>
                  <span className="elective-option-section">§{opt.section}</span>
                  <span className="elective-option-credits">{opt.credits} cr</span>
                </div>
                <div className="elective-option-name">{opt.name}</div>
                <div className="elective-option-meta">
                  <span>{opt.professor}</span>
                  <span className="meta-separator">·</span>
                  <span>{opt.time}</span>
                </div>
                <div className="elective-option-desc">{opt.description}</div>
                <div className="elective-option-crn">CRN {opt.crn}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const legend = (
    <div className="roadmap-legend">
      {Object.entries(STATUS_COLORS).map(([status, colors]) => (
        <div key={status} className="legend-item">
          <span
            className="legend-dot"
            style={{
              background: colors.stroke,
              borderRadius: status === 'wildcard' ? '2px' : '50%',
            }}
          />
          <span>{status === 'wildcard' ? 'free elective' : status.replace('_', ' ')}</span>
        </div>
      ))}
    </div>
  );

  const fullscreenOverlay = isFullscreen
    ? createPortal(
        <div className="roadmap-fullscreen-overlay">
          <div className="roadmap-fullscreen-inner">
            {headerRow}
            <div className="roadmap-fullscreen-graph">
              {graphContent}
            </div>
            {legend}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="widget-roadmap">
      {headerRow}
      {!isFullscreen && graphContent}
      {!isFullscreen && legend}
      {fullscreenOverlay}
    </div>
  );
}
