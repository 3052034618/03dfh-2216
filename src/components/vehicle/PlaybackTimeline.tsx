import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Clock,
  Thermometer,
  AlertTriangle,
  Route,
  CheckCircle,
} from 'lucide-react';
import type { TemperatureReading, RouteSegment, DisposalRecord, DoorEvent, Vehicle, VehicleStatus } from '@/types';
import {
  formatFullDateTime,
  formatTime,
  formatTemperature,
  getStatusColor,
} from '@/utils/format';
import { DISPOSAL_TYPE_LABELS } from '@/types';

interface PlaybackTimelineProps {
  vehicle: Vehicle;
  temperatureData: TemperatureReading[];
  routeSegments: RouteSegment[];
  disposalRecords: DisposalRecord[];
  doorEvents: DoorEvent[];
  onTimeChange: (time: Date, snapshot: PlaybackSnapshot) => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
}

export interface PlaybackSnapshot {
  time: Date;
  temperature: number | null;
  riskLevel: VehicleStatus;
  activeRiskSegments: RouteSegment[];
  nearestRiskSegment: RouteSegment | null;
  disposalRecordsBefore: DisposalRecord[];
  currentDisposal: DisposalRecord | null;
  doorEventsBefore: DoorEvent[];
  currentDoorEvent: DoorEvent | null;
  traveledMileage: number;
  position: { lat: number; lng: number } | null;
}

