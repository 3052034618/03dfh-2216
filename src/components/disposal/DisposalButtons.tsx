import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Phone, Navigation, Clock, MessageSquare, Check } from 'lucide-react';
import type { DisposalType, Vehicle } from '@/types';
import { useAppStore } from '@/store';
import { DISPOSAL_TYPE_LABELS } from '@/types';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

interface DisposalButtonsProps {
  vehicleId: string;
  compact?: boolean;
}

export const DisposalButtons = ({ vehicleId, compact = false }: DisposalButtonsProps) => {
  const [confirmModal, setConfirmModal] = useState<{ type: DisposalType; open: boolean }>({
    type: 'notify_driver',
    open: false,
  });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const vehicles = useAppStore((state) => state.vehicles);
  const vehicle = useMemo(() => vehicles.find((v) => v.id === vehicleId), [vehicles, vehicleId]);
  const addDisposalRecord = useAppStore((state) => state.addDisposalRecord);

  if (!vehicle) return null;

  const handleDispose = (type: DisposalType) => {
    setConfirmModal({ type, open: true });
  };

  const confirmDispose = async () => {
    setProcessing(true);
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    addDisposalRecord(vehicleId, confirmModal.type);
    
    setProcessing(false);
    setConfirmModal({ type: 'notify_driver', open: false });
    setSuccess(DISPOSAL_TYPE_LABELS[confirmModal.type]);
    
    setTimeout(() => setSuccess(null), 3000);
  };

  const buttons = [
    {
      type: 'notify_driver' as DisposalType,
      label: '通知司机检查制冷机',
      icon: Phone,
      variant: 'warning' as const,
      color: 'from-warning to-warning/80',
    },
    {
      type: 'suggest_detour' as DisposalType,
      label: '建议绕行',
      icon: Navigation,
      variant: 'primary' as const,
      color: 'from-info to-info/80',
    },
    {
      type: 'delay_receipt' as DisposalType,
      label: '联系收货方延后验收',
      icon: Clock,
      variant: 'secondary' as const,
      color: 'from-deep-blue-600 to-deep-blue-700',
    },
  ];

  return (
    <div className={compact ? '' : 'space-y-4'}>
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-2 bg-success/20 text-success px-4 py-3 rounded-lg mb-4"
        >
          <Check className="w-5 h-5" />
          <span className="text-sm font-medium">已成功{success}</span>
        </motion.div>
      )}

      {compact ? (
        <div className="flex gap-2">
          {buttons.map((btn) => {
            const Icon = btn.icon;
            return (
              <Button
                key={btn.type}
                variant={btn.variant}
                size="sm"
                icon={Icon}
                onClick={() => handleDispose(btn.type)}
              >
                {btn.label}
              </Button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {buttons.map((btn, index) => {
            const Icon = btn.icon;
            return (
              <motion.button
                key={btn.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -2, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDispose(btn.type)}
                className={`relative group bg-gradient-to-br ${btn.color} p-6 rounded-xl text-white text-left overflow-hidden`}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{btn.label}</h3>
                  <p className="text-sm text-white/70">
                    点击生成处置记录并通知相关人员
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ type: 'notify_driver', open: false })}
        title="确认处置"
      >
        <div className="space-y-4">
          <div className="bg-deep-blue-700/50 rounded-lg p-4">
            <p className="text-sm text-deep-blue-600 mb-1">车辆</p>
            <p className="text-white font-mono font-semibold">{vehicle.plateNumber}</p>
          </div>
          
          <div className="bg-deep-blue-700/50 rounded-lg p-4">
            <p className="text-sm text-deep-blue-600 mb-1">处置类型</p>
            <p className="text-white font-semibold">{DISPOSAL_TYPE_LABELS[confirmModal.type]}</p>
          </div>

          <div className="bg-info/10 border border-info/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-info font-medium mb-1">系统将自动生成以下处置记录：</p>
                <p className="text-sm text-deep-blue-600">
                  车牌 {vehicle.plateNumber} - {DISPOSAL_TYPE_LABELS[confirmModal.type]}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setConfirmModal({ type: 'notify_driver', open: false })}
              disabled={processing}
            >
              取消
            </Button>
            <Button
              variant={confirmModal.type === 'notify_driver' ? 'warning' : confirmModal.type === 'suggest_detour' ? 'primary' : 'secondary'}
              className="flex-1"
              onClick={confirmDispose}
              disabled={processing}
              icon={processing ? undefined : Check}
            >
              {processing ? '处理中...' : '确认处置'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
