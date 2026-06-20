import { create } from 'zustand';
import type {
  Vehicle,
  TemperatureReading,
  DisposalRecord,
  FilterState,
  VehicleStatus,
  DisposalType,
  RouteSegment,
  ServiceArea,
  DoorEvent,
  AlternativeRoute,
  RiskReason,
} from '@/types';
import { mockVehicles, mockRouteSegments, mockServiceAreas, mockDoorEvents, mockAlternativeRoutes } from '@/mock/vehicles';
import { mockTemperatureData, generateNewTemperatureReading } from '@/mock/temperature';
import { mockDisposalRecords, generateDisposalRecord } from '@/mock/disposal';

const STORAGE_KEY = 'cold-chain-disposal-records';

const loadDisposalRecords = (): DisposalRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const records = JSON.parse(stored);
      return records.map((r: DisposalRecord) => ({
        ...r,
        timestamp: new Date(r.timestamp),
      }));
    }
  } catch (e) {
    console.error('Failed to load disposal records from localStorage:', e);
  }
  return mockDisposalRecords;
};

const saveDisposalRecords = (records: DisposalRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save disposal records to localStorage:', e);
  }
};

const determineTempStatus = (
  currentTemp: number,
  minTemp: number,
  maxTemp: number
): VehicleStatus => {
  if (currentTemp > maxTemp + 0.3 || currentTemp < minTemp - 0.3) {
    return 'alert';
  }
  if (currentTemp > maxTemp - 0.5 || currentTemp < minTemp + 0.5) {
    return 'warning';
  }
  return 'normal';
};

const getRiskReasons = (
  vehicle: Vehicle,
  segments: RouteSegment[],
  tempStatus: VehicleStatus
): RiskReason[] => {
  const reasons: RiskReason[] = [];
  
  if (tempStatus !== 'normal') {
    reasons.push('temperature');
  }
  
  const traveled = vehicle.traveledMileage || (vehicle.totalMileage - vehicle.remainingMileage);
  const currentAndUpcomingSegments = segments.filter(
    (s) => s.type !== 'normal' && s.endMileage >= traveled - 2 && s.startMileage <= traveled + 50
  );
  
  currentAndUpcomingSegments.forEach((seg) => {
    if (seg.type === 'congestion') reasons.push('congestion');
    if (seg.type === 'hotspot') reasons.push('hotspot');
    if (seg.type === 'long_stop') reasons.push('long_stop');
  });
  
  return [...new Set(reasons)];
};

const calculateOverallRisk = (
  vehicle: Vehicle,
  segments: RouteSegment[]
): { riskLevel: VehicleStatus; nearestRisk?: Vehicle['nearestRisk'] } => {
  const tempStatus = determineTempStatus(
    vehicle.currentTemp,
    vehicle.targetTempMin,
    vehicle.targetTempMax
  );
  
  const traveled = vehicle.traveledMileage || (vehicle.totalMileage - vehicle.remainingMileage);
  const relevantRiskSegments = segments
    .filter((s) => s.type !== 'normal' && s.endMileage >= traveled - 2 && s.startMileage <= traveled + 50)
    .sort((a, b) => a.startMileage - b.startMileage);
  
  let nearestRisk: Vehicle['nearestRisk'] | undefined;
  if (relevantRiskSegments.length > 0) {
    const nearest = relevantRiskSegments[0];
    const distance = Math.max(0, nearest.startMileage - traveled);
    nearestRisk = {
      type: nearest.type,
      description: nearest.description,
      distance: Math.round(distance),
      estimatedOverheatMinutes: nearest.estimatedOverheatTime,
      estimatedTempRise: nearest.estimatedTempRise,
    };
  }
  
  let riskLevel: VehicleStatus = 'normal';
  
  const currentlyInRiskSegment = relevantRiskSegments.some(
    (s) => s.startMileage <= traveled && s.endMileage >= traveled
  );
  
  const upcomingImmediateRisk = relevantRiskSegments.some(
    (s) => s.startMileage >= traveled && s.startMileage - traveled <= 15
  );
  
  const alertCondition =
    tempStatus === 'alert' ||
    (currentlyInRiskSegment && tempStatus === 'warning') ||
    (upcomingImmediateRisk && relevantRiskSegments.some(
      (s) => s.estimatedOverheatTime && s.estimatedOverheatTime < 20
    ));
  
  const warningCondition =
    tempStatus === 'warning' ||
    currentlyInRiskSegment ||
    (upcomingImmediateRisk && relevantRiskSegments.some((s) => s.type === 'hotspot')) ||
    (upcomingImmediateRisk && relevantRiskSegments.some((s) => s.type === 'congestion' && s.congestionLevel === 'severe')) ||
    (upcomingImmediateRisk && relevantRiskSegments.some((s) => s.type === 'long_stop'));
  
  if (alertCondition) {
    riskLevel = 'alert';
  } else if (warningCondition) {
    riskLevel = 'warning';
  }
  
  return { riskLevel, nearestRisk };
};