export const PlaybackTimeline = ({
  vehicle,
  temperatureData,
  routeSegments,
  disposalRecords,
  doorEvents,
  onTimeChange,
  onPlaybackStateChange,
}: PlaybackTimelineProps) => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const vehicleDisposals = useMemo(
    () => disposalRecords.filter((r) => r.vehicleId === vehicle.id),
    [disposalRecords, vehicle.id]
  );

  const vehicleDoorEvents = useMemo(
    () => doorEvents.filter((e) => e.vehicleId === vehicle.id),
    [doorEvents, vehicle.id]
  );

  const timeRange = useMemo(() => {
    const now = Date.now();
    const startTime = now - 30 * 60 * 1000;
    const endTime = now;
    return {
      start: new Date(startTime),
      end: new Date(endTime),
      durationMs: 30 * 60 * 1000,
    };
  }, []);

  const displayTime = currentTime || timeRange.end;

  const getSnapshotAtTime = useCallback((targetTime: Date): PlaybackSnapshot => {
    const targetMs = targetTime.getTime();
    const traveled = vehicle.traveledMileage || (vehicle.totalMileage - vehicle.remainingMileage);
    const progress = Math.min(
      1,
      Math.max(0, (targetMs - timeRange.start.getTime()) / timeRange.durationMs)
    );
    const playbackTraveled = Math.max(0, traveled - (1 - progress) * 20);

    const sortedTemps = [...temperatureData].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const tempAtTime = sortedTemps.filter((t) => t.timestamp.getTime() <= targetMs);
    const currentTemp = tempAtTime.length > 0 ? tempAtTime[tempAtTime.length - 1].temperature : null;

    const targetRange = targetTime.getTime() - timeRange.start.getTime();
    const currentRangeMs = Date.now() - timeRange.start.getTime();
    const scale = targetRange / currentRangeMs;

    const activeSegments = routeSegments.filter(
      (s) =>
        s.type !== 'normal' &&
        s.startMileage <= playbackTraveled + 15 &&
        s.endMileage >= playbackTraveled - 2
    );

    const nearestSegment = activeSegments.length > 0
      ? activeSegments.reduce((nearest, s) => {
        const distToStart = Math.abs(s.startMileage - playbackTraveled);
        const distToNearest = Math.abs(nearest.startMileage - playbackTraveled);
        return distToStart < distToNearest ? s : nearest;
      }, activeSegments[0])
      : null;

    let riskLevel: VehicleStatus = 'normal';
    if (currentTemp !== null) {
      if (currentTemp > vehicle.targetTempMax + 0.3 || currentTemp < vehicle.targetTempMin - 0.3) {
        riskLevel = 'alert';
      } else if (currentTemp > vehicle.targetTempMax - 0.5 || currentTemp < vehicle.targetTempMin + 0.5) {
        riskLevel = 'warning';
      }
    }

    const inRiskSegment = activeSegments.some(
      (s) => s.startMileage <= playbackTraveled && s.endMileage >= playbackTraveled
    );
    const upcomingRisk = activeSegments.some(
      (s) => s.startMileage > playbackTraveled && s.startMileage - playbackTraveled <= 15
    );

    if (inRiskSegment && riskLevel === 'normal') riskLevel = 'warning';
    if (upcomingRisk && activeSegments.some((s) => s.type === 'hotspot')) riskLevel = 'warning';
    if (inRiskSegment && riskLevel === 'warning') riskLevel = 'alert';

    const disposalsBefore = vehicleDisposals.filter((d) => d.timestamp.getTime() <= targetMs);
    const currentDisposal = disposalsBefore.length > 0
      ? disposalsBefore.reduce((latest, d) =>
          d.timestamp.getTime() > latest.timestamp.getTime() ? d : latest
        , disposalsBefore[0] as DisposalRecord)
      : null;

    const doorsBefore = vehicleDoorEvents.filter((d) => d.timestamp.getTime() <= targetMs);
    const currentDoorEvent = doorsBefore.length > 0
      ? doorsBefore.reduce((latest, d) =>
          d.timestamp.getTime() > latest.timestamp.getTime() ? d : latest
        , doorsBefore[0] as DoorEvent)
      : null;

    const positionIdx = Math.floor(progress * vehicle.route.length);
    const position = positionIdx >= 0 && positionIdx < vehicle.route.length
      ? vehicle.route[positionIdx]
      : vehicle.route[vehicle.route.length - 1] || null;

    return {
      time: targetTime,
      temperature: currentTemp,
      riskLevel,
      activeRiskSegments: activeSegments,
      nearestRiskSegment: nearestSegment,
      disposalRecordsBefore: disposalsBefore,
      currentDisposal,
      doorEventsBefore: doorsBefore,
      currentDoorEvent,
      traveledMileage: playbackTraveled,
      position,
    };
  }, [vehicle, temperatureData, routeSegments, vehicleDisposals, vehicleDoorEvents, timeRange]);

  const handleTimeChange = useCallback((time: Date) => {
    setCurrentTime(time);
    const snapshot = getSnapshotAtTime(time);
    onTimeChange(time, snapshot);
  }, [getSnapshotAtTime, onTimeChange]);

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));
    const newTime = new Date(timeRange.start.getTime() + progress * timeRange.durationMs);
    handleTimeChange(newTime);
  }, [timeRange, handleTimeChange]);

  const handleDragStart = () => {
    setIsDragging(true);
    if (isPlaying) {
      setIsPlaying(false);
      onPlaybackStateChange?.(false);
    }
  };

  const handleDragMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));
    const newTime = new Date(timeRange.start.getTime() + progress * timeRange.durationMs);
    handleTimeChange(newTime);
  }, [isDragging, timeRange, handleTimeChange]);

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const togglePlayback = () => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    onPlaybackStateChange?.(newIsPlaying);
  };

  const resetPlayback = () => {
    setIsPlaying(false);
    setCurrentTime(null);
    onPlaybackStateChange?.(false);
    handleTimeChange(timeRange.end);
  };

  const skipBackward = () => {
    const baseTime = currentTime || timeRange.end;
    const newTime = new Date(baseTime.getTime() - 60 * 1000);
    handleTimeChange(newTime > timeRange.start ? newTime : timeRange.start);
  };

  const skipForward = () => {
    const baseTime = currentTime || timeRange.end;
    const newTime = new Date(baseTime.getTime() + 60 * 1000);
    handleTimeChange(newTime < timeRange.end ? newTime : timeRange.end);
  };

  useEffect(() => {
    if (isPlaying) {
      const animate = (timestamp: number) => {
        if (timestamp - lastUpdateRef.current >= 100 / playbackSpeed) {
          lastUpdateRef.current = timestamp;
          setCurrentTime((prev) => {
            const baseTime = prev || timeRange.end;
            const newTime = new Date(baseTime.getTime() + 100);
            if (newTime >= timeRange.end) {
              setIsPlaying(false);
              onPlaybackStateChange?.(false);
              return timeRange.end;
            }
            const snapshot = getSnapshotAtTime(newTime);
            onTimeChange(newTime, snapshot);
            return newTime;
          });
        }
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, timeRange, getSnapshotAtTime, onTimeChange, onPlaybackStateChange]);

  const currentProgress = currentTime
    ? ((currentTime.getTime() - timeRange.start.getTime()) / timeRange.durationMs) * 100
    : 100;

  const currentSnapshot = currentTime ? getSnapshotAtTime(currentTime) : getSnapshotAtTime(timeRange.end);

  return (
    <div className="bg-deep-blue-800/50 rounded-lg border border-deep-blue-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-info" />
          <span className="font-semibold text-white">回放时间轴</span>
          <span className="text-xs text-deep-blue-600">
            {formatFullDateTime(displayTime)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {currentSnapshot.riskLevel !== 'normal' && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              currentSnapshot.riskLevel === 'alert' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'
            }`}>
              <AlertTriangle className="w-3 h-3" />
              <span>{currentSnapshot.riskLevel === 'alert' ? '告警' : '预警'}</span>
            </div>
          )}

          {currentSnapshot.temperature !== null && (
            <div className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-deep-blue-700 text-white font-mono">
              <Thermometer className="w-3 h-3" />
              <span>{formatTemperature(currentSnapshot.temperature)}</span>
            </div>
          )}

          {currentSnapshot.currentDisposal && (
            <div className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-info/20 text-info">
              <Route className="w-3 h-3" />
              <span>{DISPOSAL_TYPE_LABELS[currentSnapshot.currentDisposal.type]}</span>
            </div>
          )}
        </div>
      </div>

      <div
        ref={timelineRef}
        className="relative h-16 bg-deep-blue-900/50 rounded-lg cursor-pointer select-none mb-4"
        onClick={handleTimelineClick}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <div className="absolute inset-y-0 left-0 bg-info/20 rounded-l-lg transition-all" style={{ width: `${currentProgress}%` }} />

        <div className="absolute inset-0 flex items-center">
          {vehicleDisposals.map((record) => {
            const pos = ((record.timestamp.getTime() - timeRange.start.getTime()) / timeRange.durationMs) * 100;
            if (pos < 0 || pos > 100) return null;
            return (
              <div
                key={record.id}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${pos}%` }}
              >
                <div className={`w-3 h-3 rounded-full ${
                  record.status === 'completed' ? 'bg-success' : 'bg-warning'
                } border-2 border-deep-blue-900`}
                  title={`${DISPOSAL_TYPE_LABELS[record.type]} - ${formatTime(record.timestamp)}`}
                />
              </div>
            );
          })}
        </div>

        <div className="absolute inset-0 flex items-center pointer-events-none">
          {routeSegments.filter((s) => s.type !== 'normal').map((seg) => {
            const startPos = ((seg.startMileage / vehicle.totalMileage) * 100);
            const width = Math.max(2, ((seg.endMileage - seg.startMileage) / vehicle.totalMileage) * 100);
            const color = seg.type === 'hotspot' ? 'bg-danger' : seg.type === 'congestion' ? 'bg-warning' : 'bg-warning';
            return (
              <div
                key={seg.id}
                className={`absolute h-1.5 ${color} opacity-60 rounded`}
                style={{ left: `${startPos}%`, width: `${width}%`, top: '65%' }}
                title={seg.description}
              />
            );
          })}
        </div>

        <div
          className="absolute top-0 bottom-0 w-0.5 bg-info z-10 pointer-events-none"
          style={{ left: `${currentProgress}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-info rounded-full shadow-lg" />
        </div>

        <div className="absolute bottom-1 left-0 right-0 flex justify-between px-2 text-xs text-deep-blue-600 pointer-events-none">
          <span>{formatTime(timeRange.start)}</span>
          <span>{formatTime(timeRange.end)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={resetPlayback}
            className="p-2 text-deep-blue-600 hover:text-white hover:bg-deep-blue-700 rounded-lg transition-colors"
            title="重置"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={skipBackward}
            className="p-2 text-deep-blue-600 hover:text-white hover:bg-deep-blue-700 rounded-lg transition-colors"
            title="后退1分钟"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlayback}
            className="p-2.5 bg-info hover:bg-info/90 text-white rounded-lg transition-colors"
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={skipForward}
            className="p-2 text-deep-blue-600 hover:text-white hover:bg-deep-blue-700 rounded-lg transition-colors"
            title="前进1分钟"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 ml-4">
            {[0.5, 1, 2].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-info/20 text-info'
                    : 'text-deep-blue-600 hover:text-white hover:bg-deep-blue-700'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-deep-blue-600">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-success" />
            <span>处置记录</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1 bg-warning rounded" />
            <span>风险路段</span>
          </div>
          {currentTime && (
            <span className="text-white font-mono">
              T- {Math.round((timeRange.end.getTime() - currentTime.getTime()) / 1000)}s
            </span>
          )}
        </div>
      </div>

      {currentTime && (
        <div className="mt-4 pt-4 border-t border-deep-blue-700 grid grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-deep-blue-600 mb-1">车辆状态</p>
            <p className={`font-semibold ${getStatusColor(currentSnapshot.riskLevel)}`}>
              {currentSnapshot.riskLevel === 'normal' ? '正常' :
                currentSnapshot.riskLevel === 'warning' ? '预警' : '告警'}
            </p>
          </div>
          <div>
            <p className="text-deep-blue-600 mb-1">已行驶</p>
            <p className="text-white font-mono">{Math.round(currentSnapshot.traveledMileage)} km</p>
          </div>
          <div>
            <p className="text-deep-blue-600 mb-1">风险段内</p>
            <p className="text-white">
              {currentSnapshot.activeRiskSegments.length > 0 ? '是' : '否'}
            </p>
          </div>
          <div>
            <p className="text-deep-blue-600 mb-1">已处置</p>
            <p className="text-white">
              {currentSnapshot.disposalRecordsBefore.length} 条
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
