import type { Vehicle, Position, RouteSegment, ServiceArea, DoorEvent, AlternativeRoute } from '@/types';

const generateRoute = (start: Position, end: Position, points: number = 10): Position[] => {
  const route: Position[] = [start];
  for (let i = 1; i < points; i++) {
    const t = i / points;
    route.push({
      lat: start.lat + (end.lat - start.lat) * t + (Math.random() - 0.5) * 0.1,
      lng: start.lng + (end.lng - start.lng) * t + (Math.random() - 0.5) * 0.1,
    });
  }
  route.push(end);
  return route;
};

const getPositionAtMileage = (route: Position[], mileage: number, totalMileage: number): Position => {
  if (mileage <= 0) return { ...route[0] };
  if (mileage >= totalMileage) return { ...route[route.length - 1] };
  
  const ratio = mileage / totalMileage;
  const exactIndex = ratio * (route.length - 1);
  const index = Math.floor(exactIndex);
  const t = exactIndex - index;
  const nextIndex = Math.min(index + 1, route.length - 1);
  
  return {
    lat: route[index].lat + (route[nextIndex].lat - route[index].lat) * t,
    lng: route[index].lng + (route[nextIndex].lng - route[index].lng) * t,
  };
};

const now = new Date();

const calculateRiskLevel = (vehicle: Vehicle, segments: RouteSegment[]): {
  riskLevel: 'normal' | 'warning' | 'alert';
  nearestRisk?: {
    type: RouteSegment['type'];
    description: string;
    distance: number;
    estimatedOverheatMinutes?: number;
    estimatedTempRise: number;
  };
} => {
  const traveledMileage = vehicle.totalMileage - vehicle.remainingMileage;
  const tempRange = vehicle.targetTempMax - vehicle.targetTempMin;
  const tempRatio = (vehicle.currentTemp - vehicle.targetTempMin) / tempRange;
  const isOverheat = vehicle.currentTemp > vehicle.targetTempMax;
  const isNearMax = tempRatio >= 0.8;

  const forwardRisks = segments.filter(
    (s) => s.type !== 'normal' && s.endMileage > traveledMileage
  ).map((s) => ({
    ...s,
    distance: Math.max(0, s.startMileage - traveledMileage),
  }));

  forwardRisks.sort((a, b) => a.distance - b.distance);

  const nearest = forwardRisks[0];

  const hasSevereCongestion = forwardRisks.some(
    (s) => s.type === 'congestion' && s.congestionLevel === 'severe'
  );
  const hasOverheatWithin20Min = forwardRisks.some(
    (s) => s.estimatedOverheatTime !== undefined && s.estimatedOverheatTime <= 20
  );
  const hasModerateCongestion = forwardRisks.some(
    (s) => s.type === 'congestion' && s.congestionLevel === 'moderate'
  );
  const hasHotspot = forwardRisks.some((s) => s.type === 'hotspot');
  const hasAnyRisk = forwardRisks.length > 0;

  let riskLevel: 'normal' | 'warning' | 'alert' = 'normal';

  if (isOverheat || hasSevereCongestion || hasOverheatWithin20Min) {
    riskLevel = 'alert';
  } else if (hasModerateCongestion || hasHotspot || (isNearMax && hasAnyRisk)) {
    riskLevel = 'warning';
  } else if (isNearMax) {
    riskLevel = 'warning';
  }

  const nearestRisk = nearest
    ? {
        type: nearest.type,
        description: nearest.description,
        distance: nearest.distance,
        estimatedOverheatMinutes: nearest.estimatedOverheatTime,
        estimatedTempRise: nearest.estimatedTempRise,
      }
    : undefined;

  return { riskLevel, nearestRisk };
};

const routeV001 = generateRoute({ lat: 31.2304, lng: 121.4737 }, { lat: 32.0603, lng: 118.7969 }, 8);
const routeV002 = generateRoute({ lat: 31.5926, lng: 120.4453 }, { lat: 31.8639, lng: 117.2808 }, 7);
const routeV003 = generateRoute({ lat: 23.1291, lng: 113.2644 }, { lat: 22.5431, lng: 114.0579 }, 6);
const routeV004 = generateRoute({ lat: 39.9042, lng: 116.4074 }, { lat: 39.0842, lng: 117.2010 }, 7);
const routeV005 = generateRoute({ lat: 30.5728, lng: 104.0668 }, { lat: 29.5630, lng: 106.5516 }, 8);
const routeV006 = generateRoute({ lat: 31.3204, lng: 120.7737 }, { lat: 31.4504, lng: 120.3237 }, 5);
const routeV007 = generateRoute({ lat: 22.5431, lng: 114.0579 }, { lat: 23.1291, lng: 113.2644 }, 6);
const routeV008 = generateRoute({ lat: 38.0428, lng: 114.5149 }, { lat: 39.9042, lng: 116.4074 }, 7);

