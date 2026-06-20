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
} from '@/types';
import { mockVehicles, mockRouteSegments, mockServiceAreas, mockDoorEvents } from '@/mock/vehicles';
import { mockTemperatureData, generateNewTemperatureReading } from '@/mock/temperature';
import { mockDisposalRecords, generateDisposalRecord } from '@/mock/disposal';

interface AppState {
  vehicles: Vehicle[];
  temperatureData: Record<string, TemperatureReading[]>;
  disposalRecords: DisposalRecord[];
  routeSegments: Record<string, RouteSegment[]>;
  serviceAreas: Record<string, ServiceArea[]>;
  doorEvents: Record<string, DoorEvent[]>;
  filters: FilterState;
  selectedVehicleId: string | null;
  currentOperator: string;

  setFilters: (filters: Partial<FilterState>) => void;
  setSelectedVehicleId: (id: string | null) => void;
  getFilteredVehicles: () => Vehicle[];
  getVehicleById: (id: string) => Vehicle | undefined;
  getVehicleStatusCounts: () => { normal: number; warning: number; alert: number };
  updateTemperatures: () => void;
  addDisposalRecord: (vehicleId: string, type: DisposalType, description?: string) => void;
  updateDisposalRecordStatus: (id: string, status: 'pending' | 'completed', result?: string) => void;
}

const determineVehicleStatus = (
  currentTemp: number,
  minTemp: number,
  maxTemp: number
): VehicleStatus => {
  const range = maxTemp - minTemp;
  const warningThreshold = range * 0.8;
  
  if (currentTemp > maxTemp || currentTemp < minTemp) {
    return 'alert';
  }
  if (currentTemp > maxTemp - warningThreshold || currentTemp < minTemp + warningThreshold) {
    return 'warning';
  }
  return 'normal';
};

export const useAppStore = create<AppState>((set, get) => ({
  vehicles: mockVehicles,
  temperatureData: mockTemperatureData,
  disposalRecords: mockDisposalRecords,
  routeSegments: mockRouteSegments,
  serviceAreas: mockServiceAreas,
  doorEvents: mockDoorEvents,
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
        counts[vehicle.currentStatus]++;
        return counts;
      },
      { normal: 0, warning: 0, alert: 0 }
    );
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
          
          const newStatus = determineVehicleStatus(
            newReading.temperature,
            vehicle.targetTempMin,
            vehicle.targetTempMax
          );
          
          return {
            ...vehicle,
            currentTemp: newReading.temperature,
            currentStatus: newStatus,
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

  addDisposalRecord: (vehicleId, type, description = '') => {
    const vehicle = get().getVehicleById(vehicleId);
    if (!vehicle) return;

    const newRecord = generateDisposalRecord(
      vehicleId,
      vehicle.plateNumber,
      type,
      description,
      get().currentOperator
    );

    set((state) => ({
      disposalRecords: [newRecord, ...state.disposalRecords],
    }));
  },

  updateDisposalRecordStatus: (id, status, result) => {
    set((state) => ({
      disposalRecords: state.disposalRecords.map((record) =>
        record.id === id ? { ...record, status, result } : record
      ),
    }));
  },
}));
