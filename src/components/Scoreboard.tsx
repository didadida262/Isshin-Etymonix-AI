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
        'flex flex-wrap items-center gap-2',
        embedded && 'shrink-0 border-b border-white/[0.08] bg-white/[0.03] px-3 py-2'
      )}
    >
      <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400">
        {t.round(round, maxRounds)}
      </span>
      <span className="rounded-lg border border-emerald-500/25 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
        {t.correct(correct)}
      </span>
      <span className="rounded-lg border border-rose-500/25 bg-rose-950/40 px-2.5 py-1 text-[11px] font-medium text-rose-300">
        {t.wrong(wrong)}
      </span>
      {lastVerdict && (
        <motion.span
          key={lastVerdict}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            'rounded-lg px-2.5 py-1 text-[11px] font-bold',
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
