import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../lib/cn';

type CategoriesTextLinkProps = Omit<LinkProps, 'className'> & {
  className?: string;
  children: ReactNode;
};

/**
 * 纯文本链接 + hover 渐变下划线与微光（用于 Categories 等入口）
 */
export function CategoriesTextLink({
  className,
  children,
  ...rest
}: CategoriesTextLinkProps) {
  return (
    <Link
      {...rest}
      className={cn(
        'group relative inline-flex flex-wrap items-baseline gap-x-2 pb-1 text-sm font-medium text-muted transition-colors duration-200',
        'hover:text-accent dark:hover:text-accent',
        className,
      )}
    >
      <span className="relative z-0">{children}</span>
      <span
        className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-500 to-cyan-400 opacity-90 transition-transform duration-300 ease-out will-change-transform group-hover:scale-x-100 dark:from-violet-300 dark:via-fuchsia-400 dark:to-cyan-300"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -bottom-px left-0 h-[6px] w-full origin-left scale-x-0 bg-gradient-to-r from-violet-500/40 via-fuchsia-500/35 to-cyan-500/40 blur-sm transition-transform duration-300 ease-out group-hover:scale-x-100"
        aria-hidden
      />
    </Link>
  );
}