export const mockRouteSegments: Record<string, RouteSegment[]> = {
  v001: [
    {
      id: 'rs001',
      vehicleId: 'v001',
      type: 'normal',
      description: 'G42沪蓉高速 畅通',
      startMileage: 0,
      endMileage: 200,
      estimatedTempRise: 0.5,
      startPosition: getPositionAtMileage(routeV001, 0, 580),
      endPosition: getPositionAtMileage(routeV001, 200, 580),
    },
    {
      id: 'rs002',
      vehicleId: 'v001',
      type: 'congestion',
      description: '常州段 拥堵约3公里',
      startMileage: 200,
      endMileage: 280,
      estimatedTempRise: 2.3,
      estimatedOverheatTime: 45,
      startPosition: getPositionAtMileage(routeV001, 200, 580),
      endPosition: getPositionAtMileage(routeV001, 280, 580),
      congestionLevel: 'moderate',
    },
    {
      id: 'rs003',
      vehicleId: 'v001',
      type: 'normal',
      description: 'G25长深高速 畅通',
      startMileage: 280,
      endMileage: 580,
      estimatedTempRise: 0.8,
      startPosition: getPositionAtMileage(routeV001, 280, 580),
      endPosition: getPositionAtMileage(routeV001, 580, 580),
    },
  ],
  v002: [
    {
      id: 'rs004',
      vehicleId: 'v002',
      type: 'hotspot',
      description: '历史高温路段 请注意',
      startMileage: 0,
      endMileage: 120,
      estimatedTempRise: 3.1,
      estimatedOverheatTime: 28,
      startPosition: getPositionAtMileage(routeV002, 0, 420),
      endPosition: getPositionAtMileage(routeV002, 120, 420),
      historicalHighTemp: 12.5,
    },
    {
      id: 'rs005',
      vehicleId: 'v002',
      type: 'normal',
      description: 'G40沪陕高速 畅通',
      startMileage: 120,
      endMileage: 420,
      estimatedTempRise: 0.6,
      startPosition: getPositionAtMileage(routeV002, 120, 420),
      endPosition: getPositionAtMileage(routeV002, 420, 420),
    },
  ],
  v003: [
    {
      id: 'rs006',
      vehicleId: 'v003',
      type: 'congestion',
      description: '广州环城高速 严重拥堵',
      startMileage: 0,
      endMileage: 80,
      estimatedTempRise: 4.2,
      estimatedOverheatTime: 15,
      startPosition: getPositionAtMileage(routeV003, 0, 650),
      endPosition: getPositionAtMileage(routeV003, 80, 650),
      congestionLevel: 'severe',
    },
    {
      id: 'rs007',
      vehicleId: 'v003',
      type: 'hotspot',
      description: '沿海高温路段',
      startMileage: 80,
      endMileage: 200,
      estimatedTempRise: 2.8,
      estimatedOverheatTime: 22,
      startPosition: getPositionAtMileage(routeV003, 80, 650),
      endPosition: getPositionAtMileage(routeV003, 200, 650),
      historicalHighTemp: 8.5,
    },
    {
      id: 'rs008',
      vehicleId: 'v003',
      type: 'normal',
      description: 'G4京港澳高速 畅通',
      startMileage: 200,
      endMileage: 650,
      estimatedTempRise: 1.0,
      startPosition: getPositionAtMileage(routeV003, 200, 650),
      endPosition: getPositionAtMileage(routeV003, 650, 650),
    },
  ],
  v004: [
    {
      id: 'rs009',
      vehicleId: 'v004',
      type: 'normal',
      description: 'G2京沪高速 畅通',
      startMileage: 0,
      endMileage: 390,
      estimatedTempRise: 0.7,
      startPosition: getPositionAtMileage(routeV004, 0, 390),
      endPosition: getPositionAtMileage(routeV004, 390, 390),
    },
  ],
  v005: [
    {
      id: 'rs010',
      vehicleId: 'v005',
      type: 'congestion',
      description: 'G76厦蓉高速 施工缓行',
      startMileage: 0,
      endMileage: 150,
      estimatedTempRise: 2.5,
      estimatedOverheatTime: 35,
      startPosition: getPositionAtMileage(routeV005, 0, 720),
      endPosition: getPositionAtMileage(routeV005, 150, 720),
      congestionLevel: 'moderate',
    },
    {
      id: 'rs011',
      vehicleId: 'v005',
      type: 'normal',
      description: 'G93成渝环线 畅通',
      startMileage: 150,
      endMileage: 720,
      estimatedTempRise: 0.9,
      startPosition: getPositionAtMileage(routeV005, 150, 720),
      endPosition: getPositionAtMileage(routeV005, 720, 720),
    },
  ],
  v006: [
    {
      id: 'rs012',
      vehicleId: 'v006',
      type: 'normal',
      description: 'G15沈海高速 畅通',
      startMileage: 0,
      endMileage: 210,
      estimatedTempRise: 0.4,
      startPosition: getPositionAtMileage(routeV006, 0, 210),
      endPosition: getPositionAtMileage(routeV006, 210, 210),
    },
  ],
  v007: [
    {
      id: 'rs013',
      vehicleId: 'v007',
      type: 'normal',
      description: 'G94珠三角环线 畅通',
      startMileage: 0,
      endMileage: 510,
      estimatedTempRise: 0.5,
      startPosition: getPositionAtMileage(routeV007, 0, 510),
      endPosition: getPositionAtMileage(routeV007, 510, 510),
    },
  ],
  v008: [
    {
      id: 'rs014',
      vehicleId: 'v008',
      type: 'hotspot',
      description: '午后高温路段 请注意',
      startMileage: 0,
      endMileage: 100,
      estimatedTempRise: 3.5,
      estimatedOverheatTime: 18,
      startPosition: getPositionAtMileage(routeV008, 0, 280),
      endPosition: getPositionAtMileage(routeV008, 100, 280),
      historicalHighTemp: 15.2,
    },
    {
      id: 'rs015',
      vehicleId: 'v008',
      type: 'congestion',
      description: 'G4京港澳高速 事故拥堵',
      startMileage: 100,
      endMileage: 180,
      estimatedTempRise: 2.8,
      estimatedOverheatTime: 25,
      startPosition: getPositionAtMileage(routeV008, 100, 280),
      endPosition: getPositionAtMileage(routeV008, 180, 280),
      congestionLevel: 'severe',
    },
    {
      id: 'rs016',
      vehicleId: 'v008',
      type: 'normal',
      description: 'G45大广高速 畅通',
      startMileage: 180,
      endMileage: 280,
      estimatedTempRise: 0.6,
      startPosition: getPositionAtMileage(routeV008, 180, 280),
      endPosition: getPositionAtMileage(routeV008, 280, 280),
    },
  ],
};

