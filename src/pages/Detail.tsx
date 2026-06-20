import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Thermometer,
  MapPin,
  Clock,
  User,
  Phone,
  Package,
  AlertTriangle,
  TrendingUp,
  DoorOpen,
  Coffee,
  Gauge,
  Route,
  Activity,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { TemperatureChart } from '@/components/temperature/TemperatureChart';
import { DoorEventTimeline } from '@/components/vehicle/DoorEventTimeline';
import { ServiceAreaList } from '@/components/vehicle/ServiceAreaList';
import { RiskSegmentList } from '@/components/vehicle/RiskSegmentList';
import { DetourDecisionPanel } from '@/components/vehicle/DetourDecisionPanel';
import { PostTripReview } from '@/components/vehicle/PostTripReview';
import { DisposalButtons } from '@/components/disposal/DisposalButtons';
import {
  formatTemperature,
  getStatusColor,
  getStatusBgColor,
  getStatusLabel,
  getCargoTypeLabel,
  formatMileage,
  formatTime,
  formatDateTime,
} from '@/utils/format';
import type { Vehicle } from '@/types';

export default function Detail() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'temperature' | 'risks' | 'detour' | 'doors' | 'services' | 'review'>('temperature');

  const vehicles = useAppStore((state) => state.vehicles);
  const vehicle = useMemo(() => vehicles.find((v) => v.id === vehicleId), [vehicles, vehicleId]);
  const temperatureData = useAppStore((state) => state.temperatureData[vehicleId || ''] || []);
  const doorEvents = useAppStore((state) => state.doorEvents[vehicleId || ''] || []);
  const serviceAreas = useAppStore((state) => state.serviceAreas[vehicleId || ''] || []);
  const routeSegments = useAppStore((state) => state.routeSegments[vehicleId || ''] || []);
  const alternativeRoutes = useAppStore((state) => state.getAlternativeRoutes(vehicleId || ''));
  const disposalRecords = useAppStore((state) => state.disposalRecords);
  const updateTemperatures = useAppStore((state) => state.updateTemperatures);

  useEffect(() => {
    const interval = setInterval(() => {
      updateTemperatures();
    }, 3000);

    return () => clearInterval(interval);
  }, [updateTemperatures]);

  if (!vehicle) {
    return (
      <div className="h-full flex items-center justify-center bg-deep-blue">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">车辆不存在</h2>
          <p className="text-deep-blue-600 mb-4">未找到该车辆的信息</p>
          <button
            onClick={() => navigate('/overview')}
            className="px-4 py-2 bg-info text-white rounded-md hover:bg-info/90 transition-colors"
          >
            返回车辆总览
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'temperature', label: '温度曲线', icon: Thermometer },
    { id: 'risks', label: '风险路段', icon: TrendingUp },
    { id: 'detour', label: '绕行决策', icon: Route, badge: alternativeRoutes.length > 0 },
    { id: 'review', label: '班后复盘', icon: Activity },
    { id: 'doors', label: '开关门记录', icon: DoorOpen },
    { id: 'services', label: '前方服务区', icon: Coffee },
  ] as const;

  const displayStatus = vehicle.riskLevel || vehicle.currentStatus;
  const isWarning = displayStatus === 'warning';
  const isAlert = displayStatus === 'alert';

  return (
    <div className="h-full flex flex-col bg-deep-blue overflow-hidden">
      <div className="bg-deep-blue-800 border-b border-deep-blue-700 p-4">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ x: -2 }}
            onClick={() => navigate('/overview')}
            className="p-2 text-deep-blue-600 hover:text-white hover:bg-deep-blue-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold font-mono text-white">{vehicle.plateNumber}</h1>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded ${getStatusBgColor(displayStatus)} ${getStatusColor(displayStatus)} ${
                  isAlert ? 'animate-pulse' : ''
                }`}
              >
                {getStatusLabel(displayStatus)}
              </span>
              <span className="text-xs bg-deep-blue-700/50 text-deep-blue-600 px-2 py-1 rounded">
                {vehicle.fleet}
              </span>
            </div>
            <p className="text-sm text-deep-blue-600">
              {getCargoTypeLabel(vehicle.cargoType)} · {vehicle.cargoDescription}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold font-mono ${getStatusColor(vehicle.currentStatus)}`}>
                {formatTemperature(vehicle.currentTemp)}
              </div>
              <div className="text-xs text-deep-blue-600 mt-1">
                设定: {formatTemperature(vehicle.targetTempMin)} ~ {formatTemperature(vehicle.targetTempMax)}
              </div>
              {vehicle.nearestRisk && (
                <div className="mt-2 text-xs">
                  <span className="text-warning">
                    前方 {vehicle.nearestRisk.distance}km 有风险
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-deep-blue-700 bg-deep-blue-800/30">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <InfoItem icon={MapPin} label="剩余里程" value={formatMileage(vehicle.remainingMileage)} />
          <InfoItem
            icon={Gauge}
            label="已行驶"
            value={`${Math.round((1 - vehicle.remainingMileage / vehicle.totalMileage) * 100)}%`}
          />
          <InfoItem icon={Clock} label="预计到达" value={formatTime(vehicle.estimatedArrival)} />
          <InfoItem icon={User} label="司机" value={vehicle.driverName} />
          <InfoItem icon={Phone} label="联系电话" value={vehicle.driverPhone} />
          <InfoItem icon={Package} label="货品" value={getCargoTypeLabel(vehicle.cargoType)} />
        </div>
      </div>

      {(isWarning || isAlert) && (
        <div className="p-4">
          <div className={`border rounded-lg p-4 ${isAlert ? 'bg-danger/10 border-danger/30' : 'bg-warning/10 border-warning/30'}`}>
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${isAlert ? 'text-danger' : 'text-warning'}`} />
              <div>
                <h3 className={`text-lg font-semibold mb-1 ${isAlert ? 'text-danger' : 'text-warning'}`}>
                  {isAlert ? '温度告警' : '温度预警'}
                </h3>
                <p className="text-sm text-deep-blue-600">
                  当前温度 {formatTemperature(vehicle.currentTemp)}，
                  {vehicle.nearestRisk
                    ? `前方${vehicle.nearestRisk.distance}公里有${vehicle.nearestRisk.description}，预计升温+${vehicle.nearestRisk.estimatedTempRise.toFixed(1)}℃`
                    : isAlert
                    ? '已超出设定温区上限'
                    : '接近设定温区上限'}
                  ，请立即采取处置措施。
                </p>
                {vehicle.nearestRisk?.estimatedOverheatMinutes && (
                  <p className="text-xs mt-1 text-warning font-medium">
                    预计 {vehicle.nearestRisk.estimatedOverheatMinutes} 分钟后超温
                  </p>
                )}
              </div>
            </div>
            <DisposalButtons vehicleId={vehicle.id} compact />
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex border-b border-deep-blue-700 bg-deep-blue-800/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const hasBadge = (tab as any).badge;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all border-b-2 relative ${
                    isActive
                      ? 'text-info border-info bg-info/5'
                      : 'text-deep-blue-600 border-transparent hover:text-white hover:bg-deep-blue-700/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {hasBadge && (
                    <span className="w-2 h-2 bg-danger rounded-full absolute top-3 right-4 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'temperature' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">过去30分钟温度变化</h3>
                    <span className="text-sm text-deep-blue-600">
                      数据每3秒自动更新
                    </span>
                  </div>
                  <div className="bg-deep-blue-800/50 rounded-lg p-4 border border-deep-blue-700">
                    <TemperatureChart
                      readings={temperatureData}
                      minTemp={vehicle.targetTempMin}
                      maxTemp={vehicle.targetTempMax}
                      height={280}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <StatCard
                      label="最低温度"
                      value={formatTemperature(Math.min(...temperatureData.map((t) => t.temperature)))}
                      color="info"
                    />
                    <StatCard
                      label="最高温度"
                      value={formatTemperature(Math.max(...temperatureData.map((t) => t.temperature)))}
                      color="warning"
                    />
                    <StatCard
                      label="平均温度"
                      value={formatTemperature(
                        temperatureData.reduce((sum, t) => sum + t.temperature, 0) / temperatureData.length
                      )}
                      color="success"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'risks' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">风险路段分析</h3>
                    <span className="text-sm text-deep-blue-600">
                      基于历史数据和实时路况
                    </span>
                  </div>
                  <RiskSegmentList segments={routeSegments} />
                </div>
              )}

              {activeTab === 'detour' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">绕行决策方案</h3>
                      {alternativeRoutes.length > 0 && (
                        <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded">
                          {alternativeRoutes.length} 条备选
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-deep-blue-600">
                      对比后选择最优路线
                    </span>
                  </div>
                  <DetourDecisionPanel vehicle={vehicle} alternativeRoutes={alternativeRoutes} />
                </div>
              )}

              {activeTab === 'review' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">班后复盘</h3>
                    </div>
                    <span className="text-sm text-deep-blue-600">
                      温度曲线、风险路段、处置动作时间线
                    </span>
                  </div>
                  <PostTripReview
                    vehicle={vehicle}
                    temperatureData={temperatureData}
                    disposalRecords={disposalRecords}
                    routeSegments={routeSegments}
                    doorEvents={doorEvents}
                    alternativeRoutes={alternativeRoutes}
                    minTemp={vehicle.targetTempMin}
                    maxTemp={vehicle.targetTempMax}
                  />
                </div>
              )}

              {activeTab === 'doors' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">开关门记录</h3>
                    <span className="text-sm text-deep-blue-600">
                      过去30分钟 · {doorEvents.length} 次操作
                    </span>
                  </div>
                  <div className="bg-deep-blue-800/50 rounded-lg p-4 border border-deep-blue-700">
                    <DoorEventTimeline events={doorEvents} />
                  </div>
                </div>
              )}

              {activeTab === 'services' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">前方服务区</h3>
                    <span className="text-sm text-deep-blue-600">
                      共 {serviceAreas.length} 个服务区
                    </span>
                  </div>
                  <ServiceAreaList serviceAreas={serviceAreas} />
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <div className="w-96 border-l border-deep-blue-700 bg-deep-blue-800/30 p-4 overflow-y-auto scrollbar-thin">
          <h3 className="text-lg font-semibold text-white mb-4">处置措施</h3>
          <DisposalButtons vehicleId={vehicle.id} />
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-info/10 rounded-md flex items-center justify-center">
        <Icon className="w-4 h-4 text-info" />
      </div>
      <div>
        <p className="text-xs text-deep-blue-600">{label}</p>
        <p className="text-sm font-medium text-white font-mono">{value}</p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'success' | 'warning' | 'info' | 'danger';
}) {
  const colorClasses = {
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    info: 'text-info bg-info/10',
    danger: 'text-danger bg-danger/10',
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-4 text-center`}>
      <p className="text-xs opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono">{value}</p>
    </div>
  );
}
