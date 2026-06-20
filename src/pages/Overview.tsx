import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Thermometer, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store';
import { StatsCard } from '@/components/common/StatsCard';
import { FilterPanel } from '@/components/vehicle/FilterPanel';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { MapView } from '@/components/map/MapView';

export default function Overview() {
  const {
    getFilteredVehicles,
    getVehicleStatusCounts,
    updateTemperatures,
    temperatureData,
    routeSegments,
  } = useAppStore();

  const vehicles = getFilteredVehicles();
  const statusCounts = getVehicleStatusCounts();

  useEffect(() => {
    const interval = setInterval(() => {
      updateTemperatures();
    }, 3000);

    return () => clearInterval(interval);
  }, [updateTemperatures]);

  const totalVehicles = vehicles.length;

  return (
    <div className="h-full flex flex-col bg-deep-blue overflow-hidden">
      <FilterPanel />

      <div className="p-4 border-b border-deep-blue-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="在途车辆总数"
            value={totalVehicles}
            icon={Thermometer}
            color="info"
            delay={0}
          />
          <StatsCard
            title="温度正常"
            value={statusCounts.normal}
            icon={CheckCircle}
            color="success"
            delay={0.1}
          />
          <StatsCard
            title="预警车辆"
            value={statusCounts.warning}
            icon={AlertTriangle}
            color="warning"
            delay={0.2}
          />
          <StatsCard
            title="告警车辆"
            value={statusCounts.alert}
            icon={AlertTriangle}
            color="danger"
            delay={0.3}
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <MapView vehicles={vehicles} routeSegments={routeSegments} />

          <div className="absolute top-4 right-4 z-[1000]">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => updateTemperatures()}
              className="flex items-center gap-2 px-3 py-2 bg-deep-blue-800/90 backdrop-blur border border-deep-blue-700 rounded-lg text-sm text-white hover:bg-deep-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>刷新数据</span>
            </motion.button>
          </div>

          <div className="absolute bottom-4 left-4 z-[1000] bg-deep-blue-800/90 backdrop-blur border border-deep-blue-700 rounded-lg p-3">
            <p className="text-xs text-deep-blue-600 mb-2">车辆状态</p>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-xs text-white">正常</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning animate-pulse" />
                <span className="text-xs text-white">预警</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-danger animate-pulse" />
                <span className="text-xs text-white">告警</span>
              </div>
            </div>
            <p className="text-xs text-deep-blue-600 mb-2 mt-3 pt-2 border-t border-deep-blue-700">风险路段</p>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-1 bg-warning rounded" />
                <span className="text-xs text-white">拥堵路段</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-1 bg-danger rounded" />
                <span className="text-xs text-white">高温路段</span>
              </div>
            </div>
            <p className="text-xs text-deep-blue-500 mt-2">点击路段查看详情</p>
          </div>
        </div>

        <div className="w-80 border-l border-deep-blue-700 flex flex-col bg-deep-blue-800/50">
          <div className="p-4 border-b border-deep-blue-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">车辆列表</h3>
              <span className="text-xs text-deep-blue-600">
                共 {vehicles.length} 辆
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
            {vehicles.length === 0 ? (
              <div className="text-center py-12 text-deep-blue-600">
                <Thermometer className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">暂无匹配车辆</p>
                <p className="text-sm mt-1">请调整筛选条件</p>
              </div>
            ) : (
              vehicles.map((vehicle, index) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
