import logoUrl from '../assets/logo.png';
import { cn } from '../lib/cn';

interface SiteBrandProps {
  title: string;
  /** 移动端可隐藏副标题，只保留 logo */
  compact?: boolean;
  className?: string;
  logoSize?: number;
  variant?: 'dark' | 'light';
}

export function SiteBrand({
  title,
  compact = false,
  className,
  logoSize = 40,
  variant = 'dark',
}: SiteBrandProps) {
  const light = variant === 'light';

  return (
    <div className={cn('flex min-w-0 items-center gap-2 sm:gap-3', className)}>
      <img
        src={logoUrl}
        alt="Isshin Etyomnix AI"
        width={logoSize}
        height={logoSize}
        className={cn(
          '-ml-0.5 shrink-0 rounded-lg object-contain',
          light
            ? 'border border-zinc-200/90 bg-white/80 p-1 shadow-sm'
            : 'border border-white/15 bg-white shadow-sm shadow-black/25'
        )}
        style={{ width: logoSize, height: logoSize }}
      />
      <h1
        className={cn(
          'min-w-0 font-display font-semibold tracking-tight',
          light ? 'text-zinc-900' : 'text-white',
          compact ? 'text-sm md:text-lg' : 'text-xl md:text-2xl'
        )}
      >
        <span
          className={cn(
            'bg-clip-text text-transparent',
            light
              ? 'bg-gradient-to-r from-cyan-700 via-zinc-800 to-violet-700'
              : 'bg-gradient-to-r from-cyan-200 via-white to-violet-200'
          )}
        >
          {title}
        </span>
      </h1>
    </div>
  );
}
