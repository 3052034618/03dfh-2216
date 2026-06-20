import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Thermometer,
  AlertTriangle,
  Clock,
  Route,
  DoorOpen,
  CheckCircle,
  ChevronRight,
  TrendingUp,
  Activity,
  AlertCircle,
  Gauge,
} from 'lucide-react';
import type {
  Vehicle,
  TemperatureReading,
  DisposalRecord,
  RouteSegment,
  DoorEvent,
  AlternativeRoute,
  RiskReason,
} from '@/types';
import {
  formatTemperature,
  formatTime,
  getStatusColor,
  getRiskReasonLabel,
  getRiskReasonColor,
  getRouteSegmentLabel,
} from '@/utils/format';
import { TemperatureChart } from '@/components/temperature/TemperatureChart';
import { DISPOSAL_TYPE_LABELS } from '@/types';

type TimelineEventType =
  | 'temperature_anomaly'
  | 'risk_segment'
  | 'disposal'
  | 'door_event'
  | 'route_change';

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: Date;
  title: string;
  description: string;
  details?: any;
  icon: typeof Thermometer;
  colorClass: string;
}

interface PostTripReviewProps {
  vehicle: Vehicle;
  temperatureData: TemperatureReading[];
  disposalRecords: DisposalRecord[];
  routeSegments: RouteSegment[];
  doorEvents: DoorEvent[];
  alternativeRoutes: AlternativeRoute[];
  minTemp: number;
  maxTemp: number;
}

