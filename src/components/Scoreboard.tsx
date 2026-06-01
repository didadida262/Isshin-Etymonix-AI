import { motion } from 'framer-motion';
import { useAppLanguage } from '../context/AppLanguageContext';
import { useGameSessionOptional } from '../context/GameSessionContext';
import { getScoreboardUi } from '../lib/chatUiI18n';
import { cn } from '../lib/cn';

type ScoreboardProps = {
  /** 嵌入判官面板内 */
  embedded?: boolean;
};

export function Scoreboard({ embedded = false }: ScoreboardProps) {
  const { lang } = useAppLanguage();
  const t = getScoreboardUi(lang);
  const game = useGameSessionOptional();
  if (!game?.active) return null;

  const { round, maxRounds, correct, wrong, lastVerdict } = game;

  return (
    <motion.div
      initial={{ opacity: 0, y: embedded ? 4 : -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center gap-1.5',
        embedded ? 'min-w-0 shrink flex-nowrap' : 'flex-wrap gap-2'
      )}
    >
      <span
        className={cn(
          'rounded-md border border-white/10 bg-white/5 text-zinc-400',
          embedded ? 'px-1.5 py-0.5 text-[10px]' : 'rounded-lg px-2.5 py-1 text-[11px]'
        )}
      >
        {t.round(round, maxRounds)}
      </span>
      <span
        className={cn(
          'rounded-md border border-emerald-500/25 bg-emerald-950/40 font-medium text-emerald-300',
          embedded ? 'px-1.5 py-0.5 text-[10px]' : 'rounded-lg px-2.5 py-1 text-[11px]'
        )}
      >
        {t.correct(correct)}
      </span>
      <span
        className={cn(
          'rounded-md border border-rose-500/25 bg-rose-950/40 font-medium text-rose-300',
          embedded ? 'px-1.5 py-0.5 text-[10px]' : 'rounded-lg px-2.5 py-1 text-[11px]'
        )}
      >
        {t.wrong(wrong)}
      </span>
      {lastVerdict && (
        <motion.span
          key={lastVerdict}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            'font-bold',
            embedded ? 'rounded-md px-1.5 py-0.5 text-[10px]' : 'rounded-lg px-2.5 py-1 text-[11px]',
            lastVerdict === '正确'
              ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40'
              : 'bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/40'
          )}
        >
          {t.lastVerdict(lastVerdict)}
        </motion.span>
      )}
    </motion.div>
  );
}
