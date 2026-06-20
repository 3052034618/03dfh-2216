import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, User, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import type { DisposalRecord, DisposalType } from '@/types';
import { getDisposalTypeLabel, formatFullDateTime, getRelativeTime } from '@/utils/format';
import { DISPOSAL_TYPE_LABELS } from '@/types';

interface DisposalRecordListProps {
  records: DisposalRecord[];
  showFilters?: boolean;
}

export const DisposalRecordList = ({ records, showFilters = true }: DisposalRecordListProps) => {
  const [typeFilter, setTypeFilter] = useState<DisposalType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredRecords = records.filter((record) => {
    if (typeFilter !== 'all' && record.type !== typeFilter) return false;
    if (statusFilter !== 'all' && record.status !== statusFilter) return false;
    return true;
  });

  const typeOptions = [
    { value: 'all', label: '全部类型' },
    ...(Object.keys(DISPOSAL_TYPE_LABELS) as DisposalType[]).map((type) => ({
      value: type,
      label: DISPOSAL_TYPE_LABELS[type],
    })),
  ];

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'pending', label: '待处理' },
    { value: 'completed', label: '已完成' },
  ];

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-deep-blue-600">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-lg font-medium">暂无处置记录</p>
        <p className="text-sm mt-1">当有预警车辆需要处置时，记录会显示在这里</p>
      </div>
    );
  }

  return (
    <div>
      {showFilters && (
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-deep-blue-800/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-info" />
            <span className="text-sm text-deep-blue-600">筛选:</span>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as DisposalType | 'all')}
            className="px-3 py-1.5 bg-deep-blue-700 border border-deep-blue-600 rounded-md text-sm text-white focus:outline-none focus:border-info"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'completed')}
            className="px-3 py-1.5 bg-deep-blue-700 border border-deep-blue-600 rounded-md text-sm text-white focus:outline-none focus:border-info"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="ml-auto text-sm text-deep-blue-600">
            共 {filteredRecords.length} 条记录
          </span>
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredRecords.map((record, index) => {
            const isExpanded = expandedId === record.id;
            const StatusIcon = record.status === 'completed' ? CheckCircle : AlertCircle;
            const statusColor = record.status === 'completed' ? 'text-success' : 'text-warning';
            const statusBg = record.status === 'completed' ? 'bg-success/10' : 'bg-warning/10';

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                layout
                className="bg-deep-blue-800 border border-deep-blue-700 rounded-lg overflow-hidden hover:border-deep-blue-600 transition-colors"
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${statusBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono font-semibold text-white">
                          {record.plateNumber}
                        </span>
                        <span className="text-xs bg-info/10 text-info px-2 py-0.5 rounded">
                          {getDisposalTypeLabel(record.type)}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${statusBg} ${statusColor}`}
                        >
                          {record.status === 'completed' ? '已完成' : '待处理'}
                        </span>
                      </div>
                      <p className="text-sm text-deep-blue-600 truncate">{record.description}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-deep-blue-600">{getRelativeTime(record.timestamp)}</p>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-deep-blue-600 ml-auto mt-1" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-deep-blue-600 ml-auto mt-1" />
                      )}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 border-t border-deep-blue-700/50">
                        <div className="pt-4 grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-deep-blue-600" />
                            <span className="text-deep-blue-600">操作人:</span>
                            <span className="text-white">{record.operator}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-deep-blue-600" />
                            <span className="text-deep-blue-600">操作时间:</span>
                            <span className="text-white font-mono">
                              {formatFullDateTime(record.timestamp)}
                            </span>
                          </div>
                        </div>
                        {record.result && (
                          <div className="mt-3 p-3 bg-success/10 border border-success/30 rounded-lg">
                            <p className="text-xs text-success font-medium mb-1">处置结果</p>
                            <p className="text-sm text-white">{record.result}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
