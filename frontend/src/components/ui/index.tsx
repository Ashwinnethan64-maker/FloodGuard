import React from 'react';
import { cn } from './tokens';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, icon, disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#533afd]/20 disabled:opacity-50 disabled:pointer-events-none rounded-[4px] border cursor-pointer';
    
    const sizeClasses = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-xs px-3.5 py-2 gap-2',
      lg: 'text-sm px-4 py-2.5 gap-2.5',
    };

    const variantClasses = {
      primary: 'bg-[#533afd] hover:bg-[#7389ff] text-white border-transparent shadow-xs',
      secondary: 'bg-[#e8e9ff] hover:bg-[#d8dbff] text-[#533afd] border-transparent',
      outline: 'bg-white hover:bg-[#f8fafd] text-[#061b31] border-[#e5edf5]',
      ghost: 'bg-transparent hover:bg-[#f8fafd] text-[#50617a] hover:text-[#061b31] border-transparent',
      danger: 'bg-[#fef2f2] hover:bg-[#fee2e2] text-[#dc2626] border-[#fecaca]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
}

export const Card = ({ className, title, subtitle, headerAction, children, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        'bg-white border border-[#e5edf5] rounded-[4px] p-6 transition-all shadow-xs',
        className
      )}
      {...props}
    >
      {(title || headerAction) && (
        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-[#f1f5f9]">
          <div>
            {title && <h3 className="text-sm font-semibold text-[#061b31] tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-[#64748d] mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export const Badge = ({
  status,
  children,
  className,
}: {
  status?: 'OPEN' | 'CAUTION' | 'BLOCKED' | 'UNVERIFIED' | 'VERIFIED' | 'PENDING' | 'REJECTED' | 'RESOLVED' | 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL' | 'MODERATE' | 'IMPASSABLE';
  children?: React.ReactNode;
  className?: string;
}) => {
  let badgeStyle = 'bg-[#f1f5f9] text-[#64748d] border-[#e2e8f0]';
  const label = children || status;

  if (status === 'OPEN' || status === 'VERIFIED' || status === 'RESOLVED' || status === 'LOW') {
    badgeStyle = 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]';
  } else if (status === 'CAUTION' || status === 'PENDING' || status === 'MEDIUM' || status === 'MODERATE') {
    badgeStyle = 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]';
  } else if (status === 'BLOCKED' || status === 'REJECTED' || status === 'HIGH' || status === 'CRITICAL' || status === 'IMPASSABLE') {
    badgeStyle = 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]';
  } else if (status === 'UNVERIFIED') {
    badgeStyle = 'bg-[#eef2ff] text-[#6366f1] border-[#c7d2fe]';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium border uppercase tracking-wider',
        badgeStyle,
        className
      )}
    >
      {label}
    </span>
  );
};
