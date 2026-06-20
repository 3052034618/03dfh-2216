import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { TemperatureReading } from '@/types';
import { formatTemperature, formatTime } from '@/utils/format';

interface TemperatureChartProps {
  readings: TemperatureReading[];
  minTemp: number;
  maxTemp: number;
  height?: number;
  highlightTime?: Date | null;
}

export const TemperatureChart = ({ readings, minTemp, maxTemp, height = 200, highlightTime }: TemperatureChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    setShowAnimation(true);
  }, []);

  const { pathData, areaPath, points, yScale, xScale, chartWidth, chartHeight, padding } = useMemo(() => {
    const width = 600;
    const chartH = height;
    const pad = { top: 20, right: 20, bottom: 30, left: 50 };
    const innerWidth = width - pad.left - pad.right;
    const innerHeight = chartH - pad.top - pad.bottom;

    const temps = readings.map((r) => r.temperature);
    const dataMin = Math.min(...temps, minTemp - 2);
    const dataMax = Math.max(...temps, maxTemp + 2);
    const tempRange = dataMax - dataMin || 1;

    const yScaleFn = (temp: number) => {
      return pad.top + innerHeight - ((temp - dataMin) / tempRange) * innerHeight;
    };

    const xScaleFn = (index: number) => {
      return pad.left + (index / (readings.length - 1 || 1)) * innerWidth;
    };

    const pointsData = readings.map((reading, index) => ({
      x: xScaleFn(index),
      y: yScaleFn(reading.temperature),
      reading,
      index,
    }));

    let path = '';
    pointsData.forEach((point, index) => {
      if (index === 0) {
        path += `M ${point.x} ${point.y}`;
      } else {
        const prev = pointsData[index - 1];
        const cpX = (prev.x + point.x) / 2;
        path += ` C ${cpX} ${prev.y}, ${cpX} ${point.y}, ${point.x} ${point.y}`;
      }
    });

    const areaPath = path + ` L ${xScaleFn(readings.length - 1)} ${pad.top + innerHeight} L ${pad.left} ${pad.top + innerHeight} Z`;

    return {
      pathData: path,
      areaPath,
      points: pointsData,
      yScale: yScaleFn,
      xScale: xScaleFn,
      chartWidth: width,
      chartHeight: chartH,
      padding: pad,
    };
  }, [readings, minTemp, maxTemp, height]);

  const minY = yScale(minTemp);
  const maxY = yScale(maxTemp);

  const getLineColor = () => {
    const lastReading = readings[readings.length - 1];
    if (lastReading) {
      if (lastReading.temperature > maxTemp || lastReading.temperature < minTemp) {
        return '#EF4444';
      }
      if (lastReading.temperature > maxTemp - 1 || lastReading.temperature < minTemp + 1) {
        return '#F59E0B';
      }
    }
    return '#10B981';
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <svg
        width="100%"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="min-w-[600px]"
      >
        <defs>
          <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={getLineColor()} stopOpacity="0.3" />
            <stop offset="100%" stopColor={getLineColor()} stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={`grid-${i}`}
            x1={padding.left}
            x2={chartWidth - padding.right}
            y1={padding.top + ratio * (chartHeight - padding.top - padding.bottom)}
            y2={padding.top + ratio * (chartHeight - padding.top - padding.bottom)}
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}

        <rect
          x={padding.left}
          y={maxY}
          width={chartWidth - padding.left - padding.right}
          height={minY - maxY}
          fill="#10B981"
          fillOpacity="0.1"
          stroke="#10B981"
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        <line
          x1={padding.left}
          x2={chartWidth - padding.right}
          y1={minY}
          y2={minY}
          stroke="#10B981"
          strokeWidth="2"
          strokeDasharray="6,3"
        />
        <line
          x1={padding.left}
          x2={chartWidth - padding.right}
          y1={maxY}
          y2={maxY}
          stroke="#10B981"
          strokeWidth="2"
          strokeDasharray="6,3"
        />

        <text
          x={padding.left - 8}
          y={minY + 4}
          textAnchor="end"
          fill="#10B981"
          fontSize="11"
          fontFamily="JetBrains Mono, monospace"
        >
          {formatTemperature(minTemp)}
        </text>
        <text
          x={padding.left - 8}
          y={maxY + 4}
          textAnchor="end"
          fill="#10B981"
          fontSize="11"
          fontFamily="JetBrains Mono, monospace"
        >
          {formatTemperature(maxTemp)}
        </text>

        {highlightTime && readings.length > 1 && (() => {
          const highlightMs = highlightTime.getTime();
          const startTime = readings[0].timestamp.getTime();
          const endTime = readings[readings.length - 1].timestamp.getTime();
          const timeRange = endTime - startTime || 1;
          const ratio = Math.max(0, Math.min(1, (highlightMs - startTime) / timeRange));
          const innerWidth = chartWidth - padding.left - padding.right;
          const x = padding.left + ratio * innerWidth;
          const topY = padding.top;
          const bottomY = chartHeight - padding.bottom;
          return (
            <g>
              <line
                x1={x}
                x2={x}
                y1={topY}
                y2={bottomY}
                stroke="#A855F7"
                strokeWidth="2"
                strokeDasharray="5,3"
                opacity="0.9"
              />
              <circle
                cx={x}
                cy={(topY + bottomY) / 2}
                r="5"
                fill="#A855F7"
                opacity="0.8"
              >
                <animate
                  attributeName="r"
                  values="4;7;4"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.8;0.4;0.8"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          );
        })()}

        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: showAnimation ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          d={areaPath}
          fill="url(#tempGradient)"
        />

        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: showAnimation ? 1 : 0, opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          d={pathData}
          fill="none"
          stroke={getLineColor()}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />

        {points.map((point, index) => {
          const isLast = index === points.length - 1;
          const isHovered = hoveredIndex === index;
          const reading = point.reading;
          const isInRange = reading.temperature >= minTemp && reading.temperature <= maxTemp;
          const isNearLimit = reading.temperature >= maxTemp - 1 || reading.temperature <= minTemp + 1;
          const dotColor = !isInRange ? '#EF4444' : isNearLimit ? '#F59E0B' : '#10B981';

          return (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r={isLast || isHovered ? 6 : 3}
                fill={dotColor}
                stroke="#0F172A"
                strokeWidth="2"
                className={isLast ? 'temp-point-pulse' : ''}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              />
              
              {isHovered && (
                <g>
                  <rect
                    x={point.x - 50}
                    y={point.y - 45}
                    width="100"
                    height="35"
                    rx="4"
                    fill="#1E293B"
                    stroke="#475569"
                    strokeWidth="1"
                  />
                  <text
                    x={point.x}
                    y={point.y - 28}
                    textAnchor="middle"
                    fill="#E2E8F0"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {formatTemperature(reading.temperature)}
                  </text>
                  <text
                    x={point.x}
                    y={point.y - 16}
                    textAnchor="middle"
                    fill="#64748B"
                    fontSize="10"
                  >
                    {formatTime(reading.timestamp)}
                  </text>
                  <line
                    x1={point.x}
                    y1={point.y - 10}
                    x2={point.x}
                    y2={point.y}
                    stroke="#475569"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                </g>
              )}
            </g>
          );
        })}

        {points.filter((_, i) => i % 5 === 0 || i === points.length - 1).map((point, idx) => {
          const actualIndex = points.filter((_, i) => i % 5 === 0 || i === points.length - 1)[idx].index;
          return (
            <text
              key={`label-${idx}`}
              x={point.x}
              y={chartHeight - 10}
              textAnchor="middle"
              fill="#64748B"
              fontSize="10"
            >
              {formatTime(readings[actualIndex].timestamp)}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
