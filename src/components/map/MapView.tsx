import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { Thermometer, AlertTriangle, Clock, TrendingUp, MapPin } from 'lucide-react';
import type { Vehicle, RouteSegment, AlternativeRoute, Position } from '@/types';
import { ROUTE_SEGMENT_LABELS, CONGESTION_LEVEL_LABELS } from '@/types';
import { formatTemperature, formatMileage, formatTime, formatDurationMinutes } from '@/utils/format';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  vehicles: Vehicle[];
  routeSegments?: Record<string, RouteSegment[]>;
  center?: [number, number];
  zoom?: number;
  selectedVehicleId?: string | null;
  alternativeRoutes?: AlternativeRoute[];
  selectedAlternativeRouteId?: string | null;
  showAlternativeRoutes?: boolean;
  playbackPosition?: Position | null;
  playbackSegments?: RouteSegment[];
}

const createCustomIcon = (vehicle: Vehicle) => {
  const displayStatus = vehicle.riskLevel || vehicle.currentStatus;
  const statusColors = {
    normal: '#10B981',
    warning: '#F59E0B',
    alert: '#EF4444',
  };
  
  const color = statusColors[displayStatus];
  const isAlert = displayStatus === 'alert';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        position: relative;
        width: 48px;
        height: 48px;
        ${isAlert ? 'animation: breathing 2s ease-in-out infinite;' : ''}
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: ${color};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: bold;
          color: white;
        ">
          ${vehicle.currentTemp > 0 ? '+' : ''}${vehicle.currentTemp.toFixed(1)}°
        </div>
        <div style="
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid ${color};
        "></div>
        ${isAlert ? `
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 16px;
            height: 16px;
            background: #EF4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            font-weight: bold;
            border: 2px solid white;
          ">!</div>
        ` : ''}
      </div>
    `,
    iconSize: [48, 52],
    iconAnchor: [24, 48],
    popupAnchor: [0, -52],
  });
};

const getSegmentColor = (type: RouteSegment['type']): string => {
  const colors: Record<string, string> = {
    normal: '#38BDF8',
    congestion: '#F59E0B',
    hotspot: '#EF4444',
    long_stop: '#F59E0B',
  };
  return colors[type] || '#38BDF8';
};

const SegmentPopup = ({ segment }: { segment: RouteSegment }) => {
  const isRisk = segment.type !== 'normal';

  return (
    <div className="min-w-[220px] p-1">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: getSegmentColor(segment.type) }}
          />
          <h4 className="font-bold text-white text-sm">
            {ROUTE_SEGMENT_LABELS[segment.type]}
          </h4>
        </div>
        {isRisk && (
          <span className="text-xs bg-danger/20 text-danger px-2 py-0.5 rounded font-medium">
            风险路段
          </span>
        )}
      </div>

      <p className="text-sm text-deep-blue-600 mb-3">{segment.description}</p>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-deep-blue-600" />
          <span className="text-deep-blue-600">里程:</span>
          <span className="text-white font-mono">
            {segment.startMileage} - {segment.endMileage} km
          </span>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-warning" />
          <span className="text-deep-blue-600">预计升温:</span>
          <span className="text-warning font-mono font-bold">
            +{segment.estimatedTempRise.toFixed(1)}℃
          </span>
        </div>

        {segment.estimatedOverheatTime && (
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-danger" />
            <span className="text-deep-blue-600">预计超温:</span>
            <span className={`font-mono font-bold ${
              segment.estimatedOverheatTime < 20 ? 'text-danger' : 'text-warning'
            }`}>
              {formatDurationMinutes(segment.estimatedOverheatTime)}后
            </span>
          </div>
        )}

        {segment.congestionLevel && (
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-warning" />
            <span className="text-deep-blue-600">拥堵等级:</span>
            <span className="text-warning">
              {CONGESTION_LEVEL_LABELS[segment.congestionLevel]}
            </span>
          </div>
        )}

        {segment.historicalHighTemp !== undefined && (
          <div className="flex items-center gap-2">
            <Thermometer className="w-3.5 h-3.5 text-danger" />
            <span className="text-deep-blue-600">历史最高:</span>
            <span className="text-danger font-mono">
              {formatTemperature(segment.historicalHighTemp)}
            </span>
          </div>
        )}

        {segment.stopDuration && (
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-warning" />
            <span className="text-deep-blue-600">预计停车:</span>
            <span className="text-warning font-mono">
              {formatDurationMinutes(segment.stopDuration)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const MapView = ({ 
  vehicles, 
  routeSegments = {}, 
  center = [35.8617, 104.1954], 
  zoom = 5,
  selectedVehicleId = null,
  alternativeRoutes = [],
  selectedAlternativeRouteId = null,
  showAlternativeRoutes = false,
  playbackPosition = null,
  playbackSegments = [],
}: MapViewProps) => {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  useEffect(() => {
    if (vehicles.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(vehicles.map((v) => [v.currentPosition.lat, v.currentPosition.lng]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [vehicles.length]);

  const getRouteColor = (vehicle: Vehicle) => {
    const displayStatus = vehicle.riskLevel || vehicle.currentStatus;
    const colors = {
      normal: '#38BDF8',
      warning: '#F59E0B',
      alert: '#EF4444',
    };
    return colors[displayStatus];
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        ref={mapRef as unknown as React.RefObject<L.Map>}
        center={center}
        zoom={zoom}
        className="h-full w-full"
        style={{ background: '#0F172A' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {vehicles.map((vehicle) => {
          const routeCoords = vehicle.route.map((p) => [p.lat, p.lng] as [number, number]);
          const segments = routeSegments[vehicle.id] || [];
          const displayStatus = vehicle.riskLevel || vehicle.currentStatus;
          const isSelected = selectedVehicleId === vehicle.id;

          return (
            <div key={vehicle.id}>
              <Polyline
                positions={routeCoords}
                color={getRouteColor(vehicle)}
                weight={isSelected ? 4 : 2.5}
                opacity={isSelected ? 0.8 : 0.5}
                dashArray="8, 8"
                className="route-line"
              />

              {segments.filter(s => s.type !== 'normal').map((segment) => {
                const segmentCoords: [number, number][] = [
                  [segment.startPosition.lat, segment.startPosition.lng],
                  [segment.endPosition.lat, segment.endPosition.lng],
                ];
                const isHovered = hoveredSegment === segment.id;
                const color = getSegmentColor(segment.type);

                return (
                  <div key={segment.id}>
                    <Polyline
                      positions={segmentCoords}
                      color={color}
                      weight={isHovered ? 8 : 5}
                      opacity={isHovered ? 0.9 : 0.7}
                      className="risk-segment"
                      pathOptions={{
                        className: `risk-segment ${isHovered ? 'hovered' : ''}`,
                      }}
                      eventHandlers={{
                        mouseover: () => setHoveredSegment(segment.id),
                        mouseout: () => setHoveredSegment(null),
                      }}
                    >
                      <Popup className="segment-popup">
                        <SegmentPopup segment={segment} />
                      </Popup>
                    </Polyline>

                    <Circle
                      center={[segment.startPosition.lat, segment.startPosition.lng]}
                      radius={segment.type === 'hotspot' ? 8000 : 5000}
                      pathOptions={{
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.2,
                        weight: 1,
                        dashArray: '4, 4',
                      }}
                    />
                  </div>
                );
              })}

              {displayStatus !== 'normal' && vehicle.nearestRisk && (
                <Circle
                  center={[vehicle.currentPosition.lat, vehicle.currentPosition.lng]}
                  radius={displayStatus === 'alert' ? 20000 : 12000}
                  pathOptions={{
                    color: displayStatus === 'alert' ? '#EF4444' : '#F59E0B',
                    fillColor: displayStatus === 'alert' ? '#EF4444' : '#F59E0B',
                    fillOpacity: 0.12,
                    weight: 2,
                    className: 'pulse-circle',
                  }}
                />
              )}

              <Marker
                position={[vehicle.currentPosition.lat, vehicle.currentPosition.lng]}
                icon={createCustomIcon(vehicle)}
                eventHandlers={{
                  click: () => navigate(`/detail/${vehicle.id}`),
                }}
                zIndexOffset={isSelected ? 1000 : 0}
              >
                <Popup className="custom-popup">
                  <div className="min-w-[200px] p-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold font-mono text-deep-blue">{vehicle.plateNumber}</h4>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded bg-current/10 ${
                        displayStatus === 'alert' ? 'text-danger' : 
                        displayStatus === 'warning' ? 'text-warning' : 'text-success'
                      }`}>
                        {displayStatus === 'alert' ? '告警' : displayStatus === 'warning' ? '预警' : '正常'}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Thermometer className={`w-4 h-4 ${
                          vehicle.currentStatus === 'alert' ? 'text-danger' : 
                          vehicle.currentStatus === 'warning' ? 'text-warning' : 'text-success'
                        }`} />
                        <span className="text-deep-blue-600">温度:</span>
                        <span className={`font-mono font-bold ${
                          vehicle.currentStatus === 'alert' ? 'text-danger' : 
                          vehicle.currentStatus === 'warning' ? 'text-warning' : 'text-success'
                        }`}>
                          {formatTemperature(vehicle.currentTemp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-deep-blue-600">剩余里程:</span>
                        <span className="text-deep-blue font-mono">{formatMileage(vehicle.remainingMileage)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-deep-blue-600">预计到达:</span>
                        <span className="text-deep-blue font-mono">{formatTime(vehicle.estimatedArrival)}</span>
                      </div>
                    </div>
                    {vehicle.nearestRisk && (
                      <div className="mt-2 pt-2 border-t border-deep-blue-700/30">
                        <div className="flex items-center gap-1 text-warning text-xs">
                          <AlertTriangle className="w-3 h-3" />
                          <span>前方{vehicle.nearestRisk.distance}公里: {vehicle.nearestRisk.description}</span>
                        </div>
                      </div>
                    )}
                    {displayStatus !== 'normal' && (
                      <div className="mt-2 text-center">
                        <span className="text-xs text-info">点击查看详情并处置 →</span>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </div>
          );
        })}

        {showAlternativeRoutes && alternativeRoutes.map((route) => {
          const isSelected = selectedAlternativeRouteId === route.id;
          const routeCoords = route.route.map((p) => [p.lat, p.lng] as [number, number]);

          return (
            <div key={route.id}>
              <Polyline
                positions={routeCoords}
                color={isSelected ? '#A855F7' : '#6366F1'}
                weight={isSelected ? 4 : 3}
                opacity={isSelected ? 0.8 : 0.4}
                dashArray={isSelected ? '10, 5' : '15, 10'}
                className="alternative-route"
              />

              {route.riskSegments.filter(s => s.type !== 'normal').map((segment) => {
                const segmentCoords: [number, number][] = [
                  [segment.startPosition.lat, segment.startPosition.lng],
                  [segment.endPosition.lat, segment.endPosition.lng],
                ];
                const color = getSegmentColor(segment.type);

                return (
                  <Polyline
                    key={segment.id}
                    positions={segmentCoords}
                    color={color}
                    weight={isSelected ? 6 : 4}
                    opacity={isSelected ? 0.7 : 0.4}
                    dashArray="6, 6"
                    className="alternative-risk-segment"
                  />
                );
              })}
            </div>
          );
        })}

        {playbackPosition && (
          <Marker
            position={[playbackPosition.lat, playbackPosition.lng]}
            icon={L.divIcon({
              className: 'playback-marker',
              html: `
                <div style="
                  position: relative;
                  width: 32px;
                  height: 32px;
                ">
                  <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 24px;
                    height: 24px;
                    background: #A855F7;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 0 15px rgba(168, 85, 247, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: pulse-playback 1.5s ease-in-out infinite;
                  ">
                    <div style="
                      width: 8px;
                      height: 8px;
                      background: white;
                      border-radius: 50%;
                    "/>
                  </div>
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            })}
          >
            <Popup>
              <div className="p-1">
                <p className="font-semibold text-sm text-deep-blue">回放位置</p>
              </div>
            </Popup>
          </Marker>
        )}

        {playbackSegments.length > 0 && playbackSegments.map((segment) => {
          const segmentCoords: [number, number][] = [
            [segment.startPosition.lat, segment.startPosition.lng],
            [segment.endPosition.lat, segment.endPosition.lng],
          ];
          const color = getSegmentColor(segment.type);

          return (
            <Circle
              key={segment.id}
              center={[segment.startPosition.lat, segment.startPosition.lng]}
              radius={6000}
              pathOptions={{
                color: '#A855F7',
                fillColor: color,
                fillOpacity: 0.3,
                weight: 2,
                dashArray: '3, 3',
              }}
            />
          );
        })}
      </MapContainer>

      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: #1E293B;
          border-radius: 8px;
          border: 1px solid #334155;
        }
        .custom-popup .leaflet-popup-content {
          margin: 8px;
          color: #E2E8F0;
        }
        .custom-popup .leaflet-popup-tip {
          background: #1E293B;
        }
        .segment-popup .leaflet-popup-content-wrapper {
          background: #1E293B;
          border-radius: 8px;
          border: 1px solid #334155;
        }
        .segment-popup .leaflet-popup-content {
          margin: 8px;
          color: #E2E8F0;
        }
        .segment-popup .leaflet-popup-tip {
          background: #1E293B;
        }
        @keyframes breathing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
        .risk-segment {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pulse-circle {
          animation: pulse-ring 2s ease-out infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes pulse-playback {
          0%, 100% { box-shadow: 0 0 15px rgba(168, 85, 247, 0.8); }
          50% { box-shadow: 0 0 25px rgba(168, 85, 247, 1); }
        }
        .alternative-route {
          pointer-events: none;
        }
        .alternative-risk-segment {
          pointer-events: none;
        }
        .playback-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
};
