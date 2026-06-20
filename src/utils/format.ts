import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { VehicleStatus, CargoType, DisposalType, RouteSegmentType, RiskReason, DisposalRecord } from '@/types';
import { RISK_REASON_LABELS, ROUTE_SEGMENT_LABELS, FOLLOW_UP_STATUS_LABELS } from '@/types';

export const formatTemperature = (temp: number): string => {
  return `${temp > 0 ? '+' : ''}${temp.toFixed(1)}℃`;
};

export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm', { locale: zhCN });
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'MM-dd HH:mm', { locale: zhCN });
};

export const formatFullDateTime = (date: Date): string => {
  return format(date, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}小时${minutes}分钟`;
};

export const formatMileage = (km: number): string => {
  return `${km.toFixed(0)}公里`;
};

export const getStatusColor = (status: VehicleStatus): string => {
  switch (status) {
    case 'normal':
      return 'text-success';
    case 'warning':
      return 'text-warning';
    case 'alert':
      return 'text-danger';
    default:
      return 'text-success';
  }
};

export const getStatusBgColor = (status: VehicleStatus): string => {
  switch (status) {
    case 'normal':
      return 'bg-success/20 border-success';
    case 'warning':
      return 'bg-warning/20 border-warning';
    case 'alert':
      return 'bg-danger/20 border-danger';
    default:
      return 'bg-success/20 border-success';
  }
};

export const getStatusDotColor = (status: VehicleStatus): string => {
  switch (status) {
    case 'normal':
      return 'bg-success';
    case 'warning':
      return 'bg-warning';
    case 'alert':
      return 'bg-danger';
    default:
      return 'bg-success';
  }
};

export const getStatusLabel = (status: VehicleStatus): string => {
  switch (status) {
    case 'normal':
      return '正常';
    case 'warning':
      return '预警';
    case 'alert':
      return '告警';
    default:
      return '正常';
  }
};

export const getCargoTypeLabel = (type: CargoType): string => {
  const labels: Record<CargoType, string> = {
    frozen: '冷冻品',
    chilled: '冷藏品',
    pharmaceutical: '医药冷链',
    fresh: '生鲜果蔬',
  };
  return labels[type] || type;
};

export const getDisposalTypeLabel = (type: DisposalType): string => {
  const labels: Record<DisposalType, string> = {
    notify_driver: '通知司机',
    suggest_detour: '建议绕行',
    delay_receipt: '延后验收',
    other: '其他处置',
  };
  return labels[type] || type;
};

export const getRouteSegmentColor = (type: RouteSegmentType): string => {
  switch (type) {
    case 'normal':
      return '#38BDF8';
    case 'congestion':
      return '#F59E0B';
    case 'hotspot':
      return '#EF4444';
    default:
      return '#38BDF8';
  }
};

export const getRouteSegmentLabel = (type: RouteSegmentType): string => {
  const labels: Record<RouteSegmentType, string> = {
    normal: '正常路段',
    congestion: '拥堵路段',
    hotspot: '历史高温路段',
    long_stop: '长时间停车',
  };
  return labels[type] || type;
};

export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  return format(date, 'MM-dd', { locale: zhCN });
};

export const getRiskReasonLabel = (reason: RiskReason): string => {
  return RISK_REASON_LABELS[reason] || reason;
};

export const getRiskReasonColor = (reason: RiskReason): string => {
  switch (reason) {
    case 'congestion':
      return 'text-warning';
    case 'hotspot':
      return 'text-danger';
    case 'long_stop':
      return 'text-warning';
    case 'temperature':
      return 'text-info';
    case 'door_open':
      return 'text-danger';
    default:
      return 'text-info';
  }
};

export const getFollowUpStatusLabel = (status: string): string => {
  return FOLLOW_UP_STATUS_LABELS[status] || status;
};

export const getFollowUpStatusColor = (status: string): string => {
  switch (status) {
    case 'improving':
      return 'text-success';
    case 'stable':
      return 'text-info';
    case 'worsening':
      return 'text-warning';
    case 'resolved':
      return 'text-success';
    default:
      return 'text-deep-blue-600';
  }
};

export const getRouteSegmentBgClass = (type: RouteSegmentType): string => {
  switch (type) {
    case 'normal':
      return 'bg-info/10';
    case 'congestion':
      return 'bg-warning/10';
    case 'hotspot':
      return 'bg-danger/10';
    case 'long_stop':
      return 'bg-warning/10';
    default:
      return 'bg-info/10';
  }
};

export const formatDurationMinutes = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`;
};
