import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AmbientBackdrop } from './AmbientBackdrop';

export function AuthLoadingScreen() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
      <AmbientBackdrop />
      <FontAwesomeIcon icon={faSpinner} spin className="relative z-10 h-8 w-8 text-cyan-400" />
    </div>
  );
}
