import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Route,
  MapPin,
  Clock,
  Thermometer,
  Coffee,
  AlertTriangle,
  ChevronRight,
  Check,
  TrendingDown,
  Navigation,
  Gauge,
  Map,
} from 'lucide-react';
import type { Vehicle, AlternativeRoute, RiskReason } from '@/types';
import { DISPOSAL_TYPE_LABELS, ROUTE_SEGMENT_LABELS } from '@/types';
import {
  formatMileage,
  formatTime,
  formatTemperature,
  getRiskReasonLabel,
  getRiskReasonColor,
  formatDurationMinutes,
  getRouteSegmentLabel,
} from '@/utils/format';
import { useAppStore } from '@/store';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

interface DetourDecisionPanelProps {
  vehicle: Vehicle;
  alternativeRoutes: AlternativeRoute[];
  onRouteSelect?: (routeId: string | null) => void;
}

export const DetourDecisionPanel = ({ vehicle, alternativeRoutes, onRouteSelect }: DetourDecisionPanelProps) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const handleRouteSelect = (routeId: string | null) => {
    setSelectedRouteId(routeId);
    onRouteSelect?.(routeId);
  };
  const [showConfirm, setShowConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const addDisposalRecord = useAppStore((state) => state.addDisposalRecord);
  const riskReasons = useAppStore((state) => state.getRiskReasonsForVehicle(vehicle.id));
  const allRouteSegments = useAppStore((state) => state.routeSegments[vehicle.id] || []);
  const traveled = vehicle.traveledMileage || (vehicle.totalMileage - vehicle.remainingMileage);

  const currentRiskSegments = useMemo(() => {
    return allRouteSegments.filter(
      (s) => s.type !== 'normal' && s.endMileage >= traveled - 2 && s.startMileage <= traveled + 50
    ).sort((a, b) => a.startMileage - b.startMileage);
  }, [allRouteSegments, traveled]);

  const originalRoute = useMemo(() => ({
    id: 'original',
    name: '当前路线',
    remainingMileage: vehicle.remainingMileage,
    estimatedArrival: vehicle.estimatedArrival,
    overheatProbability: vehicle.nearestRisk ? 70 : 30,
    nearestServiceAreaDistance: 45,
    tempRiseEstimate: vehicle.nearestRisk?.estimatedTempRise || 1.5,
    riskCount: riskReasons.length,
    riskSegments: currentRiskSegments,
  }), [vehicle, riskReasons.length, currentRiskSegments]);

  const allRoutes = [originalRoute, ...alternativeRoutes.map((r) => ({
    ...r,
    riskCount: r.riskSegments.filter((s) => s.type !== 'normal').length,
  }))];

  const selectedRoute = allRoutes.find((r) => r.id === selectedRouteId);

  const handleSuggestDetour = () => {
    if (!selectedRoute || selectedRoute.id === 'original') return;
    setShowConfirm(true);
  };

  const buildDetourReasons = () => {
    const reasons: string[] = [];
    if (currentRiskSegments.length > 0) {
      const segDesc = currentRiskSegments.map((r) => {
        const distance = Math.round(r.startMileage - traveled);
        const pos = distance <= 0 ? '正在经过' : `前方${distance}公里`;
        return `${pos}${r.description}（预计升温+${r.estimatedTempRise.toFixed(1)}℃）`;
      }).join('、');
      reasons.push(`原路线风险：${segDesc}`);
    }
    if (vehicle.nearestRisk && currentRiskSegments.length === 0) {
      reasons.push(`前方${vehicle.nearestRisk.distance}公里${vehicle.nearestRisk.description}，预计升温+${vehicle.nearestRisk.estimatedTempRise.toFixed(1)}℃`);
    }
    return reasons.join(' ');
  };

  const confirmDetour = async () => {
    if (!selectedRoute || selectedRoute.id === 'original') return;
    
    setProcessing(true);
    
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    const originalRiskDesc = buildDetourReasons();
    const recommendation = `推荐理由：超温概率从${originalRoute.overheatProbability}%降至${selectedRoute.overheatProbability}%，风险路段从${originalRoute.riskCount}处降至${selectedRoute.riskCount}处，剩余里程${selectedRoute.remainingMileage.toFixed(0)}公里，预计到达${formatTime(selectedRoute.estimatedArrival)}`;
    const fullDescription = `${originalRiskDesc}。建议绕行至${selectedRoute.name}。${recommendation}`;
    
    addDisposalRecord(vehicle.id, 'suggest_detour', fullDescription, {
      routeChange: true,
      alternativeRouteId: selectedRoute.id,
      selectedAction: DISPOSAL_TYPE_LABELS.suggest_detour,
      riskDescription: fullDescription,
      followUpStatus: 'improving',
    });
    
    setProcessing(false);
    setShowConfirm(false);
    setSuccess(true);
    
    setTimeout(() => setSuccess(false), 3000);
  };

  const getRouteScore = (route: typeof allRoutes[0]) => {
    let score = 100;
    score -= route.overheatProbability * 0.5;
    score += route.riskCount > 0 ? -route.riskCount * 10 : 5;
    score -= (route.remainingMileage - vehicle.remainingMileage) * 0.1;
    return Math.max(0, Math.min(100, score));
  };

  if (alternativeRoutes.length === 0) {
    return (
      <div className="text-center py-8 text-deep-blue-600">
        <Route className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无备选路线</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-success/10 border border-success/30 rounded-lg flex items-center gap-2"
        >
          <Check className="w-5 h-5 text-success" />
          <span className="text-sm text-success">已发送绕行建议，处置记录已生成</span>
        </motion.div>
      )}

      <div className="p-4 bg-deep-blue-800/50 rounded-lg border border-deep-blue-700">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <span className="text-sm font-medium text-white">当前路线风险分析</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {riskReasons.length > 0 ? (
            riskReasons.map((reason) => (
              <span
                key={reason}
                className={`text-xs px-2 py-1 rounded ${getRiskReasonColor(reason)} bg-current/10`}
              >
                {getRiskReasonLabel(reason)}
              </span>
            ))
          ) : (
            <span className="text-xs text-success">暂无风险</span>
          )}
        </div>
        {vehicle.nearestRisk && (
          <div className="mt-3 pt-3 border-t border-deep-blue-700">
            <p className="text-xs text-deep-blue-600 mb-1">最近风险点</p>
            <p className="text-sm text-white">
              前方 {vehicle.nearestRisk.distance} 公里：{vehicle.nearestRisk.description}
            </p>
            <p className="text-xs text-warning mt-1">
              预计升温 +{vehicle.nearestRisk.estimatedTempRise.toFixed(1)}℃
              {vehicle.nearestRisk.estimatedOverheatMinutes && (
                <>，{formatDurationMinutes(vehicle.nearestRisk.estimatedOverheatMinutes)}后超温</>
              )}
            </p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-info" />
            <span className="text-sm font-medium text-white">路线对比</span>
          </div>
          <span className="text-xs text-deep-blue-600">
            共 {alternativeRoutes.length + 1} 条路线
          </span>
        </div>

        <div className="space-y-3">
          {allRoutes.map((route, index) => {
            const isOriginal = route.id === 'original';
            const isSelected = selectedRouteId === route.id;
            const score = getRouteScore(route);
            const isBetter = !isOriginal && score > getRouteScore(originalRoute);

            return (
              <motion.div
                key={route.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => handleRouteSelect(route.id)}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-info bg-info/10'
                    : isOriginal
                    ? 'border-deep-blue-700 bg-deep-blue-800/50 hover:border-deep-blue-600'
                    : isBetter
                    ? 'border-success/50 bg-success/5 hover:border-success'
                    : 'border-deep-blue-700 bg-deep-blue-800/50 hover:border-deep-blue-600'
                }`}
              >
                {isBetter && !isOriginal && (
                  <div className="absolute -top-2 -right-2">
                    <span className="text-xs bg-success text-white px-2 py-0.5 rounded-full font-medium">
                      推荐
                    </span>
                  </div>
                )}
                {isOriginal && (
                  <div className="absolute -top-2 -right-2">
                    <span className="text-xs bg-deep-blue-600 text-white px-2 py-0.5 rounded-full">
                      当前
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isOriginal ? 'bg-info/20 text-info' : isBetter ? 'bg-success/20 text-success' : 'bg-deep-blue-700 text-deep-blue-600'
                    }`}>
                      <Route className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{route.name}</p>
                      <p className="text-xs text-deep-blue-600">
                        {route.riskCount > 0 ? `${route.riskCount} 处风险` : '无风险路段'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold font-mono ${
                      score > 70 ? 'text-success' : score > 50 ? 'text-warning' : 'text-danger'
                    }`}>
                      {Math.round(score)}分
                    </p>
                    <p className="text-xs text-deep-blue-600">综合评分</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-deep-blue-600" />
                    <span className="text-xs text-deep-blue-600">剩余里程:</span>
                    <span className="text-xs text-white font-mono">
                      {formatMileage(route.remainingMileage)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-deep-blue-600" />
                    <span className="text-xs text-deep-blue-600">预计到达:</span>
                    <span className="text-xs text-white font-mono">
                      {formatTime(route.estimatedArrival)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-3.5 h-3.5 text-warning" />
                    <span className="text-xs text-deep-blue-600">预计升温:</span>
                    <span className="text-xs text-warning font-mono">
                      +{route.tempRiseEstimate.toFixed(1)}℃
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coffee className="w-3.5 h-3.5 text-info" />
                    <span className="text-xs text-deep-blue-600">服务区:</span>
                    <span className="text-xs text-white font-mono">
                      {route.nearestServiceAreaDistance}km
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-deep-blue-600 mb-1">
                    <span>超温概率</span>
                    <span className={
                      route.overheatProbability > 60 ? 'text-danger' :
                      route.overheatProbability > 30 ? 'text-warning' : 'text-success'
                    }>
                      {route.overheatProbability}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-deep-blue-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${route.overheatProbability}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                      className={`h-full rounded-full ${
                        route.overheatProbability > 60 ? 'bg-danger' :
                        route.overheatProbability > 30 ? 'bg-warning' : 'bg-success'
                      }`}
                    />
                  </div>
                </div>

                {isSelected && !isOriginal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-deep-blue-700"
                  >
                    <Button
                      variant="success"
                      fullWidth
                      icon={TrendingDown}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSuggestDetour();
                      }}
                    >
                      建议绕行此路线
                    </Button>
                  </motion.div>
                )}

                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <ChevronRight className={`w-5 h-5 transition-colors ${
                    isSelected ? 'text-info' : 'text-deep-blue-600'
                  }`} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {selectedRoute && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-deep-blue-800/50 rounded-lg border border-deep-blue-700"
        >
          <div className="flex items-center gap-2 mb-3">
            <Map className="w-5 h-5 text-info" />
            <span className="text-sm font-medium text-white">路线预览：{selectedRoute.name}</span>
          </div>
          
          {selectedRoute.riskSegments && selectedRoute.riskSegments.length > 0 ? (
            <div className="space-y-2">
              <div className="flex gap-2 text-xs mb-2">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-success rounded" />
                  <span className="text-deep-blue-600">正常路段</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-warning rounded" />
                  <span className="text-deep-blue-600">拥堵/停车</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-danger rounded" />
                  <span className="text-deep-blue-600">高温路段</span>
                </span>
              </div>
              <div className="flex items-stretch gap-0.5 h-8 rounded overflow-hidden">
                {selectedRoute.riskSegments.map((seg: any, idx: number) => {
                  const isRisk = seg.type !== 'normal';
                  const bgColor = 
                    seg.type === 'hotspot' ? 'bg-danger' :
                    seg.type === 'congestion' ? 'bg-warning' :
                    seg.type === 'long_stop' ? 'bg-warning' :
                    'bg-success';
                  const widthPct = Math.max(8, Math.round((seg.lengthMileage || 10) / selectedRoute.remainingMileage * 100));
                  return (
                    <motion.div
                      key={idx}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      className={`${bgColor} relative group cursor-pointer`}
                      style={{ width: `${widthPct}%` }}
                      title={`${getRouteSegmentLabel(seg.type)}：${seg.description}${seg.estimatedTempRise ? `，预计升温+${seg.estimatedTempRise.toFixed(1)}℃` : ''}`}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-deep-blue rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {getRouteSegmentLabel(seg.type)}
                        {seg.estimatedTempRise && ` +${seg.estimatedTempRise.toFixed(1)}℃`}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                {selectedRoute.riskSegments.filter((s: any) => s.type !== 'normal').slice(0, 4).map((seg: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-deep-blue-800 rounded">
                    <span className={`w-2 h-2 mt-1 rounded-full ${
                      seg.type === 'hotspot' ? 'bg-danger' : 'bg-warning'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-white truncate">{seg.description}</p>
                      {seg.estimatedTempRise && (
                        <p className="text-warning font-mono">+{seg.estimatedTempRise.toFixed(1)}℃</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-16 bg-success/10 rounded text-success text-sm">
              <Check className="w-4 h-4 mr-2" />
              该路线无风险路段，温度安全
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {showConfirm && selectedRoute && (
          <Modal
            isOpen={showConfirm}
            onClose={() => !processing && setShowConfirm(false)}
            title="确认发送绕行建议"
          >
            <div className="space-y-4">
              <div className="p-4 bg-deep-blue-800 rounded-lg border border-deep-blue-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                    <Route className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-deep-blue-600">推荐路线</p>
                    <p className="text-lg font-bold text-white">{selectedRoute.name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-deep-blue-600">剩余里程</span>
                    <span className="text-white font-mono">{formatMileage(selectedRoute.remainingMileage)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-deep-blue-600">预计到达</span>
                    <span className="text-white font-mono">{formatTime(selectedRoute.estimatedArrival)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-deep-blue-600">超温概率</span>
                    <span className="text-success font-mono">{selectedRoute.overheatProbability}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-deep-blue-600">风险路段</span>
                    <span className="text-white">{(selectedRoute as any).riskCount} 处</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-warning">绕行原因</p>
                    <p className="text-xs text-white mt-1">
                      {vehicle.nearestRisk
                        ? `原路线前方${vehicle.nearestRisk.distance}公里处${vehicle.nearestRisk.description}，预计升温+${vehicle.nearestRisk.estimatedTempRise.toFixed(1)}℃`
                        : '为规避潜在风险，建议选择更安全的路线'}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-deep-blue-600">
                系统将自动生成处置记录，包含绕行原因和推荐路线信息，方便班后复盘。
              </p>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowConfirm(false)}
                  disabled={processing}
                >
                  取消
                </Button>
                <Button
                  variant="success"
                  fullWidth
                  onClick={confirmDetour}
                  disabled={processing}
                  icon={processing ? undefined : Check}
                >
                  {processing ? '发送中...' : '确认发送'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};
