import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'success' | 'warning' | 'danger' | 'info';
  delay?: number;
}

const colorClasses = {
  success: {
    bg: 'bg-success/10',
    border: 'border-success/30',
    text: 'text-success',
    iconBg: 'bg-success/20',
    bar: 'bg-success',
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    text: 'text-warning',
    iconBg: 'bg-warning/20',
    bar: 'bg-warning',
  },
  danger: {
    bg: 'bg-danger/10',
    border: 'border-danger/30',
    text: 'text-danger',
    iconBg: 'bg-danger/20',
    bar: 'bg-danger',
  },
  info: {
    bg: 'bg-info/10',
    border: 'border-info/30',
    text: 'text-info',
    iconBg: 'bg-info/20',
    bar: 'bg-info',
  },
};

export const StatsCard = ({ title, value, icon: Icon, color, delay = 0 }: StatsCardProps) => {
  const classes = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`${classes.bg} ${classes.border} border rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`${classes.iconBg} p-2 rounded-md`}>
          <Icon className={`w-5 h-5 ${classes.text}`} />
        </div>
        <span className={`text-3xl font-bold font-mono ${classes.text}`}>{value}</span>
      </div>
      <p className="text-sm text-deep-blue-600 mb-2">{title}</p>
      <div className="h-1 bg-deep-blue-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value * 10)}%` }}
          transition={{ duration: 0.8, delay: delay + 0.2 }}
          className={`h-full ${classes.bar} rounded-full`}
        />
      </div>
    </motion.div>
  );
};
