import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Thermometer, MapPin, Clock, User, ChevronRight, AlertTriangle } from 'lucide-react';
import type { Vehicle } from '@/types';
import {
  formatTemperature,
  getStatusColor,
  getStatusBgColor,
  getStatusDotColor,
  getStatusLabel,
  getCargoTypeLabel,
  formatMileage,
  formatTime,
} from '@/utils/format';

interface VehicleCardProps {
  vehicle: Vehicle;
  index: number;
}

export const VehicleCard = ({ vehicle, index }: VehicleCardProps) => {
  const navigate = useNavigate();
  const isWarning = vehicle.currentStatus === 'warning';
  const isAlert = vehicle.currentStatus === 'alert';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ x: -4, transition: { duration: 0.2 } }}
      onClick={() => navigate(`/detail/${vehicle.id}`)}
      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${getStatusBgColor(vehicle.currentStatus)} ${
        isAlert ? 'animate-breathing' : ''
      }`}
    >
      {isAlert && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-danger/20 text-danger px-2 py-0.5 rounded text-xs font-medium">
          <AlertTriangle className="w-3 h-3" />
          <span>需立即处置</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusDotColor(vehicle.currentStatus)} ${isWarning || isAlert ? 'animate-pulse' : ''}`} />
          <h3 className="text-lg font-bold font-mono text-white">{vehicle.plateNumber}</h3>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusBgColor(vehicle.currentStatus)} ${getStatusColor(vehicle.currentStatus)}`}>
          {getStatusLabel(vehicle.currentStatus)}
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
