import { faRightFromBracket, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className = '' }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  const email = user.email ?? '';
  const initial = email ? email.charAt(0).toUpperCase() : '?';

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="hidden max-w-[140px] truncate text-xs text-zinc-500 sm:block"
        title={email}
      >
        {email}
      </div>
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-cyan-300"
        title={email}
        aria-hidden
      >
        {initial}
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        title="Sign out"
        aria-label="Sign out"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-red-500/30 hover:bg-white/10 hover:text-red-300 disabled:opacity-60"
      >
        <FontAwesomeIcon
          icon={signingOut ? faSpinner : faRightFromBracket}
          spin={signingOut}
          className="h-4 w-4"
        />
      </button>
    </div>
  );
}
