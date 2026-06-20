import type { DisposalRecord, DisposalType } from '@/types';

const now = new Date();

export const mockDisposalRecords: DisposalRecord[] = [
  {
    id: 'dr001',
    vehicleId: 'v003',
    plateNumber: '粤A·7H521',
    type: 'notify_driver',
    description: '广州环城高速拥堵，车厢温度升至5.8℃，已通知司机检查制冷机运行状态',
    operator: '调度员-李明',
    timestamp: new Date(now.getTime() - 12 * 60 * 1000),
    status: 'completed',
    result: '司机反馈制冷机正常，开启备用制冷机组',
  },
  {
    id: 'dr002',
    vehicleId: 'v008',
    plateNumber: '冀A·7B901',
    type: 'suggest_detour',
    description: 'G4京港澳高速事故拥堵，建议绕行G45大广高速',
    operator: '调度员-王芳',
    timestamp: new Date(now.getTime() - 8 * 60 * 1000),
    status: 'pending',
  },
  {
    id: 'dr003',
    vehicleId: 'v002',
    plateNumber: '苏B·3K289',
    type: 'delay_receipt',
    description: '途经历史高温路段，预计到达时间延迟30分钟，已联系收货方',
    operator: '调度员-张伟',
    timestamp: new Date(now.getTime() - 25 * 60 * 1000),
    status: 'completed',
    result: '收货方同意延后验收',
  },
  {
    id: 'dr004',
    vehicleId: 'v005',
    plateNumber: '川A·9D876',
    type: 'notify_driver',
    description: 'G76厦蓉高速施工缓行，温度接近上限，提醒司机关注温度变化',
    operator: '调度员-陈静',
    timestamp: new Date(now.getTime() - 18 * 60 * 1000),
    status: 'completed',
    result: '司机已确认，将密切监控温度',
  },
  {
    id: 'dr005',
    vehicleId: 'v003',
    plateNumber: '粤A·7H521',
    type: 'other',
    description: '联系最近服务区冷库，做好应急卸货准备',
    operator: '调度员-李明',
    timestamp: new Date(now.getTime() - 5 * 60 * 1000),
    status: 'pending',
  },
];

export const generateDisposalRecord = (
  vehicleId: string,
  plateNumber: string,
  type: DisposalType,
  description: string,
  operator: string
): DisposalRecord => {
  const typeDescriptions: Record<DisposalType, string> = {
    notify_driver: '已通知司机检查制冷机运行状态',
    suggest_detour: '已建议司机改道绕行',
    delay_receipt: '已联系收货方协商延后验收',
    other: description,
  };

  return {
    id: `dr-${Date.now()}`,
    vehicleId,
    plateNumber,
    type,
    description: typeDescriptions[type],
    operator,
    timestamp: new Date(),
    status: 'pending',
  };
};
