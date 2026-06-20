import { motion } from 'framer-motion';
import { MapPin, Clock, Coffee, Zap, Navigation } from 'lucide-react';
import type { ServiceArea } from '@/types';
import { formatMileage } from '@/utils/format';

interface ServiceAreaListProps {
  serviceAreas: ServiceArea[];
}

export const ServiceAreaList = ({ serviceAreas }: ServiceAreaListProps) => {
  return (
    <div className="space-y-3">
      {serviceAreas.map((area, index) => (
        <motion.div
          key={area.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-deep-blue-700/30 border border-deep-blue-700 rounded-lg p-4 hover:border-info/50 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-info/20 rounded-lg flex items-center justify-center">
                <Coffee className="w-5 h-5 text-info" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">{area.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {area.hasCharging && (
                    <span className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-0.5 rounded">
                      <Zap className="w-3 h-3" />
                      充电桩
                    </span>
                  )}
                  {area.hasRestaurant && (
                    <span className="flex items-center gap-1 text-xs text-info bg-info/10 px-2 py-0.5 rounded">
                      <Coffee className="w-3 h-3" />
                      餐厅
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-deep-blue-600" />
              <span className="text-xs text-deep-blue-600">距离:</span>
              <span className="text-sm text-white font-mono">{formatMileage(area.distanceFromVehicle)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-deep-blue-600" />
              <span className="text-xs text-deep-blue-600">预计:</span>
              <span className="text-sm text-white font-mono">{area.estimatedArrival}分钟</span>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-xs text-deep-blue-600 mb-1">
              <span>距离进度</span>
              <span>{Math.round((area.distanceFromVehicle / 300) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-deep-blue-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(area.distanceFromVehicle / 300) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                className="h-full bg-info rounded-full"
              />
            </div>
          </div>

          <button className="w-full mt-3 flex items-center justify-center gap-2 py-2 bg-info/10 hover:bg-info/20 text-info text-sm font-medium rounded-md transition-colors">
            <Navigation className="w-4 h-4" />
            导航前往
          </button>
        </motion.div>
      ))}
    </div>
  );
};
