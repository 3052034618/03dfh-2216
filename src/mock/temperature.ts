import type { TemperatureReading } from '@/types';

const now = new Date();

const generateTemperatureReadings = (
  vehicleId: string,
  baseTemp: number,
  minTemp: number,
  maxTemp: number,
  points: number = 30
): TemperatureReading[] => {
  const readings: TemperatureReading[] = [];
  let currentTemp = baseTemp;
  
  for (let i = points; i >= 0; i--) {
    const fluctuation = (Math.random() - 0.5) * 1.5;
    currentTemp = Math.max(minTemp - 2, Math.min(maxTemp + 3, currentTemp + fluctuation));
    
    readings.push({
      id: `${vehicleId}-temp-${i}`,
      vehicleId,
      temperature: Math.round(currentTemp * 10) / 10,
      timestamp: new Date(now.getTime() - i * 60 * 1000),
    });
  }
  
  return readings;
};

export const mockTemperatureData: Record<string, TemperatureReading[]> = {
  v001: generateTemperatureReadings('v001', -21.5, -25, -18),
  v002: generateTemperatureReadings('v002', 7.2, 2, 8),
  v003: generateTemperatureReadings('v003', 5.8, 0, 4),
  v004: generateTemperatureReadings('v004', 6.3, 4, 10),
  v005: generateTemperatureReadings('v005', -16.8, -25, -18),
  v006: generateTemperatureReadings('v006', 2.1, 0, 4),
  v007: generateTemperatureReadings('v007', 4.5, 2, 8),
  v008: generateTemperatureReadings('v008', 11.2, 4, 10),
};

export const generateNewTemperatureReading = (
  vehicleId: string,
  lastTemp: number,
  minTemp: number,
  maxTemp: number
): TemperatureReading => {
  const trend = lastTemp > maxTemp ? -0.3 : lastTemp < minTemp ? 0.3 : (Math.random() - 0.5) * 0.8;
  const newTemp = Math.round((lastTemp + trend) * 10) / 10;
  
  return {
    id: `${vehicleId}-temp-${Date.now()}`,
    vehicleId,
    temperature: newTemp,
    timestamp: new Date(),
  };
};
