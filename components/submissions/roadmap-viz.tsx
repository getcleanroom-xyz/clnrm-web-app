"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RoadmapPhase } from "@/lib/api/types";

interface Props {
  phases: RoadmapPhase[];
  totalSubmissions: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}

const LEVEL_LABELS: Record<string, string> = {
  "not-needed": "Not needed",
  "nice-to-have": "Nice to have",
  important: "Important",
  critical: "Critical",
};

export function RoadmapViz({ phases, totalSubmissions }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 900, h: 500 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleId = useRef(0);

  // Track dimensions
  useEffect(() => {
    function resize() {
      if (containerRef.current) {
        setDimensions({
          w: containerRef.current.offsetWidth,
          h: 500,
        });
      }
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Spawn particles periodically
  useEffect(() => {
    if (totalSubmissions === 0) return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const interval = setInterval(() => {
      const phase = phases[Math.floor(Math.random() * phases.length)];
      const feat = phase.features[Math.floor(Math.random() * phase.features.length)];

      // Find node position
      const px = phaseX(phase.phase, phases.length, dimensions.w);
      const fy = featureY(
        phase.features.indexOf(feat),
        phase.features.length,
        dimensions.h,
      );

      const newParticle: Particle = {
        id: particleId.current++,
        x: Math.random() * dimensions.w,
        y: dimensions.h + 20,
        tx: px,
        ty: fy,
        delay: 0,
        duration: 2 + Math.random() * 2,
        size: 2 + Math.random() * 3,
        opacity: 0.3 + Math.random() * 0.5,
      };

      setParticles((prev) => [...prev.slice(-40), newParticle]);

      // Remove after animation
      const t = setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
      }, (newParticle.duration + newParticle.delay) * 1000 + 100);
      timeouts.push(t);
    }, 1200);

    return () => {
      clearInterval(interval);
      timeouts.forEach(clearTimeout);
    };
  }, [phases, totalSubmissions, dimensions]);

  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    for (const phase of phases) {
      for (const feat of phase.features) {
        positions[feat.id] = {
          x: phaseX(phase.phase, phases.length, dimensions.w),
          y: featureY(
            phase.features.indexOf(feat),
            phase.features.length,
            dimensions.h,
          ),
        };
      }
    }
    return positions;
  }, [phases, dimensions]);

  // Dependency edges
  const edges = useMemo(() => {
    const result: { from: string; to: string }[] = [];
    for (const phase of phases) {
      for (const feat of phase.features) {
        for (const dep of feat.deps) {
          result.push({ from: dep, to: feat.id });
        }
      }
    }
    return result;
  }, [phases]);

  // Scale importance to radius
  function nodeRadius(importance: number): number {
    // importance is 0-3 (0=not-needed, 3=critical). Min radius 18, max 44.
    return 18 + importance * 8;
  }

  function phaseX(phaseIdx: number, totalPhases: number, width: number): number {
    const padding = 60;
    const colWidth = (width - padding * 2) / totalPhases;
    return padding + colWidth * phaseIdx + colWidth / 2;
  }

  function featureY(featIdx: number, totalFeats: number, height: number): number {
    const padding = 80;
    const available = height - padding * 2;
    const spacing = available / Math.max(totalFeats, 1);
    return padding + spacing * featIdx + spacing / 2;
  }

  const importanceColor = (imp: number) => {
    if (imp >= 2.5) return "#00FF41";
    if (imp >= 1.5) return "#00CC33";
    if (imp >= 0.5) return "#009922";
    return "#005511";
  };

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden bg-surface/50 border border-[rgba(0,255,65,0.06)]">
      <svg width={dimensions.w} height={dimensions.h} className="block">
        {/* Phase labels */}
        {phases.map((phase) => (
          <text
            key={phase.phase}
            x={phaseX(phase.phase, phases.length, dimensions.w)}
            y={30}
            textAnchor="middle"
            className="fill-green text-[11px] font-bold tracking-[0.15em] uppercase"
          >
            {phase.label}
          </text>
        ))}

        {/* Submissions counter */}
        <text
          x={dimensions.w - 16}
          y={20}
          textAnchor="end"
          className="fill-white-dim/40 text-[10px]"
        >
          {totalSubmissions} submissions influencing this map
        </text>

        {/* Dependency edges */}
        {edges.map((edge) => {
          const from = nodePositions[edge.from];
          const to = nodePositions[edge.to];
          if (!from || !to) return null;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const angle = Math.atan2(dy, dx);
          const fromR = nodeRadius(0.5);
          const toR = nodeRadius(0.5);
          const startX = from.x + Math.cos(angle) * fromR;
          const startY = from.y + Math.sin(angle) * fromR;
          const endX = to.x - Math.cos(angle) * toR;
          const endY = to.y - Math.sin(angle) * toR;

          return (
            <g key={`${edge.from}-${edge.to}`}>
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="rgba(0,255,65,0.15)"
                strokeWidth={1}
                strokeDasharray="4 3"
              />
              {/* Arrow head */}
              <polygon
                points={`${endX},${endY} ${endX - 8},${endY - 4} ${endX - 8},${endY + 4}`}
                fill="rgba(0,255,65,0.2)"
                transform={`rotate(${(angle * 180) / Math.PI + 90}, ${endX}, ${endY})`}
              />
            </g>
          );
        })}

        {/* Particles */}
        {particles.map((p) => (
          <g key={p.id}>
            <circle
              r={p.size}
              className="fill-green"
              opacity={0}
            >
              <animate
                attributeName="cx"
                from={p.x}
                to={p.tx}
                dur={`${p.duration}s`}
                begin={`${p.delay}s`}
              />
              <animate
                attributeName="cy"
                from={p.y}
                to={p.ty}
                dur={`${p.duration}s`}
                begin={`${p.delay}s`}
              />
              <animate
                attributeName="opacity"
                from="0"
                to={p.opacity}
                dur={`${p.duration * 0.15}s`}
                begin={`${p.delay}s`}
                fill="freeze"
              />
              <animate
                attributeName="opacity"
                from={p.opacity}
                to="0"
                dur={`${p.duration * 0.3}s`}
                begin={`${p.delay + p.duration * 0.7}s`}
                fill="freeze"
              />
            </circle>
            {/* Glow */}
            <circle
              r={p.size * 3}
              className="fill-green"
              opacity={0}
            >
              <animate
                attributeName="cx"
                from={p.x}
                to={p.tx}
                dur={`${p.duration}s`}
                begin={`${p.delay}s`}
              />
              <animate
                attributeName="cy"
                from={p.y}
                to={p.ty}
                dur={`${p.duration}s`}
                begin={`${p.delay}s`}
              />
              <animate
                attributeName="opacity"
                from="0"
                to={p.opacity * 0.3}
                dur={`${p.duration * 0.15}s`}
                begin={`${p.delay}s`}
                fill="freeze"
              />
              <animate
                attributeName="opacity"
                from={p.opacity * 0.3}
                to="0"
                dur={`${p.duration * 0.3}s`}
                begin={`${p.delay + p.duration * 0.7}s`}
                fill="freeze"
              />
            </circle>
          </g>
        ))}

        {/* Nodes */}
        {phases.map((phase) =>
          phase.features.map((feat) => {
            const pos = nodePositions[feat.id];
            if (!pos) return null;
            const r = nodeRadius(feat.importance);
            const isHovered = hoveredNode === feat.id;
            const color = importanceColor(feat.importance);

            return (
              <g
                key={feat.id}
                onMouseEnter={() => setHoveredNode(feat.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
              >
                {/* Glow ring on hover */}
                {isHovered && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r + 8}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    opacity={0.4}
                  >
                    <animate
                      attributeName="r"
                      from={r + 4}
                      to={r + 12}
                      dur="1s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.5"
                      to="0"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isHovered ? r + 2 : r}
                  className="transition-all duration-200"
                  fill={isHovered ? `${color}22` : `${color}11`}
                  stroke={color}
                  strokeWidth={isHovered ? 2 : 1.5}
                />

                {/* Node label */}
                <text
                  x={pos.x}
                  y={pos.y + r + 16}
                  textAnchor="middle"
                  className={`text-[10px] transition-all duration-200 ${
                    isHovered ? "fill-foreground" : "fill-white-dim"
                  }`}
                >
                  {feat.label}
                </text>

                {/* Importance badge */}
                <text
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  className="fill-green text-[11px] font-bold"
                >
                  {feat.importance > 0
                    ? `${(feat.importance / 3 * 100).toFixed(0)}%`
                    : "—"}
                </text>
              </g>
            );
          }),
        )}
      </svg>

      {/* Tooltip */}
      {hoveredNode && (() => {
        for (const phase of phases) {
          for (const feat of phase.features) {
            if (feat.id === hoveredNode) {
              return (
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-[rgba(10,10,10,0.95)] border border-[rgba(0,255,65,0.2)] text-sm max-w-sm">
                  <p className="text-green text-xs tracking-[0.1em] uppercase mb-1">
                    {phase.label} · Phase {phase.phase}
                  </p>
                  <p className="text-foreground font-bold mb-1">{feat.label}</p>
                  <p className="text-white-dim text-xs">
                    Community importance:{' '}
                    {feat.importance > 0
                      ? `${(feat.importance / 3 * 100).toFixed(0)}% · ` +
                        LEVEL_LABELS[
                          feat.importance >= 2.5
                            ? "critical"
                            : feat.importance >= 1.5
                              ? "important"
                              : feat.importance >= 0.5
                                ? "nice-to-have"
                                : "not-needed"
                        ] || "Unknown"
                      : "No data yet"}
                  </p>
                </div>
              );
            }
          }
        }
        return null;
      })()}
    </div>
  );
}
