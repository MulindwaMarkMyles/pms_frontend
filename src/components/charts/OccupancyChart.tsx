import React from 'react';

type Props = {
  data: number[];
  labels?: string[];
  stroke?: string;
  fill?: string;
  height?: number;
  gridLines?: number;
};

function normalize(data: number[], height: number) {
  if (data.length === 0) return data;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  return data.map(v => {
    const t = (v - min) / range;
    return height - t * (height - 20) - 10; // padding top/bottom
  });
}

function buildSmoothPath(points: ReadonlyArray<readonly [number, number]>, smoothing = 0.18) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0][0]},${points[0][1]}`;

  const line = (pointA: readonly [number, number], pointB: readonly [number, number]) => {
    const lengthX = pointB[0] - pointA[0];
    const lengthY = pointB[1] - pointA[1];
    return { lengthX, lengthY };
  };

  const controlPoint = (
    current: readonly [number, number],
    previous: readonly [number, number],
    next: readonly [number, number],
    reverse = false
  ) => {
    const p = previous || current;
    const n = next || current;
    const { lengthX, lengthY } = line(p, n);
    const angle = Math.atan2(lengthY, lengthX) + (reverse ? Math.PI : 0);
    const length = Math.hypot(lengthX, lengthY) * smoothing;
    const x = current[0] + Math.cos(angle) * length;
    const y = current[1] + Math.sin(angle) * length;
    return [x, y] as const;
  };

  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const cps = controlPoint(points[i - 1], points[i - 2], points[i]);
    const cpe = controlPoint(points[i], points[i - 1], points[i + 1], true);
    d += ` C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${points[i][0]},${points[i][1]}`;
  }
  return d;
}

const OccupancyChart: React.FC<Props> = ({
  data,
  labels,
  stroke = '#2563eb',
  fill = 'rgba(37, 99, 235, 0.15)',
  height = 240,
  gridLines = 4,
}) => {
  const width = 800;
  const paddingX = 36;
  const paddingBottom = 24;
  const n = data.length;
  const pointsY = normalize(data, height - paddingBottom);
  const stepX = n > 1 ? (width - paddingX * 2) / (n - 1) : 0;
  const points = pointsY.map((y, i) => [paddingX + i * stepX, y] as const);
  const path = buildSmoothPath(points, 0.2);
  const area = `${path} L ${paddingX + (n - 1) * stepX},${height - 10} L ${paddingX},${height - 10} Z`;

  const gridYs = Array.from({ length: gridLines + 1 }, (_, i) => 10 + i * ((height - paddingBottom - 20) / gridLines));

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[20rem]">
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} />
            <stop offset="100%" stopColor="rgba(37, 99, 235, 0)" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={stroke} floodOpacity="0.15" />
          </filter>
        </defs>
        <g>
          {/* grid lines */}
          {gridYs.map((gy, i) => (
            <line key={i} x1={paddingX} x2={width - paddingX} y1={gy} y2={gy} stroke="#e5e7eb" strokeWidth={1} />
          ))}
          {/* area fill */}
          <path d={area} fill="url(#lineFill)" />
          {/* line */}
          <path d={path} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" filter="url(#shadow)" />
          {/* points */}
          {points.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={3} fill={stroke} />
          ))}
          {/* x-axis line */}
          <line x1={paddingX} x2={width - paddingX} y1={height - paddingBottom} y2={height - paddingBottom} stroke="#e5e7eb" strokeWidth={1.5} />
        </g>
      </svg>
      {labels && labels.length === n && (
        <div className="mt-2 grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {labels.map((l, i) => (
            <div key={i} className="text-[10px] text-gray-500 text-center truncate">{l}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OccupancyChart;

