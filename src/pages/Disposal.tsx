import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  Phone,
  Navigation,
  MessageSquare,
  TrendingDown,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { StatsCard } from '@/components/common/StatsCard';
import { DisposalRecordList } from '@/components/disposal/DisposalRecordList';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { Button } from '@/components/common/Button';

export default function Disposal() {
  const { disposalRecords, getFilteredVehicles, updateDisposalRecordStatus } = useAppStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending');

  const vehicles = getFilteredVehicles();
  const alertVehicles = vehicles.filter((v) => v.currentStatus === 'alert');
  const warningVehicles = vehicles.filter((v) => v.currentStatus === 'warning');

  const pendingRecords = disposalRecords.filter((r) => r.status === 'pending');
  const completedRecords = disposalRecords.filter((r) => r.status === 'completed');

  const displayedRecords =
    activeTab === 'all'
      ? disposalRecords
      : activeTab === 'pending'
      ? pendingRecords
      : completedRecords;

  const handleMarkComplete = (id: string) => {
    updateDisposalRecordStatus(id, 'completed', '已完成处置，司机反馈正常');
  };

  const quickActions = [
    {
      icon: Phone,
      label: '批量通知司机',
      desc: '向所有预警车辆发送检查通知',
      count: warningVehicles.length + alertVehicles.length,
      color: 'warning',
    },
    {
      icon: Navigation,
      label: '批量建议绕行',
      desc: '向经过风险路段车辆发送绕行建议',
      count: alertVehicles.length,
      color: 'danger',
    },
    {
      icon: MessageSquare,
      label: '联系收货方',
      desc: '批量通知可能延误的收货方',
      count: Math.round(vehicles.length * 0.3),
      color: 'info',
    },
  ];

  const tabs = [
    { id: 'pending', label: '待处理', count: pendingRecords.length, color: 'warning' },
    { id: 'completed', label: '已完成', count: completedRecords.length, color: 'success' },
    { id: 'all', label: '全部记录', count: disposalRecords.length, color: 'info' },
  ] as const;

  return (
    <div className="h-full flex flex-col bg-deep-blue overflow-hidden">
      <div className="p-4 border-b border-deep-blue-700 bg-deep-blue-800/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">预警处置中心</h1>
            <p className="text-sm text-deep-blue-600 mt-1">管理和跟踪所有预警车辆的处置措施</p>
          </div>
          <Button variant="secondary" icon={Download}>
            导出处置记录
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="待处置预警"
            value={pendingRecords.length}
            icon={Clock}
            color="warning"
            delay={0}
          />
          <StatsCard
            title="已完成处置"
            value={completedRecords.length}
            icon={CheckCircle}
            color="success"
            delay={0.1}
          />
          <StatsCard
            title="告警车辆"
            value={alertVehicles.length}
            icon={AlertTriangle}
            color="danger"
            delay={0.2}
          />
          <StatsCard
            title="处置率"
            value={
              disposalRecords.length > 0
                ? Math.round((completedRecords.length / disposalRecords.length) * 100)
                : 0
            }
            icon={TrendingDown}
            color="info"
            delay={0.3}
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-deep-blue-700">
            <div className="flex items-center gap-2 mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? tab.color === 'warning'
                        ? 'bg-warning/20 text-warning border border-warning/30'
                        : tab.color === 'success'
                        ? 'bg-success/20 text-success border border-success/30'
                        : 'bg-info/20 text-info border border-info/30'
                      : 'bg-deep-blue-800/50 text-deep-blue-600 hover:text-white border border-transparent'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                      activeTab === tab.id
                        ? tab.color === 'warning'
                          ? 'bg-warning/30'
                          : tab.color === 'success'
                          ? 'bg-success/30'
                          : 'bg-info/30'
                        : 'bg-deep-blue-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="bg-deep-blue-800/30 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                需要立即处置的车辆
              </h3>
              {alertVehicles.length + warningVehicles.length === 0 ? (
                <div className="text-center py-6 text-success">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">暂无需要立即处置的车辆</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[...alertVehicles, ...warningVehicles].map((vehicle, index) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} />
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-deep-blue-800/50 border border-deep-blue-700 rounded-lg p-4 text-left hover:border-info/50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          action.color === 'warning'
                            ? 'bg-warning/20 text-warning'
                            : action.color === 'danger'
                            ? 'bg-danger/20 text-danger'
                            : 'bg-info/20 text-info'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white group-hover:text-info transition-colors">
                            {action.label}
                          </h4>
                          {action.count > 0 && (
                            <span className="text-xs bg-deep-blue-700 text-deep-blue-600 px-2 py-0.5 rounded">
                              {action.count} 辆
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-deep-blue-600 mt-1">{action.desc}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-info" />
              处置记录
            </h3>
            <DisposalRecordList records={displayedRecords} showFilters={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
