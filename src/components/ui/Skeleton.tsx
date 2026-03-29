import { cn } from '../../lib/cn';

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-md bg-gradient-to-r from-zinc-200/80 via-zinc-100 to-zinc-200/80 dark:from-zinc-700/50 dark:via-zinc-600/40 dark:to-zinc-700/50',
        'animate-shimmer bg-[length:200%_100%]',
        className,
      )}
      aria-hidden
    />
  );
}