export const mockVehicles: Vehicle[] = [
  (() => {
    const vehicle: Vehicle = {
      id: 'v001',
      plateNumber: '沪A·88567',
      fleet: '华东车队',
      cargoType: 'frozen',
      targetTempMin: -25,
      targetTempMax: -18,
      currentTemp: -21.5,
      currentStatus: 'normal',
      remainingMileage: 245,
      totalMileage: 580,
      traveledMileage: 580 - 245,
      estimatedArrival: new Date(now.getTime() + 3.5 * 60 * 60 * 1000),
      currentPosition: { lat: 31.2304, lng: 121.4737 },
      route: routeV001,
      driverName: '张师傅',
      driverPhone: '138****5678',
      cargoDescription: '进口冷冻牛肉 25吨',
      riskLevel: 'normal',
    };
    const { riskLevel, nearestRisk } = calculateRiskLevel(vehicle, mockRouteSegments.v001);
    return { ...vehicle, riskLevel, nearestRisk };
  })(),
  (() => {
    const vehicle: Vehicle = {
      id: 'v002',
      plateNumber: '苏B·3K289',
      fleet: '华东车队',
      cargoType: 'pharmaceutical',
      targetTempMin: 2,
      targetTempMax: 8,
      currentTemp: 7.2,
      currentStatus: 'warning',
      remainingMileage: 186,
      totalMileage: 420,
      traveledMileage: 420 - 186,
      estimatedArrival: new Date(now.getTime() + 2.8 * 60 * 60 * 1000),
      currentPosition: { lat: 31.5926, lng: 120.4453 },
      route: routeV002,
      driverName: '李师傅',
      driverPhone: '139****1234',
      cargoDescription: '生物试剂 冷链运输',
      riskLevel: 'warning',
    };
    const { riskLevel, nearestRisk } = calculateRiskLevel(vehicle, mockRouteSegments.v002);
    return { ...vehicle, riskLevel, nearestRisk };
  })(),
  (() => {
    const vehicle: Vehicle = {
      id: 'v003',
      plateNumber: '粤A·7H521',
      fleet: '华南车队',
      cargoType: 'chilled',
      targetTempMin: 0,
      targetTempMax: 4,
      currentTemp: 5.8,
      currentStatus: 'alert',
      remainingMileage: 312,
      totalMileage: 650,
      traveledMileage: 650 - 312,
      estimatedArrival: new Date(now.getTime() + 4.2 * 60 * 60 * 1000),
      currentPosition: { lat: 23.1291, lng: 113.2644 },
      route: routeV003,
      driverName: '王师傅',
      driverPhone: '137****9876',
      cargoDescription: '新鲜乳制品 18吨',
      riskLevel: 'alert',
    };
    const { riskLevel, nearestRisk } = calculateRiskLevel(vehicle, mockRouteSegments.v003);
    return { ...vehicle, riskLevel, nearestRisk };
  })(),
  (() => {
    const vehicle: Vehicle = {
      id: 'v004',
      plateNumber: '京A·6F123',
      fleet: '华北车队',
      cargoType: 'fresh',
      targetTempMin: 4,
      targetTempMax: 10,
      currentTemp: 6.3,
      currentStatus: 'normal',
      remainingMileage: 178,
      totalMileage: 390,
      traveledMileage: 390 - 178,
      estimatedArrival: new Date(now.getTime() + 2.5 * 60 * 60 * 1000),
      currentPosition: { lat: 39.9042, lng: 116.4074 },
      route: routeV004,
      driverName: '赵师傅',
      driverPhone: '136****5432',
      cargoDescription: '有机蔬菜 12吨',
      riskLevel: 'normal',
    };
    const { riskLevel, nearestRisk } = calculateRiskLevel(vehicle, mockRouteSegments.v004);
    return { ...vehicle, riskLevel, nearestRisk };
  })(),
  (() => {
    const vehicle: Vehicle = {
      id: 'v005',
      plateNumber: '川A·9D876',
      fleet: '西南车队',
      cargoType: 'frozen',
      targetTempMin: -25,
      targetTempMax: -18,
      currentTemp: -16.8,
      currentStatus: 'warning',
      remainingMileage: 425,
      totalMileage: 720,
      traveledMileage: 720 - 425,
      estimatedArrival: new Date(now.getTime() + 5.8 * 60 * 60 * 1000),
      currentPosition: { lat: 30.5728, lng: 104.0668 },
      route: routeV005,
      driverName: '刘师傅',
      driverPhone: '135****8765',
      cargoDescription: '速冻水饺 30吨',
      riskLevel: 'warning',
    };
    const { riskLevel, nearestRisk } = calculateRiskLevel(vehicle, mockRouteSegments.v005);
    return { ...vehicle, riskLevel, nearestRisk };
  })(),
  (() => {
    const vehicle: Vehicle = {
      id: 'v006',
      plateNumber: '沪A·5A345',
      fleet: '华东车队',
      cargoType: 'chilled',
      targetTempMin: 0,
      targetTempMax: 4,
      currentTemp: 2.1,
      currentStatus: 'normal',
      remainingMileage: 89,
      totalMileage: 210,
      traveledMileage: 210 - 89,
      estimatedArrival: new Date(now.getTime() + 1.2 * 60 * 60 * 1000),
      currentPosition: { lat: 31.3204, lng: 120.7737 },
      route: routeV006,
      driverName: '陈师傅',
      driverPhone: '133****2345',
      cargoDescription: '冷鲜肉 15吨',
      riskLevel: 'normal',
    };
    const { riskLevel, nearestRisk } = calculateRiskLevel(vehicle, mockRouteSegments.v006);
    return { ...vehicle, riskLevel, nearestRisk };
  })(),
  (() => {
    const vehicle: Vehicle = {
      id: 'v007',
      plateNumber: '粤B·2C678',
      fleet: '华南车队',
      cargoType: 'pharmaceutical',
      targetTempMin: 2,
      targetTempMax: 8,
      currentTemp: 4.5,
      currentStatus: 'normal',
      remainingMileage: 267,
      totalMileage: 510,
      traveledMileage: 510 - 267,
      estimatedArrival: new Date(now.getTime() + 3.8 * 60 * 60 * 1000),
      currentPosition: { lat: 22.5431, lng: 114.0579 },
      route: routeV007,
      driverName: '周师傅',
      driverPhone: '132****6789',
      cargoDescription: '疫苗制品 冷链运输',
      riskLevel: 'normal',
    };
    const { riskLevel, nearestRisk } = calculateRiskLevel(vehicle, mockRouteSegments.v007);
    return { ...vehicle, riskLevel, nearestRisk };
  })(),
  (() => {
    const vehicle: Vehicle = {
      id: 'v008',
      plateNumber: '冀A·7B901',
      fleet: '华北车队',
      cargoType: 'fresh',
      targetTempMin: 4,
      targetTempMax: 10,
      currentTemp: 11.2,
      currentStatus: 'alert',
      remainingMileage: 134,
      totalMileage: 280,
      traveledMileage: 280 - 134,
      estimatedArrival: new Date(now.getTime() + 2.1 * 60 * 60 * 1000),
      currentPosition: { lat: 38.0428, lng: 114.5149 },
      route: routeV008,
      driverName: '孙师傅',
      driverPhone: '131****3456',
      cargoDescription: '新鲜草莓 8吨',
      riskLevel: 'alert',
    };
    const { riskLevel, nearestRisk } = calculateRiskLevel(vehicle, mockRouteSegments.v008);
    return { ...vehicle, riskLevel, nearestRisk };
  })(),
];

