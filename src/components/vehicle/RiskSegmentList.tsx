import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Clock, MapPin } from 'lucide-react';
import type { RouteSegment } from '@/types';
import { getRouteSegmentColor, getRouteSegmentLabel, formatTemperature } from '@/utils/format';

interface RiskSegmentListProps {
  segments: RouteSegment[];
  highlightTime?: Date | null;
}

export const RiskSegmentList = ({ segments, highlightTime }: RiskSegmentListProps) => {
  const riskSegments = segments.filter((s) => s.type !== 'normal');

  if (riskSegments.length === 0) {
    return (
      <div className="text-center py-8 text-success">
        <TrendingUp className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">前方路线无风险路段</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {riskSegments.map((segment, index) => {
        const color = getRouteSegmentColor(segment.type);
        const isHighRisk = segment.type === 'hotspot' || segment.estimatedOverheatTime && segment.estimatedOverheatTime < 30;

        return (
          <motion.div
            key={segment.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`relative border-l-4 rounded-r-lg p-4 ${isHighRisk ? 'bg-danger/10' : 'bg-warning/10'}`}
            style={{ borderColor: color }}
          >
            {isHighRisk && (
              <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-danger bg-danger/20 px-2 py-0.5 rounded font-medium">
                <AlertTriangle className="w-3 h-3" />
                高风险
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {segment.type === 'congestion' ? (
                  <Clock className="w-3 h-3" />
                ) : (
                  <TrendingUp className="w-3 h-3" />
                )}
              </div>
              <span className="text-sm font-semibold text-white">
                {getRouteSegmentLabel(segment.type)}
              </span>
            </div>

            <p className="text-sm text-deep-blue-600 mb-3">{segment.description}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-deep-blue-600" />
                <span className="text-xs text-deep-blue-600">里程:</span>
                <span className="text-sm text-white font-mono">
                  {segment.startMileage} - {segment.endMileage} km
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-deep-blue-600" />
                <span className="text-xs text-deep-blue-600">预计升温:</span>
                <span className="text-sm text-warning font-mono">
                  +{segment.estimatedTempRise.toFixed(1)}℃
                </span>
              </div>
            </div>

            {segment.estimatedOverheatTime && (
              <div className="mt-3 p-2 bg-deep-blue-800 rounded">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning" />
                  <span className="text-xs text-deep-blue-600">预计超温时间:</span>
                  <span className={`text-sm font-mono font-bold ${segment.estimatedOverheatTime < 30 ? 'text-danger' : 'text-warning'}`}>
                    {segment.estimatedOverheatTime}分钟后
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-deep-blue-600 mb-1">
                    <span>温度上升风险</span>
                    <span>{formatTemperature(segment.estimatedTempRise)}</span>
                  </div>
                  <div className="h-1.5 bg-deep-blue-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, segment.estimatedTempRise * 20)}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