interface AppState {
  vehicles: Vehicle[];
  temperatureData: Record<string, TemperatureReading[]>;
  disposalRecords: DisposalRecord[];
  routeSegments: Record<string, RouteSegment[]>;
  serviceAreas: Record<string, ServiceArea[]>;
  doorEvents: Record<string, DoorEvent[]>;
  alternativeRoutes: Record<string, AlternativeRoute[]>;
  filters: FilterState;
  selectedVehicleId: string | null;
  currentOperator: string;

  setFilters: (filters: Partial<FilterState>) => void;
  setSelectedVehicleId: (id: string | null) => void;
  getFilteredVehicles: () => Vehicle[];
  getVehicleById: (id: string) => Vehicle | undefined;
  getVehicleStatusCounts: () => { normal: number; warning: number; alert: number };
  getRiskReasonsForVehicle: (vehicleId: string) => RiskReason[];
  getAlternativeRoutes: (vehicleId: string) => AlternativeRoute[];
  updateTemperatures: () => void;
  addDisposalRecord: (vehicleId: string, type: DisposalType, description?: string, extra?: Partial<DisposalRecord>) => void;
  updateDisposalRecordStatus: (id: string, status: 'pending' | 'completed', result?: string, followUpStatus?: DisposalRecord['followUpStatus']) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  vehicles: mockVehicles,
  temperatureData: mockTemperatureData,
  disposalRecords: loadDisposalRecords(),
  routeSegments: mockRouteSegments,
  serviceAreas: mockServiceAreas,
  doorEvents: mockDoorEvents,
  alternativeRoutes: mockAlternativeRoutes,
  filters: {
    fleet: null,
    cargoType: null,
    arrivalTime: null,
    searchQuery: '',
  },
  selectedVehicleId: null,
  currentOperator: '调度员-李明',

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),

  getFilteredVehicles: () => {
    const { vehicles, filters } = get();
    return vehicles.filter((vehicle) => {
      if (filters.fleet && vehicle.fleet !== filters.fleet) return false;
      if (filters.cargoType && vehicle.cargoType !== filters.cargoType) return false;
      if (filters.arrivalTime) {
        const arrivalDate = new Date(filters.arrivalTime);
        arrivalDate.setHours(0, 0, 0, 0);
        const vehicleArrival = new Date(vehicle.estimatedArrival);
        vehicleArrival.setHours(0, 0, 0, 0);
        if (arrivalDate.getTime() !== vehicleArrival.getTime()) return false;
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (
          !vehicle.plateNumber.toLowerCase().includes(query) &&
          !vehicle.driverName.toLowerCase().includes(query) &&
          !vehicle.cargoDescription.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  },

  getVehicleById: (id) => {
    return get().vehicles.find((v) => v.id === id);
  },

  getVehicleStatusCounts: () => {
    const vehicles = get().getFilteredVehicles();
    return vehicles.reduce(
      (counts, vehicle) => {
        counts[vehicle.riskLevel || vehicle.currentStatus]++;
        return counts;
      },
      { normal: 0, warning: 0, alert: 0 }
    );
  },

  getRiskReasonsForVehicle: (vehicleId) => {
    const vehicle = get().getVehicleById(vehicleId);
    const segments = get().routeSegments[vehicleId] || [];
    if (!vehicle) return [];
    const tempStatus = determineTempStatus(
      vehicle.currentTemp,
      vehicle.targetTempMin,
      vehicle.targetTempMax
    );
    return getRiskReasons(vehicle, segments, tempStatus);
  },

  getAlternativeRoutes: (vehicleId) => {
    return get().alternativeRoutes[vehicleId] || [];
  },

  updateTemperatures: () => {
    set((state) => {
      const newTemperatureData = { ...state.temperatureData };
      const newVehicles = state.vehicles.map((vehicle) => {
        const readings = newTemperatureData[vehicle.id] || [];
        if (readings.length > 0) {
          const lastReading = readings[readings.length - 1];
          const newReading = generateNewTemperatureReading(
            vehicle.id,
            lastReading.temperature,
            vehicle.targetTempMin,
            vehicle.targetTempMax
          );
          
          const updatedReadings = [...readings.slice(1), newReading];
          newTemperatureData[vehicle.id] = updatedReadings;
          
          const tempStatus = determineTempStatus(
            newReading.temperature,
            vehicle.targetTempMin,
            vehicle.targetTempMax
          );
          
          const segments = state.routeSegments[vehicle.id] || [];
          const updatedVehicle = {
            ...vehicle,
            currentTemp: newReading.temperature,
            currentStatus: tempStatus,
          };
          
          const { riskLevel, nearestRisk } = calculateOverallRisk(updatedVehicle, segments);
          
          return {
            ...updatedVehicle,
            riskLevel,
            nearestRisk,
          };
        }
        return vehicle;
      });
      
      return {
        temperatureData: newTemperatureData,
        vehicles: newVehicles,
      };
    });
  },

  addDisposalRecord: (vehicleId, type, description = '', extra = {}) => {
    const vehicle = get().getVehicleById(vehicleId);
    if (!vehicle) return;

    const tempStatus = determineTempStatus(vehicle.currentTemp, vehicle.targetTempMin, vehicle.targetTempMax);
    const traveled = vehicle.traveledMileage || (vehicle.totalMileage - vehicle.remainingMileage);
    const riskReasons = get().getRiskReasonsForVehicle(vehicleId);
    const segments = get().routeSegments[vehicleId] || [];
    const currentAndUpcomingRisks = segments.filter(
      (s) => s.type !== 'normal' && s.endMileage >= traveled - 2 && s.startMileage <= traveled + 50
    ).sort((a, b) => a.startMileage - b.startMileage);

    const riskDescriptionParts = currentAndUpcomingRisks.map((r) => {
      const isCurrent = r.startMileage <= traveled && r.endMileage >= traveled;
      const distance = r.startMileage - traveled;
      let prefix = isCurrent ? '正在经过' : distance <= 0 ? '刚经过' : `前方${Math.round(distance)}公里`;
      const levelInfo = r.congestionLevel ? `(${r.congestionLevel === 'severe' ? '严重拥堵' : r.congestionLevel === 'moderate' ? '中度拥堵' : '缓行'})` : '';
      const tempInfo = r.historicalHighTemp ? `，历史最高${r.historicalHighTemp.toFixed(1)}℃` : '';
      const stopInfo = r.stopDuration ? `，停车${r.stopDuration}分钟` : '';
      return `${prefix}${r.description}${levelInfo}${tempInfo}${stopInfo}`;
    });

    if (tempStatus === 'alert') {
      riskDescriptionParts.unshift('当前温度已超出设定温区');
    } else if (tempStatus === 'warning') {
      riskDescriptionParts.unshift('当前温度接近设定温区');
    }

    const riskDescription = riskDescriptionParts.length > 0
      ? riskDescriptionParts.join('；')
      : '温度异常';

    const baseRecord = generateDisposalRecord(
      vehicleId,
      vehicle.plateNumber,
      type,
      description,
      get().currentOperator
    );

    const newRecord: DisposalRecord = {
      ...baseRecord,
      temperatureBefore: vehicle.currentTemp,
      tempRange: { min: vehicle.targetTempMin, max: vehicle.targetTempMax },
      riskReasons,
      riskDescription,
      selectedAction: type,
      followUpStatus: 'stable',
      ...extra,
    };

    set((state) => {
      const newRecords = [newRecord, ...state.disposalRecords];
      saveDisposalRecords(newRecords);
      return { disposalRecords: newRecords };
    });
  },

  updateDisposalRecordStatus: (id, status, result, followUpStatus) => {
    set((state) => {
      const newRecords = state.disposalRecords.map((record) =>
        record.id === id ? { 
          ...record, 
          status, 
          result,
          ...(followUpStatus ? { followUpStatus } : {}),
        } : record
      );
      saveDisposalRecords(newRecords);
      return { disposalRecords: newRecords };
    });
  },
}));
