import logoUrl from '../assets/Isshin-Etymonix-AI_logo.png';
import { cn } from '../lib/cn';

interface SiteBrandProps {
  title: string;
  /** 移动端可隐藏副标题，只保留 logo */
  compact?: boolean;
  className?: string;
  logoSize?: number;
}

export function SiteBrand({ title, compact = false, className, logoSize = 40 }: SiteBrandProps) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2 sm:gap-3', className)}>
      <img
        src={logoUrl}
        alt="Isshin Etyomnix AI"
        className="-ml-0.5 h-12 shrink-0 rounded-lg border border-white/10 bg-white/[0.06] object-contain p-1"
      />
      <h1
        className={cn(
          'min-w-0 font-display font-semibold tracking-tight text-white',
          compact ? 'text-sm md:text-lg' : 'text-xl md:text-2xl'
        )}
      >
        <span className="bg-gradient-to-r from-cyan-200 via-white to-violet-200 bg-clip-text text-transparent">
          {title}
        </span>
      </h1>
    </div>
  );
}
