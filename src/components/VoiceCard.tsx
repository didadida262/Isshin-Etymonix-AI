import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

type Status = 'idle' | 'recording' | 'processing' | 'error';

interface Transcript {
  text: string;
  language: string;
  timestamp: number;
}

const MAX_RECORDS = 10;
const API_BASE = '/api';

export function VoiceCard() {
  const [expanded, setExpanded] = useState(true);
  const [status, setStatus] = useState<Status>('idle');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [recordSeconds, setRecordSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  const startRecording = useCallback(async () => {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: getSupportedMimeType() });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        await transcribe(blob, recorder.mimeType);
      };

      recorder.start(200);
      mediaRecorderRef.current = recorder;
      setStatus('recording');
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      setErrorMsg('无法访问麦克风，请检查权限');
      setStatus('error');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setStatus('processing');
  }, []);

  const transcribe = async (blob: Blob, mimeType: string) => {
    const form = new FormData();
    form.append('file', blob, `audio${mimeTypeToExt(mimeType)}`);

    try {
      const res = await fetch(`${API_BASE}/transcribe`, { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? '转录失败');
      }
      const data: { text: string; language: string } = await res.json();
      if (data.text) {
        setTranscripts((prev) =>
          [...prev, { text: data.text, language: data.language, timestamp: Date.now() }].slice(-MAX_RECORDS)
        );
      }
      setStatus('idle');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : '转录失败');
      setStatus('error');
    }
  };

  const handleMicClick = () => {
    if (status === 'recording') {
      stopRecording();
    } else if (status === 'idle' || status === 'error') {
      startRecording();
    }
  };

  const clearTranscripts = () => setTranscripts([]);

  return (
    <motion.div
      className="fixed bottom-5 right-5 z-50 select-none"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{ width: expanded ? 320 : 'auto', background: 'rgba(18,18,24,0.96)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: expanded ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
          <div className="flex items-center gap-2">
            <StatusDot status={status} />
            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
              语音识别
            </span>
            {status === 'recording' && (
              <span className="text-xs tabular-nums" style={{ color: 'rgba(248,113,113,0.9)' }}>
                {formatSeconds(recordSeconds)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {expanded && transcripts.length > 0 && (
              <button
                onClick={clearTranscripts}
                className="text-xs px-2 py-1 rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.35)', background: 'transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                title="清空记录"
              >
                清空
              </button>
            )}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
              title={expanded ? '收起' : '展开'}
            >
              {expanded ? '▾' : '▴'}
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {/* 文字记录区 */}
              <div
                ref={scrollRef}
                className="px-4 py-3 overflow-y-auto"
                style={{ minHeight: 80, maxHeight: 240 }}
              >
                {transcripts.length === 0 && status !== 'processing' && (
                  <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    点击下方按钮开始录音
                  </p>
                )}
                {transcripts.map((t) => (
                  <motion.div
                    key={t.timestamp}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 last:mb-0"
                  >
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.88)' }}>
                      {t.text}
                    </p>
                    <span className="text-xs mt-0.5 block" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {new Date(t.timestamp).toLocaleTimeString()}
                      {t.language ? ` · ${t.language}` : ''}
                    </span>
                  </motion.div>
                ))}
                {status === 'processing' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 py-2"
                  >
                    <LoadingDots />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      识别中...
                    </span>
                  </motion.div>
                )}
              </div>

              {/* 错误提示 */}
              <AnimatePresence>
                {status === 'error' && errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mx-4 mb-2 px-3 py-2 rounded-lg text-xs"
                    style={{ background: 'rgba(248,113,113,0.12)', color: 'rgba(248,113,113,0.9)', border: '1px solid rgba(248,113,113,0.2)' }}
                  >
                    {errorMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 录音按钮区 */}
              <div className="flex items-center justify-center py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <MicButton status={status} onClick={handleMicClick} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ---------- 子组件 ---------- */

function MicButton({ status, onClick }: { status: Status; onClick: () => void }) {
  const isRecording = status === 'recording';
  const isProcessing = status === 'processing';
  const disabled = isProcessing;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.92 }}
      whileHover={disabled ? {} : { scale: 1.06 }}
      className="relative flex items-center justify-center rounded-full transition-opacity"
      style={{
        width: 52,
        height: 52,
        background: isRecording
          ? 'rgba(239,68,68,0.9)'
          : isProcessing
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(99,102,241,0.85)',
        boxShadow: isRecording ? '0 0 0 0 rgba(239,68,68,0.5)' : 'none',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      animate={isRecording ? { boxShadow: ['0 0 0 0 rgba(239,68,68,0.5)', '0 0 0 10px rgba(239,68,68,0)'] } : {}}
      transition={isRecording ? { repeat: Infinity, duration: 1.2 } : {}}
      title={isRecording ? '点击停止' : '点击录音'}
    >
      {isProcessing ? (
        <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ) : isRecording ? (
        <span style={{ width: 14, height: 14, background: 'white', borderRadius: 3, display: 'block' }} />
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <line x1="12" y1="19" x2="12" y2="23" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="8" y1="23" x2="16" y2="23" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
    </motion.button>
  );
}

function StatusDot({ status }: { status: Status }) {
  const colorMap: Record<Status, string> = {
    idle: 'rgba(99,102,241,0.8)',
    recording: 'rgba(239,68,68,0.9)',
    processing: 'rgba(251,191,36,0.9)',
    error: 'rgba(248,113,113,0.9)',
  };
  return (
    <motion.span
      animate={status === 'recording' ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] } : {}}
      transition={status === 'recording' ? { repeat: Infinity, duration: 1 } : {}}
      style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: colorMap[status] }}
    />
  );
}

function LoadingDots() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
          style={{ display: 'block', width: 5, height: 5, borderRadius: '50%', background: 'rgba(99,102,241,0.8)' }}
        />
      ))}
    </div>
  );
}

/* ---------- 工具函数 ---------- */

function getSupportedMimeType(): string {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg', 'audio/mp4'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

function mimeTypeToExt(mimeType: string): string {
  if (mimeType.includes('webm')) return '.webm';
  if (mimeType.includes('ogg')) return '.ogg';
  if (mimeType.includes('mp4')) return '.mp4';
  return '.webm';
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}
