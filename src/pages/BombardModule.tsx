import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AmbientBackdrop } from '../components/AmbientBackdrop';
import { type Unite1DataItem as Unite1Data } from '../data/unit1Roots';
import unite1DataRaw from '../data/unite1.json';

interface WordItem {
  word: string;
  definition: string;
  root?: string;
}

interface BombardModuleProps {
  unitId: number;
  words: WordItem[];
}

const TRANSLATIONS = {
  zh: {
    title: (unit: number) => `Unit ${unit} 词根轰炸`,
    back: '返回',
    allWords: '全部单词',
    startBtn: '开始轰炸',
    lang: 'EN',
  },
  en: {
    title: (unit: number) => `Unit ${unit} Root Bombard`,
    back: 'Back',
    allWords: 'All Words',
    startBtn: 'Start Bombard',
    lang: '中',
  },
} as const;

export function BombardModule({ unitId, words }: BombardModuleProps) {
  const [lang, setLang] = useState<'zh' | 'en'>('en');
  const t = TRANSLATIONS[lang];
  const navigate = useNavigate();

  // 按词根分组
  const groupedWords = words.reduce((acc, word) => {
    const root = word.root || 'Other';
    if (!acc[root]) acc[root] = [];
    acc[root].push(word);
    return acc;
  }, {} as Record<string, WordItem[]>);

  return (
    <div className="relative flex h-screen min-h-0 flex-col bg-zinc-950 text-zinc-100">
      <AmbientBackdrop />

      <header className="relative z-20 flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-zinc-950/20 px-6 py-4 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-300 transition-all hover:border-cyan-500/30 hover:bg-white/10 hover:text-white"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-cyan-400" />
          <span>{t.back}</span>
        </button>

        <h1 className="font-display text-xl font-semibold tracking-tight text-white md:text-2xl">
          {t.title(unitId)}
        </h1>

        <button
          type="button"
          onClick={() => setLang((prev) => (prev === 'zh' ? 'en' : 'zh'))}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:border-cyan-500/30 hover:bg-white/10 hover:text-white"
        >
          <span>{t.lang}</span>
        </button>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-8 md:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-12 flex items-end justify-between border-b border-white/5 pb-6">
            <div>
              <h2 className="font-display text-3xl font-bold text-white tracking-tight">
                {t.allWords}
              </h2>
              <p className="mt-2 text-sm text-zinc-400 font-medium">Total {words.length} words categorized by roots</p>
            </div>
            <motion.button
              type="button"
              whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(34,211,238,0.4)' }}
              whileTap={{ scale: 0.95 }}
              className="rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-8 py-3.5 text-base font-bold text-cyan-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:bg-cyan-500/20"
            >
              {t.startBtn}
            </motion.button>
          </div>

          <div className="space-y-16">
            {Object.entries(groupedWords).map(([root, rootWords], rootIndex) => (
              <motion.section
                key={root}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rootIndex * 0.1 }}
                className="relative"
              >
                {/* 词根标题区 */}
                <div className="sticky top-0 z-10 mb-6 flex items-center gap-4 bg-zinc-950/80 py-2 backdrop-blur-sm">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-zinc-800" />
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5 text-sm font-bold text-cyan-400 tracking-wider">
                      {root.split(/[:：]/)[0]}
                    </span>
                    <span className="text-sm font-medium text-zinc-500 italic">
                      {root.split(/[:：]/)[1] || ''}
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent via-zinc-800 to-zinc-800" />
                </div>

                {/* 单词卡片网格 */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {rootWords.map((item, wordIndex) => (
                    <motion.div
                      key={item.word}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: rootIndex * 0.1 + wordIndex * 0.05 }}
                      whileHover={{ scale: 1.03, transition: { type: 'spring', stiffness: 350, damping: 22 } }}
                      className="group relative flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 will-change-transform hover:border-cyan-500/30 hover:bg-white/[0.05] hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="font-display text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {item.word}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-zinc-400 group-hover:text-zinc-200 transition-colors">
                        {item.definition}
                      </p>
                      
                      {/* 卡片装饰 */}
                      <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export function getMockWords(unitId: number): WordItem[] {
  if (unitId === 1) {
    // unite1DataRaw 的结构不同，需要转换
    return unite1DataRaw.flatMap((item: Unite1Data) =>
      item.words.map((w) => ({
        word: w.word,
        definition: w.definition,
        root: item.root,
      }))
    );
  }
  return [];
}