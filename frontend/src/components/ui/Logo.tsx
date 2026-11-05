import { cn } from './tokens';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  alt?: string;
}

const sizeMap = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

export const NeerpathLogo = ({
  className,
  size = 'md',
  alt = 'NEERPATH Logo',
}: LogoProps) => {
  return (
    <img
      src="/logo.png"
      alt={alt}
      className={cn(
        'object-contain shrink-0 select-none transition-transform',
        sizeMap[size],
        className
      )}
      loading="eager"
      decoding="async"
    />
  );
};

