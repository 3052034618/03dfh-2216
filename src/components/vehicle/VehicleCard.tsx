import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Thermometer, MapPin, Clock, User, ChevronRight, AlertTriangle, TrendingUp, Navigation } from 'lucide-react';
import type { Vehicle } from '@/types';
import { ROUTE_SEGMENT_LABELS } from '@/types';
import {
  formatTemperature,
  getStatusColor,
  getStatusBgColor,
  getStatusDotColor,
  getStatusLabel,
  getCargoTypeLabel,
  formatMileage,
  formatTime,
  formatDurationMinutes,
} from '@/utils/format';

interface VehicleCardProps {
  vehicle: Vehicle;
  index: number;
}

export const VehicleCard = ({ vehicle, index }: VehicleCardProps) => {
  const navigate = useNavigate();
  const displayStatus = vehicle.riskLevel || vehicle.currentStatus;
  const isWarning = displayStatus === 'warning';
  const isAlert = displayStatus === 'alert';
  const hasRisk = vehicle.nearestRisk;

  const getRiskIcon = () => {
    if (!vehicle.nearestRisk) return AlertTriangle;
    if (vehicle.nearestRisk.type === 'congestion') return Clock;
    if (vehicle.nearestRisk.type === 'hotspot') return TrendingUp;
    if (vehicle.nearestRisk.type === 'long_stop') return Clock;
    return AlertTriangle;
  };

  const RiskIcon = getRiskIcon();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ x: -4, transition: { duration: 0.2 } }}
      onClick={() => navigate(`/detail/${vehicle.id}`)}
      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${getStatusBgColor(displayStatus)} ${
        isAlert ? 'animate-breathing' : ''
      }`}
    >
      {isAlert && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-danger/20 text-danger px-2 py-0.5 rounded text-xs font-medium z-10">
          <AlertTriangle className="w-3 h-3" />
          <span>需立即处置</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusDotColor(displayStatus)} ${isWarning || isAlert ? 'animate-pulse' : ''}`} />
          <h3 className="text-lg font-bold font-mono text-white">{vehicle.plateNumber}</h3>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusBgColor(displayStatus)} ${getStatusColor(displayStatus)}`}>
          {getStatusLabel(displayStatus)}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Thermometer className={`w-4 h-4 ${getStatusColor(vehicle.currentStatus)}`} />
          <span className="text-deep-blue-600">当前温度:</span>
          <span className={`font-mono font-bold ${getStatusColor(vehicle.currentStatus)}`}>
            {formatTemperature(vehicle.currentTemp)}
          </span>
          <span className="text-deep-blue-600 text-xs">
            ({formatTemperature(vehicle.targetTempMin)} ~ {formatTemperature(vehicle.targetTempMax)})
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-info" />
          <span className="text-deep-blue-600">剩余里程:</span>
          <span className="text-white font-mono">{formatMileage(vehicle.remainingMileage)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-info" />
          <span className="text-deep-blue-600">预计到达:</span>
          <span className="text-white font-mono">{formatTime(vehicle.estimatedArrival)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-info" />
          <span className="text-deep-blue-600">司机:</span>
          <span className="text-white">{vehicle.driverName}</span>
        </div>
      </div>

      {hasRisk && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
          className={`mt-3 p-2.5 rounded-lg border ${
            isAlert ? 'bg-danger/10 border-danger/30' : 'bg-warning/10 border-warning/30'
          }`}
        >
          <div className="flex items-start gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              isAlert ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'
            }`}>
              <RiskIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">
                {ROUTE_SEGMENT_LABELS[vehicle.nearestRisk.type]}
              </p>
              <p className="text-xs text-deep-blue-600 mt-0.5 truncate">
                {vehicle.nearestRisk.description}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-deep-blue-600">
                  距离: <span className="text-white font-mono">{vehicle.nearestRisk.distance}公里</span>
                </span>
                {vehicle.nearestRisk.estimatedOverheatMinutes && (
                  <span className={`text-xs font-medium ${
                    vehicle.nearestRisk.estimatedOverheatMinutes < 20 ? 'text-danger' : 'text-warning'
                  }`}>
                    <Navigation className="w-3 h-3 inline mr-0.5" />
                    {formatDurationMinutes(vehicle.nearestRisk.estimatedOverheatMinutes)}后超温
                  </span>
                )}
                <span className="text-xs text-deep-blue-600">
                  升温: <span className="text-warning font-mono">+{vehicle.nearestRisk.estimatedTempRise.toFixed(1)}℃</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="mt-3 pt-3 border-t border-deep-blue-700">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            <span className="text-xs bg-deep-blue-700/50 text-deep-blue-600 px-2 py-0.5 rounded">
              {vehicle.fleet}
            </span>
            <span className="text-xs bg-info/10 text-info px-2 py-0.5 rounded">
              {getCargoTypeLabel(vehicle.cargoType)}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-deep-blue-600 group-hover:text-white transition-colors" />
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-deep-blue-600 mb-1">
          <span>已行驶</span>
          <span>{Math.round((1 - vehicle.remainingMileage / vehicle.totalMileage) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-deep-blue-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(1 - vehicle.remainingMileage / vehicle.totalMileage) * 100}%` }}
            transition={{ duration: 1, delay: 0.3 + index * 0.05 }}
            className={`h-full rounded-full ${isAlert ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-success'}`}
          />
        </div>
      </div>
    </motion.div>
  );
};
