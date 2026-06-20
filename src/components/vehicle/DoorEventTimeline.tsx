import { motion } from 'framer-motion';
import { DoorOpen, DoorClosed, Clock } from 'lucide-react';
import type { DoorEvent } from '@/types';
import { formatTime, formatDuration } from '@/utils/format';

interface DoorEventTimelineProps {
  events: DoorEvent[];
}

export const DoorEventTimeline = ({ events }: DoorEventTimelineProps) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-deep-blue-600">
        <DoorClosed className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">过去30分钟内无开关门记录</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-deep-blue-700" />
      
      <div className="space-y-4">
        {events.map((event, index) => {
          const isOpen = event.type === 'open';
          const Icon = isOpen ? DoorOpen : DoorClosed;
          
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative"
            >
              <div
                className={`absolute -left-6 w-6 h-6 rounded-full border-2 border-deep-blue-800 flex items-center justify-center ${
                  isOpen ? 'bg-warning' : 'bg-success'
                }`}
              >
                <Icon className="w-3 h-3 text-white" />
              </div>
              
              <div className="bg-deep-blue-700/50 rounded-lg p-3 ml-4">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${isOpen ? 'text-warning' : 'text-success'}`}>
                    {isOpen ? '开门' : '关门'}
                  </span>
                  <span className="text-xs text-deep-blue-600 font-mono">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                {event.duration && (
                  <div className="flex items-center gap-1 text-xs text-deep-blue-600">
                    <Clock className="w-3 h-3" />
                    <span>持续 {formatDuration(event.duration)}</span>
                  </div>
                )}
                {isOpen && event.duration && event.duration > 180 && (
                  <div className="mt-2 text-xs text-warning bg-warning/10 px-2 py-1 rounded">
                    ⚠️ 开门时间过长，可能导致温度上升
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
