import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { Thermometer, AlertTriangle } from 'lucide-react';
import type { Vehicle } from '@/types';
import { formatTemperature, getStatusColor, getStatusLabel, formatMileage, formatTime } from '@/utils/format';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  vehicles: Vehicle[];
  center?: [number, number];
  zoom?: number;
}

const createCustomIcon = (vehicle: Vehicle) => {
  const statusColors = {
    normal: '#10B981',
    warning: '#F59E0B',
    alert: '#EF4444',
  };
  
  const color = statusColors[vehicle.currentStatus];
  const isAlert = vehicle.currentStatus === 'alert';
  
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

export const MapView = ({ vehicles, center = [35.8617, 104.1954], zoom = 5 }: MapViewProps) => {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (vehicles.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(vehicles.map((v) => [v.currentPosition.lat, v.currentPosition.lng]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [vehicles.length]);

  const getRouteColor = (vehicle: Vehicle) => {
    const colors = {
      normal: '#38BDF8',
      warning: '#F59E0B',
      alert: '#EF4444',
    };
    return colors[vehicle.currentStatus];
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
          const alertSegments = vehicle.currentStatus !== 'normal' ? [vehicle.currentPosition] : [];

          return (
            <div key={vehicle.id}>
              <Polyline
                positions={routeCoords}
                color={getRouteColor(vehicle)}
                weight={3}
                opacity={0.6}
                dashArray="10, 10"
                className="route-line"
              />

              {alertSegments.map((pos, idx) => (
                <Circle
                  key={`alert-${vehicle.id}-${idx}`}
                  center={[pos.lat, pos.lng]}
                  radius={15000}
                  pathOptions={{
                    color: vehicle.currentStatus === 'alert' ? '#EF4444' : '#F59E0B',
                    fillColor: vehicle.currentStatus === 'alert' ? '#EF4444' : '#F59E0B',
                    fillOpacity: 0.15,
                    weight: 2,
                  }}
                />
              ))}

              <Marker
                position={[vehicle.currentPosition.lat, vehicle.currentPosition.lng]}
                icon={createCustomIcon(vehicle)}
                eventHandlers={{
                  click: () => navigate(`/detail/${vehicle.id}`),
                }}
              >
                <Popup className="custom-popup">
                  <div className="min-w-[200px] p-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold font-mono text-deep-blue">{vehicle.plateNumber}</h4>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusColor(vehicle.currentStatus)} bg-current/10`}>
                        {getStatusLabel(vehicle.currentStatus)}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Thermometer className={`w-4 h-4 ${getStatusColor(vehicle.currentStatus)}`} />
                        <span className="text-deep-blue-600">温度:</span>
                        <span className={`font-mono font-bold ${getStatusColor(vehicle.currentStatus)}`}>
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
                    {vehicle.currentStatus !== 'normal' && (
                      <div className="mt-2 pt-2 border-t border-deep-blue-700/30">
                        <div className="flex items-center gap-1 text-warning text-xs">
                          <AlertTriangle className="w-3 h-3" />
                          <span>点击查看详情并处置</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </div>
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
        @keyframes breathing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
};