export const PostTripReview = ({
  vehicle,
  temperatureData,
  disposalRecords,
  routeSegments,
  doorEvents,
  alternativeRoutes,
  minTemp,
  maxTemp,
}: PostTripReviewProps) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const traveled = vehicle.traveledMileage || (vehicle.totalMileage - vehicle.remainingMileage);

  const vehicleDisposalRecords = useMemo(
    () => disposalRecords.filter((r) => r.vehicleId === vehicle.id),
    [disposalRecords, vehicle.id]
  );

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];

    temperatureData.forEach((reading, idx) => {
      if (idx > 0) {
        const prev = temperatureData[idx - 1];
        const current = reading;
        const rise = current.temperature - prev.temperature;
        if (rise > 0.3 || current.temperature > maxTemp - 0.5) {
          events.push({
            id: `temp-${idx}`,
            type: 'temperature_anomaly',
            timestamp: current.timestamp,
            title: rise > 0 ? '温度上升' : '温度异常',
            description:
              rise > 0
                ? `${formatTemperature(prev.temperature)} → ${formatTemperature(current.temperature)}（+${rise.toFixed(1)}℃）`
                : `温度 ${formatTemperature(current.temperature)} 接近温区上限`,
            details: { reading, prevReading: prev, rise },
            icon: Thermometer,
            colorClass: current.temperature > maxTemp ? 'text-danger' : 'text-warning',
          });
        }
      }
    });

    routeSegments
      .filter((s) => s.type !== 'normal' && s.endMileage <= traveled + 5)
      .forEach((seg) => {
        const timeOffset = Math.max(0, seg.startMileage - traveled);
        const eventTime = new Date(Date.now() - Math.abs(timeOffset) * 60 * 1000);
        events.push({
          id: `seg-${seg.id}`,
          type: 'risk_segment',
          timestamp: new Date(eventTime),
          title: getRouteSegmentLabel(seg.type),
          description: seg.description,
          details: { segment: seg },
          icon: AlertTriangle,
          colorClass:
            seg.type === 'hotspot' ? 'text-danger' : 'text-warning',
        });
      });

    vehicleDisposalRecords.forEach((record) => {
      events.push({
        id: `disp-${record.id}`,
        type: record.routeChange ? 'route_change' : 'disposal',
        timestamp: record.timestamp,
        title: record.routeChange ? '路线调整' : DISPOSAL_TYPE_LABELS[record.type],
        description: record.description,
        details: { record },
        icon: record.routeChange ? Route : CheckCircle,
        colorClass: record.status === 'completed' ? 'text-success' : 'text-info',
      });
    });

    doorEvents.forEach((event, idx) => {
      events.push({
        id: `door-${idx}`,
        type: 'door_event',
        timestamp: event.timestamp,
        title: event.type === 'open' ? '开门' : '关门',
        description: `持续 ${event.duration || 0} 分钟`,
        details: { event },
        icon: DoorOpen,
        colorClass: event.type === 'open' ? 'text-warning' : 'text-info',
      });
    });

    return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [temperatureData, routeSegments, vehicleDisposalRecords, doorEvents, traveled, maxTemp]);

  const selectedEvent = timelineEvents.find((e) => e.id === selectedEventId);

  const analyzeTempTrend = (eventTime: Date) => {
    const eventTimeMs = eventTime.getTime();
    const before = temperatureData.filter((t) => t.timestamp.getTime() <= eventTimeMs).slice(-10);
    const after = temperatureData.filter((t) => t.timestamp.getTime() > eventTimeMs).slice(0, 10);
    const avgBefore = before.length > 0 ? before.reduce((s, t) => s + t.temperature, 0) / before.length : 0;
    const avgAfter = after.length > 0 ? after.reduce((s, t) => s + t.temperature, 0) / after.length : 0;
    return { avgBefore, avgAfter, trend: avgAfter - avgBefore };
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-deep-blue-800/50 rounded-lg border border-deep-blue-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-info" />
            <h4 className="font-semibold text-white">温度趋势回顾</h4>
          </div>
          <div className="text-xs text-deep-blue-600">
            {temperatureData.length} 条数据 · 最近30分钟
          </div>
        </div>
        <TemperatureChart readings={temperatureData} minTemp={minTemp} maxTemp={maxTemp} height={180} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="p-4 bg-deep-blue-800/50 rounded-lg border border-deep-blue-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-warning" />
                <h4 className="font-semibold text-white">事件时间线</h4>
              </div>
              <div className="text-xs text-deep-blue-600">
                共 {timelineEvents.length} 个关键事件
              </div>
            </div>

            <div className="relative">
              {timelineEvents.length === 0 ? (
                <div className="py-8 text-center text-deep-blue-600">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无异常事件</p>
                </div>
              ) : (
                <div className="space-y-3 relative pl-6">
                  <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-deep-blue-700" />
                  {timelineEvents.map((event, idx) => {
                    const isSelected = selectedEventId === event.id;
                    const Icon = event.icon;
                    const { trend } = analyzeTempTrend(event.timestamp);

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedEventId(isSelected ? null : event.id)}
                        className="relative cursor-pointer"
                      >
                        <div
                          className={`absolute -left-4 top-2 w-5 h-5 rounded-full flex items-center justify-center border-2 border-deep-blue ${
                            isSelected ? 'bg-info border-info' : 'bg-deep-blue-800 border-deep-blue-600'
                          }`}
                        >
                          <Icon className={`w-2.5 h-2.5 ${event.colorClass}`} />
                        </div>

                        <div
                          className={`p-3 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-info/10 border-info/50'
                              : 'bg-deep-blue-800/30 border-deep-blue-700 hover:border-deep-blue-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-sm font-medium text-white">
                                  {event.title}
                                </span>
                                {event.type === 'temperature_anomaly' && (
                                  <span
                                    className={`text-xs px-1.5 py-0.5 rounded bg-current/10 ${
                                      trend > 0.2
                                        ? 'text-danger'
                                        : trend > 0
                                        ? 'text-warning'
                                        : 'text-success'
                                    }`}
                                  >
                                    {trend > 0.2
                                      ? `后续升温+${trend.toFixed(1)}℃`
                                      : trend > 0
                                      ? `微升+${trend.toFixed(1)}℃`
                                      : '温度稳定'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-deep-blue-600 truncate">
                                {event.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-deep-blue-600 font-mono">
                                {formatTime(event.timestamp)}
                              </span>
                              <ChevronRight
                                className={`w-4 h-4 transition-transform ${
                                  isSelected ? 'rotate-90 text-info' : 'text-deep-blue-600'
                                }`}
                              />
                            </div>
                          </div>

                          {isSelected && event.details && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-3 pt-3 border-t border-deep-blue-700 space-y-3"
                            >
                              {event.type === 'temperature_anomaly' && event.details.reading && (
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="bg-deep-blue-800 rounded p-2">
                                    <p className="text-deep-blue-600 mb-1">发生时温度</p>
                                    <p
                                      className={`text-lg font-bold font-mono ${getStatusColor(
                                        event.details.reading.temperature > maxTemp
                                          ? 'alert'
                                          : event.details.reading.temperature > maxTemp - 0.5
                                          ? 'warning'
                                          : 'normal'
                                      )}`}
                                    >
                                      {formatTemperature(event.details.reading.temperature)}
                                    </p>
                                  </div>
                                  <div className="bg-deep-blue-800 rounded p-2">
                                    <p className="text-deep-blue-600 mb-1">10分钟变化</p>
                                    <p
                                      className={`text-lg font-bold font-mono ${
                                        trend > 0.2
                                          ? 'text-danger'
                                          : trend > 0
                                          ? 'text-warning'
                                          : 'text-success'
                                      }`}
                                    >
                                      {trend > 0 ? '+' : ''}
                                      {trend.toFixed(1)}℃
                                    </p>
                                  </div>
                                  <div className="bg-deep-blue-800 rounded p-2">
                                    <p className="text-deep-blue-600 mb-1">后续趋势</p>
                                    <p
                                      className={`text-lg font-bold font-mono ${
                                        trend > 0.2 ? 'text-danger' : trend > 0 ? 'text-warning' : 'text-success'
                                      }`}
                                    >
                                      {trend > 0.2 ? '恶化' : trend > 0 ? '关注' : '正常'}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {event.type === 'risk_segment' && event.details.segment && (
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-deep-blue-600">路段类型</span>
                                    <span
                                      className={
                                        event.details.segment.type === 'hotspot' ? 'text-danger' : 'text-warning'
                                      }
                                    >
                                      {getRouteSegmentLabel(event.details.segment.type)}
                                    </span>
                                  </div>
                                  {event.details.segment.congestionLevel && (
                                    <div className="flex justify-between">
                                      <span className="text-deep-blue-600">拥堵等级</span>
                                      <span className="text-white">
                                        {event.details.segment.congestionLevel === 'severe'
                                          ? '严重拥堵'
                                          : event.details.segment.congestionLevel === 'moderate'
                                          ? '中度拥堵'
                                          : '缓行'}
                                      </span>
                                    </div>
                                  )}
                                  {event.details.segment.historicalHighTemp && (
                                    <div className="flex justify-between">
                                      <span className="text-deep-blue-600">历史最高</span>
                                      <span className="text-white font-mono">
                                        {formatTemperature(event.details.segment.historicalHighTemp)}
                                      </span>
                                    </div>
                                  )}
                                  {event.details.segment.stopDuration && (
                                    <div className="flex justify-between">
                                      <span className="text-deep-blue-600">预计停车</span>
                                      <span className="text-white">
                                        {event.details.segment.stopDuration} 分钟
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span className="text-deep-blue-600">预计升温</span>
                                    <span className="text-warning font-mono">
                                      +{event.details.segment.estimatedTempRise.toFixed(1)}℃
                                    </span>
                                  </div>
                                </div>
                              )}

                              {(event.type === 'disposal' || event.type === 'route_change') &&
                                event.details.record && (
                                  <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-deep-blue-600">处置类型</span>
                                      <span className="text-white">
                                        {DISPOSAL_TYPE_LABELS[event.details.record.type]}
                                      </span>
                                    </div>
                                    {event.details.record.temperatureBefore !== undefined && (
                                      <div className="flex justify-between">
                                        <span className="text-deep-blue-600">处置时温度</span>
                                        <span className="text-white font-mono">
                                          {formatTemperature(event.details.record.temperatureBefore)}
                                        </span>
                                      </div>
                                    )}
                                    {event.details.record.riskReasons &&
                                      event.details.record.riskReasons.length > 0 && (
                                        <div className="flex justify-between items-start gap-2">
                                          <span className="text-deep-blue-600">风险原因</span>
                                          <div className="flex flex-wrap gap-1 justify-end">
                                            {event.details.record.riskReasons.map((r: RiskReason) => (
                                              <span
                                                key={r}
                                                className={`px-1.5 py-0.5 rounded ${getRiskReasonColor(
                                                  r
                                                )} bg-current/10`}
                                              >
                                                {getRiskReasonLabel(r)}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    {event.details.record.followUpStatus && (
                                      <div className="flex justify-between">
                                        <span className="text-deep-blue-600">后续状态</span>
                                        <span className="text-white">
                                          {event.details.record.followUpStatus === 'improving'
                                            ? '好转'
                                            : event.details.record.followUpStatus === 'stable'
                                            ? '稳定'
                                            : event.details.record.followUpStatus === 'worsening'
                                            ? '恶化'
                                            : '已解决'}
                                        </span>
                                      </div>
                                    )}
                                    {event.details.record.result && (
                                      <div className="p-2 bg-success/10 border border-success/30 rounded">
                                        <p className="text-success">{event.details.record.result}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                              {event.type === 'door_event' && event.details.event && (
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-deep-blue-600">事件</span>
                                    <span className="text-white">
                                      {event.details.event.type === 'open' ? '开门' : '关门'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-deep-blue-600">持续时间</span>
                                    <span className="text-white">
                                      {event.details.event.duration || 0} 分钟
                                    </span>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-deep-blue-800/50 rounded-lg border border-deep-blue-700">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-success" />
              <h4 className="font-semibold text-white">风险汇总</h4>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-deep-blue-600">处置记录</span>
                <span className="text-white font-medium">{vehicleDisposalRecords.length} 条</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-deep-blue-600">风险路段</span>
                <span className="text-warning font-medium">
                  {routeSegments.filter((s) => s.type !== 'normal').length} 处
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-deep-blue-600">开关门次数</span>
                <span className="text-white font-medium">{doorEvents.length} 次</span>
              </div>
              {temperatureData.length > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-deep-blue-600">最高温度</span>
                    <span className="text-danger font-mono font-medium">
                      {formatTemperature(Math.max(...temperatureData.map((t) => t.temperature)))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-deep-blue-600">平均温度</span>
                    <span className="text-info font-mono font-medium">
                      {formatTemperature(
                        temperatureData.reduce((s, t) => s + t.temperature, 0) /
                          temperatureData.length
                      )}
                    </span>
                  </div>
                </>
              )}
              {alternativeRoutes.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-deep-blue-600">备选路线</span>
                  <span className="text-success font-medium">{alternativeRoutes.length} 条</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-deep-blue-800/50 rounded-lg border border-deep-blue-700">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-info" />
              <h4 className="font-semibold text-white">运输进度</h4>
            </div>
            <div className="space-y-3">
              <div className="h-2 bg-deep-blue-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.round((1 - vehicle.remainingMileage / vehicle.totalMileage) * 100)}%`,
                  }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-info to-success rounded-full"
                />
              </div>
              <div className="flex justify-between text-xs">
                <div>
                  <p className="text-deep-blue-600">已行驶</p>
                  <p className="text-white font-mono">{Math.round(traveled)} km</p>
                </div>
                <div className="text-right">
                  <p className="text-deep-blue-600">剩余</p>
                  <p className="text-white font-mono">{Math.round(vehicle.remainingMileage)} km</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