export const mockAlternativeRoutes: Record<string, AlternativeRoute[]> = {
  v002: [
    {
      id: 'alt_v002_01',
      vehicleId: 'v002',
      name: 'G42绕行方案',
      totalMileage: 465,
      remainingMileage: 231,
      estimatedArrival: new Date(now.getTime() + 3.2 * 60 * 60 * 1000),
      route: generateRoute({ lat: 31.5926, lng: 120.4453 }, { lat: 31.9539, lng: 117.4808 }, 8),
      overheatProbability: 35,
      nearestServiceAreaDistance: 28,
      tempRiseEstimate: 1.8,
      riskSegments: [
        {
          id: 'alt_rs001',
          vehicleId: 'v002',
          type: 'normal',
          description: 'G42沪蓉高速 畅通',
          startMileage: 0,
          endMileage: 465,
          estimatedTempRise: 1.8,
          startPosition: { lat: 31.5926, lng: 120.4453 },
          endPosition: { lat: 31.9539, lng: 117.4808 },
        },
      ],
    },
    {
      id: 'alt_v002_02',
      vehicleId: 'v002',
      name: '省道备选路线',
      totalMileage: 395,
      remainingMileage: 161,
      estimatedArrival: new Date(now.getTime() + 3.8 * 60 * 60 * 1000),
      route: generateRoute({ lat: 31.5926, lng: 120.4453 }, { lat: 31.8039, lng: 117.1808 }, 9),
      overheatProbability: 25,
      nearestServiceAreaDistance: 15,
      tempRiseEstimate: 1.2,
      riskSegments: [
        {
          id: 'alt_rs002',
          vehicleId: 'v002',
          type: 'normal',
          description: 'S336省道 畅通',
          startMileage: 0,
          endMileage: 395,
          estimatedTempRise: 1.2,
          startPosition: { lat: 31.5926, lng: 120.4453 },
          endPosition: { lat: 31.8039, lng: 117.1808 },
        },
      ],
    },
  ],
  v003: [
    {
      id: 'alt_v003_01',
      vehicleId: 'v003',
      name: 'G45绕行方案',
      totalMileage: 710,
      remainingMileage: 372,
      estimatedArrival: new Date(now.getTime() + 4.8 * 60 * 60 * 1000),
      route: generateRoute({ lat: 23.1291, lng: 113.2644 }, { lat: 22.6831, lng: 114.2579 }, 7),
      overheatProbability: 45,
      nearestServiceAreaDistance: 45,
      tempRiseEstimate: 2.5,
      riskSegments: [
        {
          id: 'alt_rs003',
          vehicleId: 'v003',
          type: 'hotspot',
          description: 'G45大广高速 高温路段',
          startMileage: 0,
          endMileage: 120,
          estimatedTempRise: 2.5,
          estimatedOverheatTime: 32,
          startPosition: { lat: 23.1291, lng: 113.2644 },
          endPosition: { lat: 22.9891, lng: 113.8644 },
          historicalHighTemp: 7.8,
        },
        {
          id: 'alt_rs004',
          vehicleId: 'v003',
          type: 'normal',
          description: 'G45大广高速 畅通',
          startMileage: 120,
          endMileage: 710,
          estimatedTempRise: 0.9,
          startPosition: { lat: 22.9891, lng: 113.8644 },
          endPosition: { lat: 22.6831, lng: 114.2579 },
        },
      ],
    },
    {
      id: 'alt_v003_02',
      vehicleId: 'v003',
      name: '沿江高速备选',
      totalMileage: 620,
      remainingMileage: 282,
      estimatedArrival: new Date(now.getTime() + 4.0 * 60 * 60 * 1000),
      route: generateRoute({ lat: 23.1291, lng: 113.2644 }, { lat: 22.4831, lng: 113.8579 }, 6),
      overheatProbability: 60,
      nearestServiceAreaDistance: 38,
      tempRiseEstimate: 3.2,
      riskSegments: [
        {
          id: 'alt_rs005',
          vehicleId: 'v003',
          type: 'congestion',
          description: '虎门大桥 轻度拥堵',
          startMileage: 80,
          endMileage: 150,
          estimatedTempRise: 1.8,
          estimatedOverheatTime: 55,
          startPosition: { lat: 22.9591, lng: 113.5644 },
          endPosition: { lat: 22.8091, lng: 113.6644 },
          congestionLevel: 'light',
        },
        {
          id: 'alt_rs006',
          vehicleId: 'v003',
          type: 'normal',
          description: '广深沿江高速 畅通',
          startMileage: 0,
          endMileage: 620,
          estimatedTempRise: 2.8,
          startPosition: { lat: 23.1291, lng: 113.2644 },
          endPosition: { lat: 22.4831, lng: 113.8579 },
        },
      ],
    },
  ],
  v005: [
    {
      id: 'alt_v005_01',
      vehicleId: 'v005',
      name: 'G42绕行方案',
      totalMileage: 780,
      remainingMileage: 485,
      estimatedArrival: new Date(now.getTime() + 6.5 * 60 * 60 * 1000),
      route: generateRoute({ lat: 30.5728, lng: 104.0668 }, { lat: 29.4830, lng: 106.7516 }, 9),
      overheatProbability: 40,
      nearestServiceAreaDistance: 52,
      tempRiseEstimate: 2.0,
      riskSegments: [
        {
          id: 'alt_rs007',
          vehicleId: 'v005',
          type: 'normal',
          description: 'G42沪蓉高速 畅通',
          startMileage: 0,
          endMileage: 780,
          estimatedTempRise: 2.0,
          startPosition: { lat: 30.5728, lng: 104.0668 },
          endPosition: { lat: 29.4830, lng: 106.7516 },
        },
      ],
    },
    {
      id: 'alt_v005_02',
      vehicleId: 'v005',
      name: '国道备选路线',
      totalMileage: 690,
      remainingMileage: 395,
      estimatedArrival: new Date(now.getTime() + 7.2 * 60 * 60 * 1000),
      route: generateRoute({ lat: 30.5728, lng: 104.0668 }, { lat: 29.6230, lng: 106.3516 }, 10),
      overheatProbability: 30,
      nearestServiceAreaDistance: 22,
      tempRiseEstimate: 1.5,
      riskSegments: [
        {
          id: 'alt_rs008',
          vehicleId: 'v005',
          type: 'normal',
          description: 'G321国道 畅通',
          startMileage: 0,
          endMileage: 690,
          estimatedTempRise: 1.5,
          startPosition: { lat: 30.5728, lng: 104.0668 },
          endPosition: { lat: 29.6230, lng: 106.3516 },
        },
      ],
    },
  ],
  v008: [
    {
      id: 'alt_v008_01',
      vehicleId: 'v008',
      name: 'G95绕行方案',
      totalMileage: 320,
      remainingMileage: 174,
      estimatedArrival: new Date(now.getTime() + 2.6 * 60 * 60 * 1000),
      route: generateRoute({ lat: 38.0428, lng: 114.5149 }, { lat: 39.7542, lng: 116.6074 }, 8),
      overheatProbability: 45,
      nearestServiceAreaDistance: 35,
      tempRiseEstimate: 2.2,
      riskSegments: [
        {
          id: 'alt_rs009',
          vehicleId: 'v008',
          type: 'hotspot',
          description: 'G95首都环线 午后高温',
          startMileage: 0,
          endMileage: 80,
          estimatedTempRise: 2.2,
          estimatedOverheatTime: 28,
          startPosition: { lat: 38.0428, lng: 114.5149 },
          endPosition: { lat: 38.3428, lng: 115.0149 },
          historicalHighTemp: 14.5,
        },
        {
          id: 'alt_rs010',
          vehicleId: 'v008',
          type: 'normal',
          description: 'G95首都环线 畅通',
          startMileage: 80,
          endMileage: 320,
          estimatedTempRise: 0.8,
          startPosition: { lat: 38.3428, lng: 115.0149 },
          endPosition: { lat: 39.7542, lng: 116.6074 },
        },
      ],
    },
    {
      id: 'alt_v008_02',
      vehicleId: 'v008',
      name: '省道备选路线',
      totalMileage: 265,
      remainingMileage: 119,
      estimatedArrival: new Date(now.getTime() + 3.0 * 60 * 60 * 1000),
      route: generateRoute({ lat: 38.0428, lng: 114.5149 }, { lat: 39.8042, lng: 116.2574 }, 9),
      overheatProbability: 35,
      nearestServiceAreaDistance: 20,
      tempRiseEstimate: 1.6,
      riskSegments: [
        {
          id: 'alt_rs011',
          vehicleId: 'v008',
          type: 'normal',
          description: 'S234省道 畅通',
          startMileage: 0,
          endMileage: 265,
          estimatedTempRise: 1.6,
          startPosition: { lat: 38.0428, lng: 114.5149 },
          endPosition: { lat: 39.8042, lng: 116.2574 },
        },
      ],
    },
  ],
};

