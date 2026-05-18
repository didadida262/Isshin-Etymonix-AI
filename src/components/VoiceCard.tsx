import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

// ── 静音检测参数 ──────────────────────────────────────────
const VOLUME_THRESHOLD = 12;   // 0~255，低于此值视为静音
const SILENCE_BEFORE_SEND = 1800; // 静音持续多久(ms)后截断并发送
const MIN_RECORD_MS = 600;     // 最短录音时长，太短不发送
const MAX_RECORD_MS = 30000;   // 最长录音时长，强制截断

const API_BASE = '/api';
const MAX_HISTORY = 8;

interface Transcript {
  id: number;
  text: string;
  ts: number;
}

type CardStatus = 'starting' | 'listening' | 'processing' | 'error';

let idCounter = 0;

export function VoiceCard() {
  const [collapsed, setCollapsed] = useState(false);
  const [cardStatus, setCardStatus] = useState<CardStatus>('starting');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [processingCount, setProcessingCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [volume, setVolume] = useState(0); // 0~1，用于可视化

  const isActiveRef = useRef(true);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  // 后台发送转录请求，不阻塞录音循环
  const sendToBackend = useCallback((blob: Blob, mimeType: string) => {
    const form = new FormData();
    form.append('file', blob, `audio${mimeTypeToExt(mimeType)}`);
    setProcessingCount((c) => c + 1);

    fetch(`${API_BASE}/transcribe`, { method: 'POST', body: form })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ text: string; language: string }>;
      })
      .then(({ text }) => {
        if (text.trim()) {
          setTranscripts((prev) =>
            [...prev, { id: ++idCounter, text: text.trim(), ts: Date.now() }].slice(-MAX_HISTORY)
          );
        }
      })
      .catch((err) => console.warn('[Whisper] 转录失败:', err))
      .finally(() => setProcessingCount((c) => c - 1));
  }, []);

  // 主循环：每段录音结束后立即开始下一段
  const startLoop = useCallback(
    (stream: MediaStream, analyser: AnalyserNode) => {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const runSegment = () => {
        if (!isActiveRef.current) return;

        const mimeType = getSupportedMimeType();
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: Blob[] = [];
        let hasSpeech = false;
        let segmentStart = Date.now();
        let lastSoundTime = Date.now();
        let rafId = 0;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          cancelAnimationFrame(rafId);
          const duration = Date.now() - segmentStart;
          if (hasSpeech && duration >= MIN_RECORD_MS && chunks.length > 0) {
            const blob = new Blob(chunks, { type: mimeType });
            sendToBackend(blob, mimeType);
          }
          // 立刻开始下一段
          if (isActiveRef.current) runSegment();
        };

        recorder.start(150);
        setCardStatus('listening');

        const monitor = () => {
          if (!isActiveRef.current || recorder.state !== 'recording') return;

          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setVolume(avg / 255);

          if (avg > VOLUME_THRESHOLD) {
            hasSpeech = true;
            lastSoundTime = Date.now();
          }

          const elapsed = Date.now() - segmentStart;
          const silence = Date.now() - lastSoundTime;
          const shouldCut =
            (hasSpeech && silence >= SILENCE_BEFORE_SEND && elapsed >= MIN_RECORD_MS) ||
            elapsed >= MAX_RECORD_MS;

          if (shouldCut) {
            recorder.stop();
          } else {
            rafId = requestAnimationFrame(monitor);
          }
        };

        rafId = requestAnimationFrame(monitor);
      };

      runSegment();
    },
    [sendToBackend]
  );

  // 初始化：请求麦克风 + 启动循环
  useEffect(() => {
    isActiveRef.current = true;

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        if (!isActiveRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyserRef.current = analyser;
        ctx.createMediaStreamSource(stream).connect(analyser);

        startLoop(stream, analyser);
      })
      .catch((err) => {
        setErrorMsg('无法访问麦克风：' + err.message);
        setCardStatus('error');
      });

    return () => {
      isActiveRef.current = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startLoop]);

  // 音量可视化条数据（10根柱子）
  const bars = Array.from({ length: 10 }, (_, i) => {
    const base = volume;
    const noise = Math.sin(Date.now() / 200 + i * 1.5) * 0.15;
    return Math.max(0.05, Math.min(1, base + noise));
  });

  const showProcessing = processingCount > 0;
  const latestText = transcripts[transcripts.length - 1]?.text ?? '';
  const historyTexts = transcripts.slice(0, -1).reverse().slice(0, 3);

  return (
    <motion.div
      className="fixed bottom-5 right-5 z-50"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div
        style={{
          width: collapsed ? 'auto' : 300,
          background: 'rgba(14,14,20,0.95)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 16,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
      >
        {/* 标题栏 */}
        <div
          className="flex items-center justify-between px-3 py-2.5"
          style={{ borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2">
            <PulseDot status={cardStatus} />
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
              语音识别
            </span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {cardStatus === 'starting' && '启动中...'}
              {cardStatus === 'listening' && (showProcessing ? '识别中...' : '正在聆听')}
              {cardStatus === 'error' && '出错'}
            </span>
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1, padding: '2px 4px' }}
          >
            {collapsed ? '▴' : '▾'}
          </button>
        </div>

        {/* 展开内容 */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {cardStatus === 'error' ? (
                <div className="px-3 py-4 text-xs" style={{ color: 'rgba(248,113,113,0.85)' }}>
                  {errorMsg}
                </div>
              ) : (
                <>
                  {/* 音量可视化 */}
                  <div className="flex items-end gap-0.5 px-3 pt-3" style={{ height: 28 }}>
                    {bars.map((h, i) => (
                      <motion.div
                        key={i}
                        animate={{ scaleY: cardStatus === 'listening' ? h : 0.08 }}
                        transition={{ duration: 0.12 }}
                        style={{
                          flex: 1,
                          height: '100%',
                          borderRadius: 2,
                          transformOrigin: 'bottom',
                          background:
                            cardStatus === 'listening'
                              ? `rgba(99,102,241,${0.4 + h * 0.6})`
                              : 'rgba(255,255,255,0.1)',
                        }}
                      />
                    ))}
                  </div>

                  {/* 文字区 */}
                  <div ref={scrollRef} className="px-3 pb-3 pt-2" style={{ minHeight: 72 }}>
                    {/* 最新文本 */}
                    {latestText ? (
                      <motion.p
                        key={transcripts[transcripts.length - 1]?.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm leading-relaxed mb-2"
                        style={{ color: 'rgba(255,255,255,0.92)' }}
                      >
                        {latestText}
                      </motion.p>
                    ) : (
                      !showProcessing && (
                        <p className="text-xs py-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
                          开始说话，文本将实时显示...
                        </p>
                      )
                    )}

                    {/* 处理中指示 */}
                    <AnimatePresence>
                      {showProcessing && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1.5 mb-1"
                        >
                          <LoadingDots />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* 历史记录（小字） */}
                    {historyTexts.length > 0 && (
                      <div
                        className="mt-1 pt-1.5 space-y-1"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        {historyTexts.map((t) => (
                          <p
                            key={t.id}
                            className="text-xs truncate"
                            style={{ color: 'rgba(255,255,255,0.25)' }}
                            title={t.text}
                          >
                            {t.text}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── 子组件 ────────────────────────────────────────────────

function PulseDot({ status }: { status: CardStatus }) {
  const color =
    status === 'listening'
      ? 'rgba(99,102,241,0.9)'
      : status === 'error'
      ? 'rgba(248,113,113,0.9)'
      : 'rgba(251,191,36,0.8)';

  return (
    <motion.span
      animate={status === 'listening' ? { opacity: [1, 0.4, 1] } : {}}
      transition={{ repeat: Infinity, duration: 2 }}
      style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: color }}
    />
  );
}

function LoadingDots() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ repeat: Infinity, duration: 1, delay: i * 0.25 }}
          style={{ display: 'block', width: 4, height: 4, borderRadius: '50%', background: 'rgba(99,102,241,0.7)' }}
        />
      ))}
      <span className="text-xs ml-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
        识别中...
      </span>
    </>
  );
}

// ── 工具函数 ──────────────────────────────────────────────

function getSupportedMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

function mimeTypeToExt(mimeType: string): string {
  if (mimeType.includes('webm')) return '.webm';
  if (mimeType.includes('ogg')) return '.ogg';
  if (mimeType.includes('mp4')) return '.mp4';
  return '.webm';
}
