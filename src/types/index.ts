export type VehicleStatus = 'normal' | 'warning' | 'alert';
export type CargoType = 'frozen' | 'chilled' | 'pharmaceutical' | 'fresh';
export type DisposalType = 'notify_driver' | 'suggest_detour' | 'delay_receipt' | 'other';
export type DoorEventType = 'open' | 'close';
export type RouteSegmentType = 'normal' | 'congestion' | 'hotspot' | 'long_stop';
export type RiskReason = 'congestion' | 'hotspot' | 'long_stop' | 'temperature' | 'door_open';

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
  traveledMileage: number;
  riskLevel: VehicleStatus;
  nearestRisk?: {
    type: RouteSegmentType;
    description: string;
    distance: number;
    estimatedOverheatMinutes?: number;
    estimatedTempRise: number;
  };
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
  startPosition: Position;
  endPosition: Position;
  congestionLevel?: 'light' | 'moderate' | 'severe';
  stopDuration?: number;
  historicalHighTemp?: number;
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

export interface AlternativeRoute {
  id: string;
  vehicleId: string;
  name: string;
  totalMileage: number;
  remainingMileage: number;
  estimatedArrival: Date;
  route: Position[];
  overheatProbability: number;
  nearestServiceAreaDistance: number;
  riskSegments: RouteSegment[];
  tempRiseEstimate: number;
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
  temperatureBefore?: number;
  tempRange?: { min: number; max: number };
  riskReasons?: RiskReason[];
  riskDescription?: string;
  selectedAction?: string;
  followUpStatus?: 'improving' | 'stable' | 'worsening' | 'resolved';
  routeChange?: boolean;
  alternativeRouteId?: string;
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
  long_stop: '长时间停车',
};

export const RISK_REASON_LABELS: Record<RiskReason, string> = {
  congestion: '前方拥堵',
  hotspot: '历史高温路段',
  long_stop: '长时间停车',
  temperature: '温度接近上限',
  door_open: '车厢门开启',
};

export const CONGESTION_LEVEL_LABELS: Record<string, string> = {
  light: '轻度拥堵',
  moderate: '中度拥堵',
  severe: '严重拥堵',
};

export const FOLLOW_UP_STATUS_LABELS: Record<string, string> = {
  improving: '温度下降中',
  stable: '温度稳定',
  worsening: '温度持续上升',
  resolved: '已恢复正常',
};