export const mockServiceAreas: Record<string, ServiceArea[]> = {
  v001: [
    { id: 'sa001', name: '阳澄湖服务区', position: { lat: 31.4204, lng: 120.8737 }, distanceFromVehicle: 45, estimatedArrival: 38, hasCharging: true, hasRestaurant: true },
    { id: 'sa002', name: '梅村服务区', position: { lat: 31.5204, lng: 120.3737 }, distanceFromVehicle: 98, estimatedArrival: 78, hasCharging: true, hasRestaurant: true },
    { id: 'sa003', name: '常州滆湖服务区', position: { lat: 31.6204, lng: 119.8737 }, distanceFromVehicle: 156, estimatedArrival: 125, hasCharging: false, hasRestaurant: true },
  ],
  v002: [
    { id: 'sa004', name: '苏州北桥服务区', position: { lat: 31.6926, lng: 120.5453 }, distanceFromVehicle: 23, estimatedArrival: 19, hasCharging: true, hasRestaurant: true },
    { id: 'sa005', name: '无锡梅村服务区', position: { lat: 31.7926, lng: 120.0453 }, distanceFromVehicle: 78, estimatedArrival: 65, hasCharging: true, hasRestaurant: true },
  ],
  v003: [
    { id: 'sa006', name: '广州火村服务区', position: { lat: 23.1291, lng: 113.5644 }, distanceFromVehicle: 32, estimatedArrival: 45, hasCharging: true, hasRestaurant: true },
    { id: 'sa007', name: '东莞厚街服务区', position: { lat: 22.9291, lng: 113.7644 }, distanceFromVehicle: 89, estimatedArrival: 112, hasCharging: false, hasRestaurant: true },
  ],
  v004: [
    { id: 'sa008', name: '北京马驹桥服务区', position: { lat: 39.7042, lng: 116.5074 }, distanceFromVehicle: 28, estimatedArrival: 24, hasCharging: true, hasRestaurant: true },
    { id: 'sa009', name: '天津泗村店服务区', position: { lat: 39.4042, lng: 116.8074 }, distanceFromVehicle: 76, estimatedArrival: 68, hasCharging: true, hasRestaurant: true },
  ],
  v005: [
    { id: 'sa010', name: '成都龙泉驿服务区', position: { lat: 30.6728, lng: 104.2668 }, distanceFromVehicle: 34, estimatedArrival: 32, hasCharging: true, hasRestaurant: true },
    { id: 'sa011', name: '重庆永川服务区', position: { lat: 29.3630, lng: 105.9516 }, distanceFromVehicle: 289, estimatedArrival: 245, hasCharging: false, hasRestaurant: true },
  ],
  v006: [
    { id: 'sa012', name: '上海青浦服务区', position: { lat: 31.1204, lng: 121.1737 }, distanceFromVehicle: 15, estimatedArrival: 18, hasCharging: true, hasRestaurant: false },
  ],
  v007: [
    { id: 'sa013', name: '深圳福田服务区', position: { lat: 22.5431, lng: 114.1579 }, distanceFromVehicle: 12, estimatedArrival: 15, hasCharging: true, hasRestaurant: true },
  ],
  v008: [
    { id: 'sa014', name: '石家庄正定服务区', position: { lat: 38.1428, lng: 114.6149 }, distanceFromVehicle: 18, estimatedArrival: 22, hasCharging: true, hasRestaurant: true },
    { id: 'sa015', name: '保定服务区', position: { lat: 38.8428, lng: 115.4149 }, distanceFromVehicle: 95, estimatedArrival: 98, hasCharging: false, hasRestaurant: true },
  ],
};

