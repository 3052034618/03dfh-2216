export type VehicleStatus = 'normal' | 'warning' | 'alert';
export type CargoType = 'frozen' | 'chilled' | 'pharmaceutical' | 'fresh';
export type DisposalType = 'notify_driver' | 'suggest_detour' | 'delay_receipt' | 'other';
export type DoorEventType = 'open' | 'close';
export type RouteSegmentType = 'normal' | 'congestion' | 'hotspot';

export interface Position {
  lat: number;
  lng: number;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  fleet: string;
  cargoType: CargoType;
  targetTempMin: number;
  targetTempMax: number;
  currentTemp: number;
  currentStatus: VehicleStatus;
  remainingMileage: number;
  totalMileage: number;
  estimatedArrival: Date;
  currentPosition: Position;
  route: Position[];
  driverName: string;
  driverPhone: string;
  cargoDescription: string;
}

export interface TemperatureReading {
  id: string;
  vehicleId: string;
  temperature: number;
  timestamp: Date;
}

export interface DoorEvent {
  id: string;
  vehicleId: string;
  type: DoorEventType;
  timestamp: Date;
  duration?: number;
}

export interface RouteSegment {
  id: string;
  vehicleId: string;
  type: RouteSegmentType;
  description: string;
  startMileage: number;
  endMileage: number;
  estimatedTempRise: number;
  estimatedOverheatTime?: number;
}

export interface ServiceArea {
  id: string;
  name: string;
  position: Position;
  distanceFromVehicle: number;
  estimatedArrival: number;
  hasCharging: boolean;
  hasRestaurant: boolean;
}

export interface DisposalRecord {
  id: string;
  vehicleId: string;
  plateNumber: string;
  type: DisposalType;
  description: string;
  operator: string;
  timestamp: Date;
  status: 'pending' | 'completed';
  result?: string;
}

export interface FilterState {
  fleet: string | null;
  cargoType: CargoType | null;
  arrivalTime: Date | null;
  searchQuery: string;
}

export const CARGO_TYPE_LABELS: Record<CargoType, string> = {
  frozen: '冷冻品',
  chilled: '冷藏品',
  pharmaceutical: '医药冷链',
  fresh: '生鲜果蔬',
};

export const FLEETS = ['华东车队', '华南车队', '华北车队', '西南车队'];

export const DISPOSAL_TYPE_LABELS: Record<DisposalType, string> = {
  notify_driver: '通知司机检查制冷机',
  suggest_detour: '建议绕行',
  delay_receipt: '联系收货方延后验收',
  other: '其他处置',
};

export const ROUTE_SEGMENT_LABELS: Record<RouteSegmentType, string> = {
  normal: '正常路段',
  congestion: '拥堵路段',
  hotspot: '历史高温路段',
};
