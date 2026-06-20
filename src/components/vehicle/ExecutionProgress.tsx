import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  Navigation,
  Thermometer,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Send,
  Edit3,
  UserCheck,
  Route,
  Activity,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { DisposalRecord, Vehicle } from '@/types';
import {
  DRIVER_CONFIRM_STATUS_LABELS,
  DETOUR_EXECUTION_STATUS_LABELS,
  EXECUTION_FOLLOW_UP_LABELS,
  DISPOSAL_TYPE_LABELS,
} from '@/types';
import {
  formatTemperature,
  formatFullDateTime,
} from '@/utils/format';
import { Button } from '@/components/common/Button';

interface ExecutionProgressProps {
  vehicle: Vehicle;
  compact?: boolean;
}

export const ExecutionProgress = ({ vehicle, compact = false }: ExecutionProgressProps) => {
  const {
    disposalRecords,
    updateDriverConfirmStatus,
    updateDetourExecutionStatus,
    updateExecutionFollowUp,
    updateDisposalRecordStatus,
  } = useAppStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editTemp, setEditTemp] = useState<{ id: string; value: string } | null>(null);

  const vehicleRecords = disposalRecords
    .filter((r) => r.vehicleId === vehicle.id)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (vehicleRecords.length === 0) {
    return (
      <div className="text-center py-6 text-deep-blue-600">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无处置记录的执行跟踪</p>
      </div>
    );
  }

  const getDriverConfirmColor = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-success bg-success/10 border-success/30';
      case 'rejected':
        return 'text-danger bg-danger/10 border-danger/30';
      default:
        return 'text-warning bg-warning/10 border-warning/30';
    }
  };

  const getDetourExecColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'text-success bg-success/10 border-success/30';
      case 'in_progress':
        return 'text-info bg-info/10 border-info/30';
      case 'cancelled':
        return 'text-danger bg-danger/10 border-danger/30';
      default:
        return 'text-deep-blue-600 bg-deep-blue-700/50 border-deep-blue-700';
    }
  };

  const getExecFollowColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'text-success bg-success/10 border-success/30';
      case 'in_progress':
        return 'text-info bg-info/10 border-info/30';
      case 'failed':
        return 'text-danger bg-danger/10 border-danger/30';
      default:
        return 'text-deep-blue-600 bg-deep-blue-700/50 border-deep-blue-700';
    }
  };

  const handleSaveTemp = (record: DisposalRecord) => {
    if (!editTemp) return;
    const tempAfter = parseFloat(editTemp.value);
    if (!isNaN(tempAfter) && record.temperatureBefore !== undefined) {
      const trend = tempAfter - record.temperatureBefore;
      const followUpStatus =
        trend < -0.3
          ? 'improving'
          : trend < 0.3
          ? 'stable'
          : 'worsening';
      const execFollowUpStatus =
        trend < 0.3
          ? 'completed'
          : 'in_progress';
      updateExecutionFollowUp(record.id, {
        temperatureAfter: tempAfter,
        temperatureTrend: Number(trend.toFixed(2)),
        followUpStatus,
        executionFollowUpStatus: execFollowUpStatus as any,
      });
    }
    setEditTemp(null);
  };

  return (
    <div className="space-y-3">
      {vehicleRecords.slice(0, compact ? 3 : undefined).map((record, idx) => {
        const isExpanded = expandedId === record.id;

        return (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-deep-blue-800/50 border border-deep-blue-700 rounded-lg overflow-hidden"
          >
            <div
              className="p-3 cursor-pointer hover:bg-deep-blue-800 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : record.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  record.type === 'suggest_detour' ? 'bg-purple-500/20 text-purple-400' :
                  record.type === 'notify_driver' ? 'bg-info/20 text-info' :
                  'bg-warning/20 text-warning'
                }`}>
                  {record.type === 'suggest_detour' ? (
                    <Navigation className="w-5 h-5" />
                  ) : record.type === 'notify_driver' ? (
                    <Car className="w-5 h-5" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-white">
                      {DISPOSAL_TYPE_LABELS[record.type]}
                    </span>
                    {record.driverConfirmStatus && (
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${getDriverConfirmColor(record.driverConfirmStatus)}`}>
                        {DRIVER_CONFIRM_STATUS_LABELS[record.driverConfirmStatus]}
                      </span>
                    )}
                    {record.detourExecutionStatus && (
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${getDetourExecColor(record.detourExecutionStatus)}`}>
                        {DETOUR_EXECUTION_STATUS_LABELS[record.detourExecutionStatus]}
                      </span>
                    )}
                    {record.executionFollowUpStatus && (
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${getExecFollowColor(record.executionFollowUpStatus)}`}>
                        {EXECUTION_FOLLOW_UP_LABELS[record.executionFollowUpStatus]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-deep-blue-600 truncate">{record.description}</p>
                  <p className="text-xs text-deep-blue-700 mt-1 font-mono">
                    {formatFullDateTime(record.timestamp)}
                  </p>
                </div>

                <div className="flex-shrink-0 ml-2">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-deep-blue-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-deep-blue-600" />
                  )}
                </div>
              </div>
            </div>

            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-4 pt-0 border-t border-deep-blue-700/50">
                  <div className="pt-4 space-y-4">
                    {record.type === 'notify_driver' || record.type === 'suggest_detour' ? (
                      <div>
                        <div className="text-xs text-deep-blue-600 mb-2 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          司机确认
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateDriverConfirmStatus(record.id, 'pending');
                            }}
                            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                              record.driverConfirmStatus === 'pending' || !record.driverConfirmStatus
                                ? 'bg-warning/20 text-warning border-warning/40'
                                : 'bg-deep-blue-700 text-deep-blue-600 border-deep-blue-700 hover:text-white'
                            }`}
                          >
                            <Clock className="w-3 h-3 inline mr-1" />
                            待确认
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateDriverConfirmStatus(record.id, 'confirmed');
                            }}
                            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                              record.driverConfirmStatus === 'confirmed'
                                ? 'bg-success/20 text-success border-success/40'
                                : 'bg-deep-blue-700 text-deep-blue-600 border-deep-blue-700 hover:text-white'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3 inline mr-1" />
                            司机已确认
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateDriverConfirmStatus(record.id, 'rejected');
                            }}
                            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                              record.driverConfirmStatus === 'rejected'
                                ? 'bg-danger/20 text-danger border-danger/40'
                                : 'bg-deep-blue-700 text-deep-blue-600 border-deep-blue-700 hover:text-white'
                            }`}
                          >
                            <XCircle className="w-3 h-3 inline mr-1" />
                            司机已拒绝
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {record.type === 'suggest_detour' && (
                      <div>
                        <div className="text-xs text-deep-blue-600 mb-2 flex items-center gap-1">
                          <Route className="w-3.5 h-3.5" />
                          改线执行
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateDetourExecutionStatus(vehicle.id, record.id, 'not_started');
                            }}
                            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                              record.detourExecutionStatus === 'not_started' || !record.detourExecutionStatus
                                ? 'bg-deep-blue-700 text-white border-deep-blue-600'
                                : 'bg-deep-blue-700/50 text-deep-blue-600 border-deep-blue-700 hover:text-white'
                            }`}
                          >
                            未开始
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateDetourExecutionStatus(vehicle.id, record.id, 'in_progress');
                            }}
                            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                              record.detourExecutionStatus === 'in_progress'
                                ? 'bg-info/20 text-info border-info/40'
                                : 'bg-deep-blue-700/50 text-deep-blue-600 border-deep-blue-700 hover:text-white'
                            }`}
                          >
                            <Activity className="w-3 h-3 inline mr-1" />
                            执行中
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateDetourExecutionStatus(vehicle.id, record.id, 'completed');
                            }}
                            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                              record.detourExecutionStatus === 'completed'
                                ? 'bg-success/20 text-success border-success/40'
                                : 'bg-deep-blue-700/50 text-deep-blue-600 border-deep-blue-700 hover:text-white'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3 inline mr-1" />
                            改线完成
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateDetourExecutionStatus(vehicle.id, record.id, 'cancelled');
                            }}
                            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                              record.detourExecutionStatus === 'cancelled'
                                ? 'bg-danger/20 text-danger border-danger/40'
                                : 'bg-deep-blue-700/50 text-deep-blue-600 border-deep-blue-700 hover:text-white'
                            }`}
                          >
                            <XCircle className="w-3 h-3 inline mr-1" />
                            取消改线
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-xs text-deep-blue-600 mb-2 flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5" />
                        处置后温度
                      </div>
                      <div className="flex items-center gap-3">
                        {record.temperatureBefore !== undefined && (
                          <div className="text-sm">
                            <span className="text-deep-blue-600 text-xs">处置前：</span>
                            <span className={`font-mono font-medium ${
                              record.temperatureBefore > record.tempRange?.max! ? 'text-danger' :
                              record.temperatureBefore > record.tempRange?.max! - 0.5 ? 'text-warning' : 'text-success'
                            }`}>
                              {formatTemperature(record.temperatureBefore)}
                            </span>
                          </div>
                        )}

                        {editTemp && editTemp.id === record.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.1"
                              value={editTemp.value}
                              onChange={(e) => setEditTemp({ id: record.id, value: e.target.value })}
                              className="w-20 px-2 py-1 bg-deep-blue-700 border border-deep-blue-600 rounded text-white text-sm font-mono focus:outline-none focus:border-info"
                              placeholder="如 2.5"
                            />
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveTemp(record);
                              }}
                            >
                              保存
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditTemp(null);
                              }}
                            >
                              取消
                            </Button>
                          </div>
                        ) : (
                          <>
                            {record.temperatureAfter !== undefined ? (
                              <div className="text-sm">
                                <span className="text-deep-blue-600 text-xs">处置后：</span>
                                <span className={`font-mono font-bold ${
                                  record.temperatureAfter > record.tempRange?.max! ? 'text-danger' :
                                  record.temperatureAfter > record.tempRange?.max! - 0.5 ? 'text-warning' : 'text-success'
                                }`}>
                                  {formatTemperature(record.temperatureAfter)}
                                </span>
                                {record.temperatureTrend !== undefined && (
                                  <span className={`ml-2 text-xs font-medium ${
                                    record.temperatureTrend < -0.3 ? 'text-success' :
                                    record.temperatureTrend > 0.3 ? 'text-danger' : 'text-warning'
                                  }`}>
                                    ({record.temperatureTrend > 0 ? '+' : ''}
                                    {record.temperatureTrend.toFixed(1)}℃)
                                  </span>
                                )}
                              </div>
                            ) : null}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditTemp({
                                  id: record.id,
                                  value: record.temperatureAfter?.toString() || vehicle.currentTemp.toString(),
                                });
                              }}
                              className="p-1 text-deep-blue-600 hover:text-info hover:bg-deep-blue-700 rounded transition-colors"
                              title="编辑处置后温度"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {record.temperatureAfter !== undefined && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateExecutionFollowUp(record.id, {
                              followUpStatus: 'improving',
                              executionFollowUpStatus: 'completed',
                            });
                            updateDisposalRecordStatus(
                              record.id,
                              'completed',
                              '处置完成，温度已下降至安全范围',
                              'improving'
                            );
                          }}
                          className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                            record.followUpStatus === 'improving'
                              ? 'bg-success/20 text-success border-success/40'
                              : 'bg-deep-blue-700 text-deep-blue-600 border-deep-blue-700 hover:text-white'
                          }`}
                        >
                          ✓ 温度下降
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateExecutionFollowUp(record.id, {
                              followUpStatus: 'stable',
                              executionFollowUpStatus: 'completed',
                            });
                            updateDisposalRecordStatus(
                              record.id,
                              'completed',
                              '处置完成，温度保持稳定',
                              'stable'
                            );
                          }}
                          className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                            record.followUpStatus === 'stable'
                              ? 'bg-info/20 text-info border-info/40'
                              : 'bg-deep-blue-700 text-deep-blue-600 border-deep-blue-700 hover:text-white'
                          }`}
                        >
                          ~ 温度稳定
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateExecutionFollowUp(record.id, {
                              followUpStatus: 'worsening',
                              executionFollowUpStatus: 'in_progress',
                            });
                          }}
                          className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                            record.followUpStatus === 'worsening'
                              ? 'bg-warning/20 text-warning border-warning/40'
                              : 'bg-deep-blue-700 text-deep-blue-600 border-deep-blue-700 hover:text-white'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          温度继续升高
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateExecutionFollowUp(record.id, {
                              followUpStatus: 'resolved',
                              executionFollowUpStatus: 'completed',
                            });
                            updateDisposalRecordStatus(
                              record.id,
                              'completed',
                              '问题已完全解决，温度正常',
                              'resolved'
                            );
                          }}
                          className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                            record.followUpStatus === 'resolved'
                              ? 'bg-success/20 text-success border-success/40'
                              : 'bg-deep-blue-700 text-deep-blue-600 border-deep-blue-700 hover:text-white'
                          }`}
                        >
                          ✅ 已解决
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