export const mockDoorEvents: Record<string, DoorEvent[]> = {
  v001: [
    { id: 'de001', vehicleId: 'v001', type: 'open', timestamp: new Date(now.getTime() - 25 * 60 * 1000) },
    { id: 'de002', vehicleId: 'v001', type: 'close', timestamp: new Date(now.getTime() - 22 * 60 * 1000), duration: 180 },
    { id: 'de003', vehicleId: 'v001', type: 'open', timestamp: new Date(now.getTime() - 8 * 60 * 1000) },
    { id: 'de004', vehicleId: 'v001', type: 'close', timestamp: new Date(now.getTime() - 5 * 60 * 1000), duration: 175 },
  ],
  v002: [
    { id: 'de005', vehicleId: 'v002', type: 'open', timestamp: new Date(now.getTime() - 18 * 60 * 1000) },
    { id: 'de006', vehicleId: 'v002', type: 'close', timestamp: new Date(now.getTime() - 15 * 60 * 1000), duration: 165 },
  ],
  v003: [
    { id: 'de007', vehicleId: 'v003', type: 'open', timestamp: new Date(now.getTime() - 28 * 60 * 1000) },
    { id: 'de008', vehicleId: 'v003', type: 'close', timestamp: new Date(now.getTime() - 23 * 60 * 1000), duration: 300 },
    { id: 'de009', vehicleId: 'v003', type: 'open', timestamp: new Date(now.getTime() - 12 * 60 * 1000) },
    { id: 'de010', vehicleId: 'v003', type: 'close', timestamp: new Date(now.getTime() - 6 * 60 * 1000), duration: 360 },
  ],
  v004: [
    { id: 'de011', vehicleId: 'v004', type: 'open', timestamp: new Date(now.getTime() - 15 * 60 * 1000) },
    { id: 'de012', vehicleId: 'v004', type: 'close', timestamp: new Date(now.getTime() - 13 * 60 * 1000), duration: 120 },
  ],
  v005: [
    { id: 'de013', vehicleId: 'v005', type: 'open', timestamp: new Date(now.getTime() - 22 * 60 * 1000) },
    { id: 'de014', vehicleId: 'v005', type: 'close', timestamp: new Date(now.getTime() - 19 * 60 * 1000), duration: 195 },
  ],
  v006: [],
  v007: [
    { id: 'de015', vehicleId: 'v007', type: 'open', timestamp: new Date(now.getTime() - 10 * 60 * 1000) },
    { id: 'de016', vehicleId: 'v007', type: 'close', timestamp: new Date(now.getTime() - 8 * 60 * 1000), duration: 110 },
  ],
  v008: [
    { id: 'de017', vehicleId: 'v008', type: 'open', timestamp: new Date(now.getTime() - 26 * 60 * 1000) },
    { id: 'de018', vehicleId: 'v008', type: 'close', timestamp: new Date(now.getTime() - 20 * 60 * 1000), duration: 330 },
    { id: 'de019', vehicleId: 'v008', type: 'open', timestamp: new Date(now.getTime() - 14 * 60 * 1000) },
    { id: 'de020', vehicleId: 'v008', type: 'close', timestamp: new Date(now.getTime() - 9 * 60 * 1000), duration: 280 },
  ],
};
