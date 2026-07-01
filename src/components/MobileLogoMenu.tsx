import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';

export type MobileLogoMenuItem = {
  id: string;
  label: string;
  icon?: IconDefinition;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
};

interface MobileLogoMenuProps {
  menuLabel: string;
  items: MobileLogoMenuItem[];
  className?: string;
}

export function MobileLogoMenu({
  menuLabel,
  items,
  className,
}: MobileLogoMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={menuLabel}
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:border-cyan-500/30 hover:bg-white/10',
          open && 'border-cyan-400/40 bg-white/10 ring-2 ring-cyan-400/25'
        )}
      >
        <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4 text-cyan-400" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label={menuLabel}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[11rem] overflow-hidden rounded-xl border border-white/10 bg-zinc-900/95 py-1 shadow-2xl shadow-black/40 backdrop-blur-md"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled) return;
                  item.onClick();
                  close();
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors',
                  item.variant === 'danger'
                    ? 'text-red-300 hover:bg-red-500/10'
                    : 'text-zinc-200 hover:bg-white/[0.06]',
                  item.disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {item.icon && (
                  <FontAwesomeIcon
                    icon={item.icon}
                    className={cn(
                      'h-4 w-4 shrink-0',
                      item.variant === 'danger' ? 'text-red-400' : 'text-cyan-400'
                    )}
                  />
                )}
                <span>{item.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
