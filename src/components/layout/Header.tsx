import { NavLink, useLocation } from 'react-router-dom';
import { Thermometer, MapPin, AlertTriangle, Bell, User, Clock } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAppStore } from '@/store';

export const Header = () => {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const vehicles = useAppStore((state) => state.vehicles);
  const filters = useAppStore((state) => state.filters);
  
  const alertCount = useMemo(() => {
    const filtered = vehicles.filter((vehicle) => {
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
    
    return filtered.reduce(
      (counts, vehicle) => {
        counts[vehicle.currentStatus]++;
        return counts;
      },
      { normal: 0, warning: 0, alert: 0 }
    );
  }, [vehicles, filters]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { path: '/overview', label: '车辆总览', icon: MapPin },
    { path: '/disposal', label: '预警处置', icon: AlertTriangle },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <header className="h-16 bg-deep-blue-800 border-b border-deep-blue-700 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-info to-success rounded-lg flex items-center justify-center">
            <Thermometer className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">冷链温漂预警系统</h1>
            <p className="text-xs text-deep-blue-600">Cold Chain Temperature Monitoring</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                  active
                    ? 'bg-info/20 text-info border border-info/30'
                    : 'text-deep-blue-600 hover:text-white hover:bg-deep-blue-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
                {item.path === '/disposal' && (alertCount.warning > 0 || alertCount.alert > 0) && (
                  <span className="flex items-center justify-center min-w-5 h-5 bg-danger text-white text-xs font-bold rounded-full px-1.5">
                    {alertCount.warning + alertCount.alert}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-deep-blue-600">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono">
            {format(currentTime, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
          </span>
        </div>

        <div className="relative">
          <button className="p-2 text-deep-blue-600 hover:text-white transition-colors relative">
            <Bell className="w-5 h-5" />
            {alertCount.alert > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full animate-pulse" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-deep-blue-700">
          <div className="w-8 h-8 bg-info/20 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-info" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">李明</p>
            <p className="text-xs text-deep-blue-600">调度员</p>
          </div>
        </div>
      </div>
    </header>
  );
};
