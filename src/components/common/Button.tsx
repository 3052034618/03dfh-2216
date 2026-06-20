import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses = {
  primary: 'bg-info hover:bg-info/90 text-white',
  success: 'bg-success hover:bg-success/90 text-white',
  warning: 'bg-warning hover:bg-warning/90 text-white',
  danger: 'bg-danger hover:bg-danger/90 text-white',
  secondary: 'bg-deep-blue-700 hover:bg-deep-blue-600 text-white',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconPosition = 'left',
      children,
      className,
      fullWidth,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref as React.RefObject<HTMLButtonElement>}
        whileHover={!disabled ? { y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        transition={{ duration: 0.15 }}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-deep-blue focus:ring-info/50',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled}
        {...props as unknown as React.ComponentProps<typeof motion.button>}
      >
        {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
        {children}
        {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
